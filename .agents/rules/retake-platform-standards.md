# Retake Platform & Design Standards

## 1. Development Server
When starting or referencing the development server for `aiccm/frontend`, always use port `3005`:
```bash
npm run dev -- -p 3005
```
This avoids collisions with existing background system services on port 3000.

## 2. Figma Palette & Aesthetics
Follow the official Retake Figma design tokens:
- **Primary CTA**: Electric Violet (`#7c3aed` / `#6d28d9`), e.g., *"Invite to a brief"*.
- **Multi-Stop Gradients**: Use `.bg-aura-gradient` (cyan to coral), `.bg-magenta-gradient`, `.bg-amber-gradient`, `.bg-indigo-gradient`, `.bg-teal-gradient`, `.bg-sunset-gradient`.
- **Story Rings**: Use `.ring-gradient-teal`, `.ring-gradient-pink`, `.ring-gradient-amber`, `.ring-gradient-purple`.
- **Canvas & Surround**: Soft off-white `--surround: #f8f9fa` in light mode with `--panel: #ffffff`, and sleek dark-mode values in dark mode.
- **Scrubber Slider**: Use purple range track and thumb (`accent-[#7c3aed]`).

## 3. Verification Commands
Always verify before committing or claiming task completion:
```bash
npm run typecheck
npm run design-lint
npm test
```
