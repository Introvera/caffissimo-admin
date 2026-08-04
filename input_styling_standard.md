# Caffissimo Admin UI — Input Styling Standard

To preserve pixel-perfect UI consistency across the entire Caffissimo codebase, all custom, native, and mockup-based `<input>` fields must strictly follow these structural design rules:

---

## 1. Border Radius & Sizing
- **Border Radius**: Always use **`rounded-md`** (equivalent to `var(--radius-md)` / `8px`). Never use custom `rounded-lg` or generic `rounded` definitions.
- **Height**: Standard inputs are **`h-9`** or **`h-10`** (default for tables, filters, and standard forms).
- **Padding**: Vertical and horizontal padding must be set to `px-3 py-1.5` or `px-3 py-2` depending on form density.

---

## 2. Colors & Typography
- **Background**: Always set to **`bg-background`**.
- **Border Color**: Use **`border-input`** (`hsl(var(--border))` equivalent) for normal states.
- **Text Color**: Use **`text-foreground`**.
- **Font Weight**: Text inside form fields must be **`font-semibold`** or **`font-medium`** at a **`text-xs`** or **`text-sm`** scale to align with the database fields hierarchy.
- **Placeholder**: Subdued text color must map to **`placeholder:text-muted-foreground`**.

---

## 3. Focus & Interaction State
- **Focus Indicators**: Always disable default browser outlines and apply the design system's glowing rings:
  ```css
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  ```
- **Disabled State**: Always include standard pointer and opacity modifications:
  ```css
  disabled:cursor-not-allowed disabled:opacity-50
  ```

---

## 4. Example Global Implementation
Ensure all input forms match this class configuration:
```tsx
className="flex h-9 w-full rounded-md border border-input bg-background text-foreground px-3 py-1.5 text-xs font-semibold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
```
