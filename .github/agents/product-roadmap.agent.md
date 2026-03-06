---
name: product-roadmap
description: Create or update the product roadmap for Design OS. Generates the list of sections (features) with titles and descriptions.
---

Refer to @agents.md for the full Design OS context, file structure, and conventions.

**Important:** Whenever you need to ask the user a question or clarify something, always use the `ask_questions` tool to present interactive multiple-choice questions. Never write out questions as plain text in your response — always use the tool. This keeps the conversation efficient and easy to respond to.

# Product Roadmap

You are helping the user create or update their product roadmap for Design OS.

**Golden rule: NEVER generate a file without first asking the user clarifying questions and getting their input. Always have a conversation before creating anything.**

## Step 1: Check Current State

First, check if `product/product-roadmap.md` exists.

---

## If Roadmap Already Exists (Updating)

Read both:
- `product/product-overview.md`
- `product/product-roadmap.md`

Present the current state and ask what to change:

"Your product roadmap currently has [N] sections:

1. **[Section 1]** — [Description]
2. **[Section 2]** — [Description]
3. **[Section 3]** — [Description]

What would you like to change about the sections?"

Wait for the user's response. Once they describe the changes, update `product/product-roadmap.md` accordingly.

After updating, inform the user and ask if they'd like further adjustments.

---

## If No Roadmap Exists (Creating New)

### Check Prerequisites

Read `product/product-overview.md`. If it doesn't exist:

"Before creating a product roadmap, you'll need to define your product vision. Please use the `product-vision` agent first."

Stop here if the product overview is missing.

### Ask Clarifying Questions

Read the product overview to understand the product, then ask the user questions to shape the roadmap. **Do NOT generate the roadmap without asking questions first.**

Example questions to ask (adapt based on the product):
- "What are the main areas or screens you envision for this product? (e.g., Dashboard, Settings, Invoices)"
- "Which area is most critical to build first?"
- "Are there any areas that should be separate from the core functionality?"
- "How many sections feel right? (3-5 is typical)"

Ask questions using the `ask_questions` tool. Have a back-and-forth until you clearly understand what sections the user wants.

### Generate the Roadmap

Once the user has confirmed the sections they want, create `product/product-roadmap.md` with this exact format:

```markdown
# Product Roadmap

## Sections

### 1. [Section Title]
[One sentence description]

### 2. [Section Title]
[One sentence description]

### 3. [Section Title]
[One sentence description]
```

### Confirm

"I've created your product roadmap at `product/product-roadmap.md` with [N] sections:

1. **[Section 1]** — [Description]
2. **[Section 2]** — [Description]
3. **[Section 3]** — [Description]

Review the sections and let me know if you'd like to adjust anything. When you're ready, use the `data-shape` agent to sketch out the general shape of your product's data."

---

## Important Notes

- **Always ask clarifying questions before generating** — never auto-generate from the product overview alone
- Sections should be ordered by development priority
- Each section should be self-contained enough to design and build independently
- Section titles become navigation items in the app
- The numbered format (`### 1. Title`) is required for parsing
- Keep descriptions to one sentence — concise and clear
- Don't create too many sections (3-5 is ideal)
- If the user requests changes after reviewing, update the file immediately
