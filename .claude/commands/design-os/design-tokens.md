# Design System

You are helping the user define the complete visual identity for their product. This includes:

**Important:** Ask every question with the `AskUserQuestion` tool (structured multiple choice), never as plain prose: 2–4 options, your recommendation first with the suffix `(Recommended)`, `multiSelect: true` for non-exclusive choices, up to 4 independent questions per call, no own "Other" option (it is added automatically), short labels.

- **Colors** — Primary, secondary, and neutral palettes (required)
- **Typography** — Heading, body, and mono fonts (required)
- **Brand Personality** — Adjectives and mood (optional)
- **Brand Voice** — Tone and communication style (optional)
- **UI Style** — Border radius, shadows, density preferences (optional)
- **Logo Guidelines** — Usage rules if they have logos (optional)

## Step 1: Check Prerequisites

First, verify that the product overview exists:

Read `product/product-overview.md` to understand what the product is.

If it doesn't exist:

"Before defining your design system, you'll need to establish your product vision. Please run `/design-os:product-vision` first."

Stop here if the prerequisite is missing.

**Product truth (`product/PRODUCT.md`).** If `product/PRODUCT.md` does not exist and `product/product-overview.md` does, create it first with the `designos-product-md` skill (`.claude/skills/designos-product-md/SKILL.md`) (mode `create`, one confirmation), then go on with this step. If the user picks **Later**, continue without it.

## Step 1a: Load the Tech Stack

Run `npm run -s techstack` and follow the `designos-techstack` skill, section "Applying the stack" (`.claude/skills/designos-techstack/SKILL.md`).

- Tell the user in one line which stack applies: `product/techstack/techstack.md`, or "defaults: shadcn/ui, lucide-react".
- The decisions are binding. Undecided means no new dependency.
- A request the stack cannot serve is a conflict: show it to the user and offer `/design-os:techstack update`. Never edit `product/techstack/techstack.md` from this step.
- **This step:** the colors must cover the semantic roles the UI library expects, so `DESIGN.md` maps one to one. For shadcn/ui: primary, secondary, muted, accent, destructive, background, foreground, card, popover, border, input, ring. On the token import path, check this against `DESIGN.md` and report missing roles to the user. On the interview path, pick palettes from which every role can be assigned.
- Fonts and radius are the design system's. The stack's `ui-style` never overrides them.

## Step 1b: Check for Imported Design Tokens (DTCG)

Check if `product/design-system/import/tokens.json` exists. This is the **token import path** — a Figma/DTCG export that replaces the interview for colors, typography, spacing, radius and shadows.

```
product/design-system/import/        # inputs (never edited by agents)
├── tokens.json   (required)  W3C DTCG tokens, e.g. Figma variables export
├── DESIGN.md     (optional)  Figma style export: gradients, text styles, effects, components
└── skill.md      (optional)  typeui guidance: mission, rules, accessibility, tone
        │  npm run tokens:build   (Style Dictionary, deterministic + idempotent)
        ▼
product/design-system/
├── tokens/tokens.css    Tailwind v4 theme: :root/.dark + @theme, colors in OKLCH
├── tokens/tokens.json   normalized model the Design OS app renders (schema designos-tokens/v1)
└── DESIGN.md            merged guide: tokens + DESIGN.md + skill.md + import report
```

If `import/tokens.json` exists:

1. Run `npm run tokens:build` (or `npm run tokens:check` to verify the outputs are current). Never hand-edit the generated files — fix the inputs and rebuild. Same inputs always produce byte-identical outputs.
2. Read `product/design-system/DESIGN.md` and summarize for the user: semantic colors, fonts, the warnings from section 12 (import report).
3. Ask whether they also want to define brand personality, voice and UI style preferences. Only those go into `design-system.json`; colors and typography come from the import. Do not duplicate token values in `design-system.json` or `design-system.md`.
4. Continue with Step 8 (confirm). The Design page in the app shows the imported system at `/design`.

If `import/` does not exist, continue with Step 2 (interview path).

## Step 2: Check for Existing Design System

Check if `product/design-system/design-system.json` already exists.

If it exists, also check if there are new or modified files in `product/design-system/resources/` by comparing any stored resource references with the current files in the folder.

If a design system exists and resources have changed:

"I found an existing design system, but it looks like the resources folder has changed since it was generated.

Would you like to:

1. **Update** — Re-analyze resources and update the design system
2. **Keep existing** — Continue using the current design system
3. **Review changes** — Show me what's different before deciding"

Wait for their response and proceed accordingly.

If a design system exists and no changes detected:

"You already have a design system. Would you like to:

1. **View it** — Review the current design system
2. **Update** — Make changes to colors, fonts, or brand identity
3. **Continue** — Keep the existing system and move to shell design"

## Step 3: Check for Brand Resources

List the contents of `product/design-system/resources/` to see what brand assets are available.

If the folder doesn't exist or is empty:

"Let's define your design system for **[Product Name]**.

**Do you have existing brand assets?**

If yes, create a folder at `product/design-system/resources/` and add:
- Logo files (SVG, PNG)
- Style guides (PDF, images of brand guidelines)
- Color palette images or swatches
- Font files or font names
- Mood board images

Then run this command again.

If no, we'll build your visual identity from scratch through a few questions.

Which would you prefer?"

If they want to proceed without resources, skip to Step 5 (Design Interview).

## Step 4: Analyze Brand Resources

For each file in `product/design-system/resources/`, analyze its contents:

### Image Files (PNG, JPG, SVG)

Use vision to analyze:
- **Logos**: Extract dominant colors, identify font styles if text is present, note the visual style (minimal, detailed, geometric, organic)
- **Color palettes**: Extract the specific colors shown, note any labels or names
- **Mood boards**: Identify the overall aesthetic, key colors, textures, and visual themes
- **Style guide pages**: Extract any visible color codes, font names, spacing guidelines, or usage rules

### Text/Document Files (MD, TXT, PDF)

Read and extract:
- Color specifications (hex codes, Pantone, RGB)
- Font names and weights
- Voice and tone guidelines
- Logo usage rules
- Spacing and layout guidelines

### Font Files (TTF, OTF, WOFF)

Note the font family names for typography recommendations.

After analyzing all resources, summarize what you found:

"I've analyzed your brand resources. Here's what I found:

**Colors:**
- [List extracted colors with their apparent uses]

**Typography:**
- [List identified fonts]

**Visual Style:**
- [Describe the overall aesthetic]

**Brand Voice:** (if found)
- [Describe tone and characteristics]

**Logo Guidelines:** (if found)
- [Summarize usage rules]

Does this look accurate? Is there anything I missed or got wrong?"

Wait for confirmation or corrections.

## Step 5: Design Interview

Conduct a focused interview to define the design system. If resources were analyzed, use those findings as defaults and only ask about gaps.

### If building from scratch (no resources):

"Let's define your visual identity for **[Product Name]**. I'll ask a few questions.

**First, about your audience:**
Who are your primary users? What do they value?"

Then proceed through these areas:

#### Colors

"For colors, we'll pick from Tailwind's palette so they work seamlessly with your screen designs.

**Primary color** (main accent, buttons, links):
Common choices: `blue`, `indigo`, `violet`, `emerald`, `teal`, `amber`, `rose`, `lime`

**Secondary color** (complementary accent, tags, highlights):
Should complement your primary — often a different hue or a neutral variation

**Neutral color** (backgrounds, text, borders):
Options: `slate` (cool gray), `gray` (pure gray), `zinc` (slightly warm), `neutral`, `stone` (warm gray)

Based on [Product Name], I'd suggest:
- **Primary:** [suggestion] — [why it fits]
- **Secondary:** [suggestion] — [why it complements]
- **Neutral:** [suggestion] — [why it works]

What feels right for your product?"

#### Typography

"For typography, we'll use Google Fonts for easy web integration.

**Heading font** (titles, section headers):
Popular choices: `DM Sans`, `Inter`, `Poppins`, `Manrope`, `Space Grotesk`, `Outfit`

**Body font** (paragraphs, UI text):
Often the same as heading, or: `Inter`, `Source Sans 3`, `Nunito Sans`, `Open Sans`

**Mono font** (code, technical content):
Options: `IBM Plex Mono`, `JetBrains Mono`, `Fira Code`, `Source Code Pro`

My suggestions for [Product Name]:
- **Heading:** [suggestion] — [why]
- **Body:** [suggestion] — [why]
- **Mono:** [suggestion] — [why]

What do you prefer?"

#### Brand Personality (optional but recommended)

"**Brand Personality** helps keep designs and copy consistent.

If your product were a person, how would you describe them?
Pick 3-5 adjectives: professional, friendly, bold, minimal, playful, sophisticated, technical, approachable, innovative, trustworthy, energetic, calm

What's the overall mood or feeling users should get?"

#### UI Style Preferences (optional)

"**UI Style** guides how components look across your screens.

- **Border radius**: squared, subtle (rounded-sm), moderate (rounded-md), rounded (rounded-lg), very rounded (rounded-xl)
- **Shadows**: none, subtle, medium, dramatic
- **Density**: compact, comfortable, spacious

Any preferences, or should I suggest based on your brand personality?"

### If supplementing analyzed resources:

Only ask about aspects not covered by the analysis. For example, if colors were found but voice wasn't:

"I have a good sense of your visual identity from the resources. A few more questions to complete the picture:

**Brand Voice**: How should your product communicate? What tone should copy and labels use?"

## Step 6: Present Final Design System

Compile all choices into a summary:

"Here's your complete design system for **[Product Name]**:

## Colors
- **Primary**: `[color]` — [usage notes]
- **Secondary**: `[color]` — [usage notes]
- **Neutral**: `[color]` — [usage notes]

## Typography
- **Heading**: [Font Name]
- **Body**: [Font Name]
- **Mono**: [Font Name]

## Brand Personality
- **Adjectives**: [list]
- **Mood**: [description]

## Brand Voice
- **Tone**: [description]
- **Characteristics**: [list]

## UI Style
- **Border radius**: [preference]
- **Shadows**: [preference]
- **Density**: [preference]

Does this look good? Ready to save it?"

Iterate until approved.

## Step 7: Create the Design System Files

Once approved, create:

**File 1:** `product/design-system/design-system.json`

```json
{
  "colors": {
    "primary": "[tailwind-color]",
    "secondary": "[tailwind-color]",
    "neutral": "[tailwind-color]"
  },
  "typography": {
    "heading": "[Font Name]",
    "body": "[Font Name]",
    "mono": "[Font Name]"
  },
  "personality": {
    "adjectives": ["adjective1", "adjective2", "adjective3"],
    "mood": "[overall feeling]"
  },
  "voice": {
    "tone": "[tone description]",
    "characteristics": ["characteristic1", "characteristic2"],
    "writingStyle": "[style notes]"
  },
  "uiStyle": {
    "borderRadius": "[rounded-sm/rounded-md/rounded-lg/rounded-xl]",
    "shadows": "[none/subtle/medium/dramatic]",
    "density": "[compact/comfortable/spacious]"
  },
  "logo": {
    "primaryFile": "[filename in resources/ or null]",
    "usageNotes": "[any constraints or null]"
  },
  "resources": ["[list of files in resources/ folder]"],
  "generatedAt": "[ISO date]"
}
```

**Notes:**
- Only include `personality`, `voice`, `uiStyle`, and `logo` sections if the user provided that information
- `colors` and `typography` are always required
- `resources` array lists any files in the resources folder

**File 2:** `product/design-system/design-system.md` (human-readable documentation)

```markdown
# Design System: [Product Name]

> Generated on [date]

## Colors

### Primary: `[color]`
[Usage: buttons, links, key actions]

### Secondary: `[color]`
[Usage: tags, highlights, secondary elements]

### Neutral: `[color]`
[Usage: backgrounds, text, borders]

---

## Typography

### Headings: [Font Name]
[Usage and recommended weights]

### Body: [Font Name]
[Usage and recommended weights]

### Monospace: [Font Name]
[Usage for code and technical content]

---

## Brand Personality

**Adjectives:** [comma-separated list]

**Mood:** [overall feeling the brand should evoke]

---

## Brand Voice

**Tone:** [description]

**Key Characteristics:**
- [Characteristic 1]
- [Characteristic 2]
- [Characteristic 3]

---

## UI Style Preferences

| Property      | Value   | Notes                 |
| ------------- | ------- | --------------------- |
| Border Radius | [value] | [when to use]         |
| Shadows       | [value] | [when to use]         |
| Density       | [value] | [information density] |

---

## Logo Guidelines

**Primary Logo:** `resources/[filename]` (if applicable)

[Usage notes]

---

_This design system informs all screen designs and the application shell. The `/design-os:design-shell` and `/design-os:design-screen` commands will reference these tokens and preferences._
```

## Step 7b: Update Google Fonts in index.html

After saving the design system files, update `index.html` to load the chosen fonts from Google Fonts.

Find the existing Google Fonts `<link>` tag in `index.html` and **add** the product's heading, body, and mono fonts to it (if not already present). Keep the existing DM Sans and IBM Plex Mono fonts — those are used by Design OS itself.

For example, if the user chose `Nunito Sans` for heading/body and `JetBrains Mono` for mono, the link should include `&family=Nunito+Sans:wght@400;500;600;700;800&family=JetBrains+Mono` appended to the existing URL.

**Important:** Do not remove the existing fonts (DM Sans, IBM Plex Mono). Only add the new product fonts.

## Step 8: Confirm Completion

Let the user know:

"I've saved your design system:
- `product/design-system/design-system.json` — Structured data for commands
- `product/design-system/design-system.md` — Human-readable documentation

**Your palette:**
- Primary: `[color]` — for buttons, links, key actions
- Secondary: `[color]` — for tags, highlights, secondary elements
- Neutral: `[color]` — for backgrounds, text, borders

**Your fonts:**
- [Heading Font] for headings
- [Body Font] for body text
- [Mono Font] for code

These will be used when creating screen designs for your sections.

Next step: Run `/design-os:design-shell` to design your application's navigation and layout."

---

## Reference: Tailwind Color Palette

Available colors (each has shades 50-950):
- **Warm:** `red`, `orange`, `amber`, `yellow`, `lime`
- **Cool:** `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`
- **Purple:** `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`
- **Neutral:** `slate`, `gray`, `zinc`, `neutral`, `stone`

## Reference: Popular Google Font Pairings

- **Modern & Clean:** DM Sans + DM Sans + IBM Plex Mono
- **Professional:** Inter + Inter + JetBrains Mono
- **Friendly:** Nunito Sans + Nunito Sans + Fira Code
- **Bold & Modern:** Space Grotesk + Inter + Source Code Pro
- **Editorial:** Playfair Display + Source Sans 3 + IBM Plex Mono
- **Tech-forward:** JetBrains Mono + Inter + JetBrains Mono

## Important Notes

- Colors should be Tailwind palette names (not hex codes)
- Fonts should be exact Google Fonts names
- Keep suggestions contextual to the product type
- The mono font is optional but recommended for any product with code/technical content
- Design system applies to screen designs only — the Design OS app keeps its own aesthetic
- Brand resources are optional — users can define everything through conversation
- Personality and voice help maintain consistency across the product
