---
name: 09-screenshot-design
description: "Step 9: Capture a screenshot of a screen design using Playwright. Saves screenshots to the product folder for documentation purposes."
handoffs:
  - label: Shape Next Section
    agent: 06-shape-section
    prompt: "Screenshot captured. Shape the next section in the roadmap."
  - label: Assemble Clickdummy
    agent: 10-clickdummy
    prompt: "All sections are designed. Assemble the navigable clickdummy."
---

Refer to @agents.md for the full Design OS context, file structure, and conventions.

**Important:** Whenever you need to ask the user a question or clarify something, always use the `ask_questions` tool to present interactive multiple-choice questions. Never write out questions as plain text in your response — always use the tool. This keeps the conversation efficient and easy to respond to.

# Screenshot Screen Design

You are helping the user capture a screenshot of a screen design they've created. The screenshot will be saved to the product folder for documentation purposes.

## Prerequisites: Browser/Screenshot Tool

Before proceeding, verify that you have access to a browser automation or screenshot tool (such as Playwright MCP or similar). If no browser tool is available, let the user know they need to configure one.

## Step 1: Identify the Screen Design

First, determine which screen design to screenshot.

Read `product/product-roadmap.md` to get the list of available sections, then check `src/sections/` to see what screen designs exist.

If only one screen design exists across all sections, auto-select it.

If multiple screen designs exist, ask which one to screenshot:

"Which screen design would you like to screenshot?"

Present the available screen designs as options, grouped by section:
- [Section Name] / [ScreenDesignName]
- [Section Name] / [ScreenDesignName]

**Along a user flow.** If flows exist (`product/flows/`), also offer: "All screens of a flow, in step order". For the chosen flow run `npm run -s context -- --flow <flow-id>` (see the `designos-context` skill) and capture each step that has a screen design, in step order. Save each as `product/sections/[section-id]/flow-[flow-id]-[step-id]-[screen-design-name].png` in the section the screen belongs to. Steps without a screen design are skipped and listed in the confirmation; never substitute another screen.

## Step 2: Start the Dev Server

Start the dev server yourself by running `npm run dev` in the background so you can continue with the screenshot capture.

Do NOT ask the user if the server is running or tell them to start it. You must start it yourself.

After starting the server, wait a few seconds for it to be ready before navigating to the screen design URL.

## Step 3: Capture the Screenshot

Use the browser automation tool to navigate to the screen design and capture a screenshot.

The screen design URL pattern is: `http://localhost:3000/preview.html#/screen/[section-id]/[screen-design-name]` (the prototype preview: it renders only the screen design, in the prototype's own stylesheet and theme, without the Design OS app shell, chat and step panel; the old `/fullscreen` URL redirects there)

1. First, navigate to the screen design URL
2. Wait for the page to fully load
3. **Click the "Hide" link** in the navigation bar to hide it before taking the screenshot. The Hide button has the attribute `data-hide-header` which you can use to locate it.
4. Capture the page (without the navigation bar)

**Screenshot specifications:**
- Capture at desktop viewport width (1280px recommended)
- Use **full page screenshot** to capture the entire scrollable content (not just the viewport)
- PNG format for best quality

## Step 4: Save the Screenshot

Save the screenshot to the product folder:

```
product/sections/[section-id]/[filename].png
```

**Naming convention:** `[screen-design-name]-[variant].png`

Examples:
- `invoice-list.png` (main view)
- `invoice-list-dark.png` (dark mode variant)
- `invoice-detail.png`
- `invoice-form-empty.png` (empty state)

If the user wants both light and dark mode screenshots, capture both.

## Step 5: Confirm Completion

Let the user know:

"I've saved the screenshot to `product/sections/[section-id]/[filename].png`.

The screenshot captures the **[ScreenDesignName]** screen design for the **[Section Title]** section."

If they want additional screenshots (e.g., dark mode, different states):

"Would you like me to capture any additional screenshots? For example:
- Dark mode version
- Mobile viewport
- Different states (empty, loading, etc.)"

## Important Notes

- Start the dev server yourself - do not ask the user to do it
- Screenshots are saved to `product/sections/[section-id]/` alongside spec.md and data.json
- Use descriptive filenames that indicate the screen design and any variant (dark mode, mobile, etc.)
- Capture at a consistent viewport width for documentation consistency
- Always capture full page screenshots to include all scrollable content
- After you're done, you may kill the dev server if you started it
