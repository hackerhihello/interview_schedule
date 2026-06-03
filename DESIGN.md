# Design System

## Vibe & Concept
This is a modern, premium "Interview Scheduling Dashboard" built for technical recruitment operations. The app feels interactive, responsive, and data-rich.
We use a clean, professional glassmorphism aesthetic with subtle animations and a dynamic UI that emphasizes clarity, efficiency, and modern design.

## Typography
- **Primary Font**: Inter (or system-ui)
- **Style**: Modern, legible, professional
- Use distinct font weights (e.g., 400 for body, 500 for buttons, 600/700 for headers).

## Colors & Theming (Tailwind CSS)

### Light Mode
- **Background**: `hsl(220 25% 97%)` (Soft Off-White)
- **Foreground / Text**: `hsl(224 71.4% 4.1%)` (Near Black)
- **Primary**: `hsl(220 90% 56%)` (Vibrant Blue)
- **Surface / Card**: `hsl(0 0% 100%)` (White)
- **Borders / Input**: `hsl(220 13% 88%)`

### Dark Mode
- **Background**: `hsl(224 25% 6%)` (Deep Navy / Almost Black)
- **Foreground / Text**: `hsl(210 20% 98%)` (Clean White)
- **Primary**: `hsl(217 91% 60%)` (Bright Blue)
- **Surface / Card**: `hsl(224 25% 9%)`
- **Borders / Input**: `hsl(224 25% 15%)`

## Specific UI Patterns
- **Glassmorphism**: Use semi-transparent backgrounds with backdrop filters for floating elements, popovers, and sticky headers.
  - Light mode: `bg-white/45 backdrop-blur-md`
  - Dark mode: `bg-[rgba(15,20,32,0.45)] backdrop-blur-md`
- **Corners**: Rounded elements (buttons, cards, inputs) typically use `--radius: 0.75rem` (`rounded-xl` / `rounded-lg`).
- **Animations**: Include micro-interactions like `fade-in`, `slide-up`, and subtle scaling on hover. Use custom scrollbars for data-heavy views.

## Component Stack
- The codebase uses **Next.js 16 (App Router)** and **Tailwind CSS**.
- Icons are from **Lucide React**.
- UI Primitives are heavily based on **Radix UI** (accessible components).
- Ensure any generated UI structure uses semantic HTML and standard Tailwind classes compatible with the above theme variables.
