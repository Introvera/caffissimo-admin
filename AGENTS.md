# Caffissimo Admin - Frontend Design Guidelines

This file defines the standardized frontend guidelines, layout design rules, and typography configurations for the Caffissimo Admin application. **All agents and assistants must follow these rules strictly.**

---

## 1. Deviation Constraint
> [!IMPORTANT]
> If you plan to add, modify, or redesign any UI elements that disregard or deviate from the rules in this document, **you MUST ask the user for explicit permission first** before making any edits.

---

## 2. Colors & Surfaces
- **Sidebar Background**: Pure white (`#FFFFFF` in light mode, `#232323` in dark mode).
- **Sidebar Dividing Border**: Vertical right border of `border-r border-border/40`.
- **Sidebar Logo Header**: Background matches sidebar (`bg-sidebar`), height `h-16`, bottom border `border-b border-border/30`. No top margin/padding.
- **Main/Right Page Content Area Background**: Light neutral (`#F8FAFB` in light mode, `#1A1A1A` in dark mode).
- **Navbar/Header Background**: White (`bg-white dark:bg-background`), height `h-16`.

---

## 3. Typography & Fonts
- **Default Font-Family**: **`Plus Jakarta Sans`** is the primary font family for the application.
  - To apply it globally, inject `jakarta.className` into the `<body>` element classes inside `layout.tsx`, and retain `font-family: var(--font-jakarta), sans-serif;` on the `body` selector in `globals.css`.
- **Text Clipping Prevention**:
  - Do **NOT** use `leading-none` for multi-word texts, names, or emails (as it cuts off font descenders like 'g', 'p', 'y', 'j').
  - Use `leading-tight` or `leading-normal` instead to ensure proper line heights.
  - Keep the vertical gap between items tight by using small margins (e.g. `mt-0` or `mt-0.5`).

---

## 4. UI Controls & Borders
- **Control Sizing**: All dropdown selectors, pickers, and primary buttons in the navbar header must have a height of `h-10` and use `rounded-md` corners to ensure size and styling consistency.
- **Borders & Shadows**: Selector triggers (e.g. branch dropdowns) must use border color `border-input`, `shadow-none`, and `hover:bg-muted/50` to match the date range picker.

---

## 5. Breadcrumb Navigation
- **Home Icon**: Must use a minimal Home icon (`TbHome`) with small dimensions (`w-[17px] h-[17px]`) and thin stroke (`strokeWidth={1.5}`).
- **Active Segment Style**: The active/current page title in the breadcrumbs must be styled as plain text (`text-slate-800` / `font-semibold`), with **no background chip, borders, shadow, or padding**.
- **Dashboard Mapping**: The `/admin/dashboard` path maps directly to a single active "Dashboard" breadcrumb segment (do not append dummy/fallback "Overview" paths).

---

## 6. Icon Specifications
- **Icon Set**: Standardize on **Tabler Icons (`react-icons/tb`)** for new layout and navigation elements.
- **Aesthetic**: Keep icons minimal and modern. For outline-style icons, set `strokeWidth={1.5}` or `strokeWidth={1.8}` to maintain thin, sleek lines.

---

## 7. Branch Cards UI
- **Open/Closed Badge**: The status badge must be placed next to the branch name inside the `CardTitle` flexbox.
- **Actions Menu**:
  - Do **NOT** render inline platform buttons (Uber Eats, DoorDash) or "Manage Branch" settings links inside the card body.
  - Render a vertical three-dot icon (`TbDotsVertical`) in the top-right corner. Clicking it reveals a dropdown menu containing **View Branch**, **Uber Eats**, and **Door Dash** actions.
- **Active Status Toggle**: The branch status Switch toggle must be positioned at the bottom of the card content inside a dedicated status row labeled "Active Status".
