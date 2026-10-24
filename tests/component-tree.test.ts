// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { createElement as h, forwardRef, Fragment, memo, act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { buildTree, definitionOf, serializeProps } from '@/lib/live-edit/component-tree'
import { createPicker } from '@/lib/live-edit/picker'
import type { FromPreview } from '@/lib/live-edit/protocol'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// What scripts/babel-source-attr.mjs adds, written by hand
const call = (where: string, name: string) => ({ 'data-dos-call': `src/sections/account/components/${where}`, 'data-dos-name': name })
const src = (where: string, comp: string) => ({ 'data-dos-src': where, 'data-dos-comp': comp })

const Button = forwardRef<HTMLButtonElement, { variant?: string; children?: ReactNode; onClick?: () => void }>(function Button({ variant, ...props }, ref) {
  return h('button', { ref, ...props, className: `btn btn-${variant}`, ...src('src/ui/button.tsx:5:5', 'Button') })
})
const Badge = memo(function Badge({ label }: { label: string }) {
  return h('span', src('src/ui/badge.tsx:3:3', 'Badge'), label)
})
// A provider from a library: not marked, its children move up
const Provider = ({ children }: { children: ReactNode }) => h(Fragment, null, children)

function LoginForm({ items }: { items: string[] }) {
  return h(
    'form',
    src('src/sections/account/components/LoginForm.tsx:2:3', 'LoginForm'),
    h(Provider, null, items.map((i) => h(Badge, { key: i, label: i, ...call('LoginForm.tsx:4:7', 'Badge') }))),
    h(Button, { variant: 'primary', onClick: () => {}, ...call('LoginForm.tsx:6:5', 'Button') }, 'Sign in'),
  )
}
// The screen design preview, rendered by Design OS (no call site)
function Login() {
  return h('div', src('src/sections/account/Login.tsx:3:3', 'Login'), h(LoginForm, { items: ['a', 'b'], ...call('Login.tsx:4:5', 'LoginForm') }))
}
// Design OS around it
const Page = ({ children }: { children: ReactNode }) => h('main', null, children)

let root: Root | null = null
function mount(element: ReactNode) {
  document.body.innerHTML = '<div id="root"></div>'
  root = createRoot(document.getElementById('root')!)
  act(() => root!.render(element))
}
afterEach(() => {
  act(() => root?.unmount())
  root = null
})

const names = () => buildTree(document).nodes.map((n) => `${'  '.repeat(n.depth)}${n.name}${n.kind === 'component' ? '' : ' (el)'}`)

describe('component tree', () => {
  it('shows the product components and elements, not the wrappers around them', () => {
    mount(h(Page, null, h(Login)))
    expect(names()).toEqual([
      'Login',
      '  div (el)',
      '    LoginForm',
      '      form (el)',
      '        Badge',
      '          span (el)',
      '        Badge',
      '          span (el)',
      '        Button',
      '          button (el)',
    ])
  })

  it('knows call sites, list indexes, definitions and props', () => {
    mount(h(Page, null, h(Login)))
    const tree = buildTree(document)
    const badges = tree.nodes.filter((n) => n.name === 'Badge')
    expect(badges.map((n) => [n.call, n.index])).toEqual([
      ['src/sections/account/components/LoginForm.tsx:4:7', 0],
      ['src/sections/account/components/LoginForm.tsx:4:7', 1],
    ])
    const button = tree.find('component', 'src/sections/account/components/LoginForm.tsx:6:5', 0)!
    const fiber = tree.fiber(button.id)!
    expect(definitionOf(fiber)).toBe('src/ui/button.tsx:5:5')
    expect(serializeProps(fiber.memoizedProps)).toEqual([
      ['variant', '"primary"'],
      ['onClick', 'ƒ'],
    ])
    expect(tree.nodeOfElement(document.querySelector('button')!)).toBe(tree.nodes.find((n) => n.name === 'button')!.id)
  })

  it('shows a component once when memo or a wrapper hands its props on', () => {
    mount(h(Page, null, h(Login)))
    // memo(Badge) is a MemoComponent fiber around the function: one node per badge
    expect(buildTree(document).nodes.filter((n) => n.name === 'Badge')).toHaveLength(2)
  })

  it('serializes props for reading', () => {
    expect(serializeProps({ a: 'x'.repeat(100), b: 2, c: true, d: null, e: [1, 2], f: { x: 1 }, g: h(Badge, { label: 'x', 'data-dos-name': 'Badge' } as { label: string }), m: h(Badge, { label: 'x' }), children: 'no', className: 'no', 'data-dos-call': 'no', u: undefined })).toEqual([
      ['a', `"${'x'.repeat(80)}…"`],
      ['b', '2'],
      ['c', 'true'],
      ['d', 'null'],
      ['e', '[2]'],
      ['f', '{…}'],
      ['g', '<Badge />'],
      ['m', expect.stringMatching(/^<Badge\d* \/>$/)],
    ])
  })
})

describe('picker with the tree', () => {
  it('sends the tree, selects a component by node and again by call site', () => {
    mount(h(Page, null, h(Login)))
    const sent: FromPreview[] = []
    const picker = createPicker(document, (m) => sent.push(m))
    picker.sendTree()
    const tree = sent.find((m) => m.type === 'dos:tree')
    expect(tree?.type === 'dos:tree' && tree.nodes.length).toBe(10)
    const nodes = tree?.type === 'dos:tree' ? tree.nodes : []
    const button = nodes.find((n) => n.name === 'Button')!

    picker.selectNode(button.id)
    const picked = sent.find((m) => m.type === 'dos:picked')
    expect(picked?.type === 'dos:picked' && picked.element).toMatchObject({
      kind: 'component',
      src: 'src/sections/account/components/LoginForm.tsx:6:5',
      index: 0,
      component: 'Button',
      componentPath: ['Login', 'LoginForm', 'Button'],
      definition: 'src/ui/button.tsx:5:5',
      tag: 'button',
      classes: ['btn', 'btn-primary'],
      textOnly: false,
    })

    // Selecting an element node reports it like a click, with its node
    const span = nodes.filter((n) => n.name === 'span')[1]
    picker.selectNode(span.id)
    const last = sent.at(-1)
    expect(last?.type === 'dos:picked' && last.element).toMatchObject({ src: 'src/ui/badge.tsx:3:3', index: 1, nodeId: span.id })
    picker.select('src/sections/account/components/LoginForm.tsx:6:5', 0, 'component')
    picker.destroy()
  })
})
