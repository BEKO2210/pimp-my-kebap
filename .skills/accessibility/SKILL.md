# Skill: accessibility

> Local skill stub. WCAG 2.2 AA compliance rules.

## Rules

- All interactive elements: `aria-label` if no visible text, fokussierbar, Tab order logical.
- Color contrast: ≥4.5:1 body, ≥3:1 large text. Verified in CI via axe-core.
- Touch targets: min 44×44 CSS px (mobile prefers 64×64).
- Skip-link `Direkt zur Speisekarte` is the first focusable element.
- Modal dialogs: `role="dialog"`, `aria-modal="true"`, focus trap, ESC closes, focus restored.
- Quantity steppers: `<input type="number" inputmode="numeric">` with `aria-live="polite"` total region.
- `prefers-reduced-motion`: respect, no pulse animations or autoplay.
- `lang="de"` on `<html>`.
- Form labels always associated (`<label for>` or `aria-labelledby`).

## File-header convention

```ts
// Powered by skill: accessibility
```
