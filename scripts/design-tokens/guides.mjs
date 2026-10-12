/**
 * Parse the imported guidance documents (Figma DESIGN.md + typeui skill.md) into
 * structured, deterministic data. Token values in these documents are NOT used —
 * tokens.json (DTCG) is the single source of truth. Only guidance that has no
 * DTCG equivalent is kept (rules, tone, gradients, effects, text styles, components).
 */

import { hexToOklchCss } from './color.mjs'
import { slug } from './classify.mjs'

/** Minimal frontmatter parser for flat `key: value` YAML. */
export function parseFrontmatter(markdown) {
  const text = markdown.replace(/\r\n/g, '\n')
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text)
  if (!match) return { data: {}, body: text }
  const data = {}
  for (const line of match[1].split('\n')) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim()
  }
  return { data, body: text.slice(match[0].length) }
}

/** Split a markdown body into `## ` sections. Returns { title, sections: [{ heading, lines }] }. */
export function parseSections(body) {
  const lines = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
  let title = null
  const sections = []
  let current = null
  for (const line of lines) {
    const h1 = /^#\s+(.+)$/.exec(line)
    const h2 = /^##\s+(.+)$/.exec(line)
    if (h1 && !title && !current) {
      title = h1[1].trim()
    } else if (h2) {
      current = { heading: h2[1].trim(), lines: [] }
      sections.push(current)
    } else if (current) {
      current.lines.push(line)
    }
  }
  for (const s of sections) {
    while (s.lines.length && !s.lines[0].trim()) s.lines.shift()
    while (s.lines.length && !s.lines[s.lines.length - 1].trim()) s.lines.pop()
  }
  return { title, sections }
}

const bullets = (lines) =>
  lines.filter((l) => /^\s*[-*]\s+/.test(l)).map((l) => l.replace(/^\s*[-*]\s+/, '').trim())

const paragraph = (lines) => lines.map((l) => l.trim()).filter(Boolean).join(' ')

/**
 * Repair bullet lists that an exporter split on commas:
 *   "- Use tokens: a" "- b" "- c." -> "Use tokens: a, b, c."
 * A bullet that contains ":" and does not end in "." starts a run; following
 * bullets are joined until one ends in ".".
 */
export function repairSplitBullets(items) {
  const out = []
  let run = null
  for (const item of items) {
    if (run) {
      run.push(item)
      if (/\.$/.test(item)) {
        out.push(run.join(', '))
        run = null
      }
      continue
    }
    if (item.includes(':') && !/\.$/.test(item)) run = [item]
    else out.push(item)
  }
  if (run) out.push(run.join(', '))
  return out
}

/** "Primary Gredient: gradient_linear(#0BA4A1 0% | #6D28D9 100%)" */
function parseGradient(line) {
  const m = /^(.+?):\s*gradient_(linear|radial|angular|diamond)\((.*)\)$/.exec(line)
  if (!m) return null
  const complete = !m[3].includes('...')
  const stops = m[3]
    .split('|')
    .map((s) => s.trim())
    .map((s) => /^(#[0-9a-fA-F]{3,8})\s+([\d.]+%)$/.exec(s))
    .filter(Boolean)
    .map(([, hex, position]) => ({ hex: hex.toLowerCase(), oklch: hexToOklchCss(hex), position }))
  return {
    name: slug(m[1]),
    label: m[1].trim(),
    kind: m[2],
    complete,
    stops,
    css: complete && stops.length >= 2 ? `linear-gradient(${stops.map((s) => `${s.oklch} ${s.position}`).join(', ')})` : null,
    raw: line,
  }
}

/** "Light/bg-blur/sm: background_blur 4px" */
function parseBlur(line) {
  const m = /^(.+?):\s*(background_blur|layer_blur)\s+([\d.]+)px$/.exec(line)
  if (!m) return null
  return { name: slug(m[1]), label: m[1].trim(), kind: m[2] === 'background_blur' ? 'backdrop-blur' : 'blur', px: Number(m[3]) }
}

/** "Tailwind/XS/Semi Bold: Inter Semi Bold, 12px / 16px, tracking 0%" */
const WEIGHT_WORDS = ['Extra Light', 'Semi Bold', 'Extra Bold', 'Thin', 'Light', 'Regular', 'Medium', 'Bold', 'Black']
function parseTextStyle(line) {
  const m = /^(.+?):\s*(.+?),\s*([\d.]+)px\s*\/\s*([\d.]+)px(?:,\s*tracking\s*(-?[\d.]+%))?$/.exec(line)
  if (!m) return null
  const font = m[2].trim()
  const weightWord = WEIGHT_WORDS.find((w) => font.endsWith(` ${w}`)) ?? 'Regular'
  const family = font.endsWith(` ${weightWord}`) ? font.slice(0, -(weightWord.length + 1)) : font
  const label = m[1].trim()
  return {
    name: slug(label.replace(/^Tailwind\//i, '')),
    label,
    family,
    weight: weightWord,
    sizePx: Number(m[3]),
    lineHeightPx: Number(m[4]),
    tracking: m[5] ?? '0%',
  }
}

/** "Style=Primary, Size=sm, Shape=Round, Stats=Default" */
function parseVariant(line) {
  if (!/^[^=,]+=[^,]+(,\s*[^=,]+=[^,]+)*$/.test(line)) return null
  return line.split(',').map((pair) => pair.split('=').map((s) => s.trim()))
}

// Sections handled explicitly. Everything else is kept verbatim (lossless).
const DESIGN_MD_SUPERSEDED = ['Spacing Tokens', 'Radius Tokens', 'Motion Tokens']
const DESIGN_MD_DROPPED = ['Editing Notes']
const SKILL_SUPERSEDED = ['Style Foundations']
const SKILL_DROPPED = [
  'Component Families', // duplicate of DESIGN.md "Component Families"
  'Guideline Authoring Workflow',
  'Required Output Structure',
  'Acceptance Checklist',
  'TypeUI + Agentic Integration',
]

/**
 * @param {{ designMd?: string|null, skillMd?: string|null }} input
 */
export function parseGuides({ designMd = null, skillMd = null } = {}) {
  const guides = {
    name: null,
    title: null,
    description: null,
    source: { figmaFile: null, figmaPage: null },
    variableCollections: [],
    mission: null,
    brand: [],
    writingTone: null,
    accessibility: [],
    rulesDo: [],
    rulesDont: [],
    componentRules: [],
    qualityGates: [],
    gradients: [],
    effects: [],
    textStyles: [],
    gridStyles: [],
    components: { families: [], variantAxes: [] },
    additional: [],
    sections: [],
  }
  const track = (file, heading, status, reason) => guides.sections.push({ file, heading, status, reason })

  if (designMd) {
    const { data, body } = parseFrontmatter(designMd)
    const { title, sections } = parseSections(body)
    guides.name = data.name ?? null
    guides.title = data.source_file ?? (title ? title.replace(/\s+Design Guidelines$/i, '') : null)
    guides.source.figmaFile = data.source_file ?? null
    guides.source.figmaPage = data.source_page ?? null

    for (const section of sections) {
      const items = bullets(section.lines)
      const h = section.heading
      if (h === 'Source') {
        track('DESIGN.md', h, 'used', 'Provenance')
      } else if (h === 'Variable Collections') {
        guides.variableCollections = items
        track('DESIGN.md', h, 'used', 'Provenance')
      } else if (h === 'Color Tokens') {
        for (const item of items) {
          const gradient = parseGradient(item)
          if (gradient) guides.gradients.push(gradient)
        }
        track('DESIGN.md', h, 'partial', 'Gradients kept; color values superseded by tokens.json; image fills and aliases dropped')
      } else if (h === 'Typography Tokens') {
        for (const item of items) {
          const style = parseTextStyle(item)
          if (style) guides.textStyles.push(style)
        }
        track('DESIGN.md', h, 'used', 'Parsed into text styles')
      } else if (h === 'Effect Styles') {
        for (const item of items) {
          const blur = parseBlur(item)
          if (blur) guides.effects.push(blur)
        }
        track('DESIGN.md', h, 'partial', 'Blur effects kept; drop shadows superseded by tokens.json')
      } else if (h === 'Grid Styles') {
        guides.gridStyles = items.filter((i) => !/^No local grid styles/i.test(i))
        track('DESIGN.md', h, 'used', guides.gridStyles.length ? 'Grid styles' : 'Empty')
      } else if (h === 'Component Families') {
        const axes = new Map()
        for (const item of items) {
          const variant = parseVariant(item)
          if (!variant) {
            if (!guides.components.families.includes(item)) guides.components.families.push(item)
            continue
          }
          for (const [axis, value] of variant) {
            if (!axes.has(axis)) axes.set(axis, [])
            if (!axes.get(axis).includes(value)) axes.get(axis).push(value)
          }
        }
        guides.components.variantAxes = [...axes].map(([axis, values]) => ({ axis, values }))
        track('DESIGN.md', h, 'used', 'Families and variant axes')
      } else if (DESIGN_MD_SUPERSEDED.includes(h)) {
        track('DESIGN.md', h, 'superseded', 'Values come from tokens.json')
      } else if (DESIGN_MD_DROPPED.includes(h)) {
        track('DESIGN.md', h, 'dropped', 'Exporter instructions, not design guidance')
      } else {
        guides.additional.push({ file: 'DESIGN.md', heading: h, lines: section.lines })
        track('DESIGN.md', h, 'verbatim', 'Unknown section kept as-is')
      }
    }
  }

  if (skillMd) {
    const { data, body } = parseFrontmatter(skillMd)
    const { title, sections } = parseSections(body)
    guides.description = data.description ?? null
    guides.title = guides.title ?? title ?? null
    guides.name = guides.name ?? (data.name ? data.name.replace(/^design-system-/, '') : null)

    for (const section of sections) {
      const items = bullets(section.lines)
      const h = section.heading
      if (h === 'Mission') {
        guides.mission = paragraph(section.lines)
        track('skill.md', h, 'used', 'Overview')
      } else if (h === 'Brand') {
        guides.brand = items
        track('skill.md', h, 'used', 'Overview')
      } else if (h === 'Writing Tone') {
        guides.writingTone = paragraph(section.lines)
        track('skill.md', h, 'used', 'Overview')
      } else if (h === 'Accessibility') {
        guides.accessibility = items
        track('skill.md', h, 'used', 'Accessibility')
      } else if (h === 'Rules: Do') {
        guides.rulesDo = repairSplitBullets(items)
        track('skill.md', h, 'used', 'Rules (comma-split bullets repaired)')
      } else if (h === "Rules: Don't") {
        guides.rulesDont = repairSplitBullets(items)
        track('skill.md', h, 'used', 'Rules')
      } else if (h === 'Component Rule Expectations') {
        guides.componentRules = items
        track('skill.md', h, 'used', 'Rules')
      } else if (h === 'Quality Gates') {
        guides.qualityGates = items
        track('skill.md', h, 'used', 'Rules')
      } else if (SKILL_SUPERSEDED.includes(h)) {
        track('skill.md', h, 'superseded', 'Values come from tokens.json')
      } else if (SKILL_DROPPED.includes(h)) {
        track('skill.md', h, 'dropped', 'Authoring meta or duplicate of DESIGN.md')
      } else {
        guides.additional.push({ file: 'skill.md', heading: h, lines: section.lines })
        track('skill.md', h, 'verbatim', 'Unknown section kept as-is')
      }
    }
  }

  return guides
}

