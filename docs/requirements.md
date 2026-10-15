# Requirements

## Running Design OS

Design OS runs locally on your machine. You'll need:

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **VS Code** with **GitHub Copilot** — Design OS uses custom Copilot agents (in `.github/agents/`) to guide the design process through interactive conversations in Copilot Chat

## Installing Your Exported Components

When you export your designs, you get production-ready React components. Your target codebase needs:

### Required

- **React** (v18 or higher)
- **Tailwind CSS** (v4) — Components use Tailwind utility classes for styling
- **The packages in `product-plan/techstack.md`** — With the default stack that is shadcn/ui's dependencies (e.g., Radix UI, `class-variance-authority`, `clsx`, `tailwind-merge`) and `lucide-react`; the UI primitives themselves ship in `product-plan/ui/`

### Backend

Your backend can be anything—Rails, Laravel, Next.js API routes, Python, Go, whatever. Design OS only handles the frontend design layer.
