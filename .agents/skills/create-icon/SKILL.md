---
name: create-icon
description: Add a supplied SVG icon to this repository's centralized icon catalog. Use when the user provides icon markup or artwork and a desired name, and wants it added for use through NextIcon.
---

# Create Icon

Add one icon to the repository's existing `NextIcon` catalog from the icon source and name supplied by the user.

## Repository structure

- Icon components live under `src/components/icons/<category>/<kebab-name>.tsx`.
- Shared SVG props are `IconSvgProps` from `src/components/icons/icon-types.ts`.
- `src/components/icons/index.ts` imports icons by category, adds them to `iconsMap`, and derives the public `Icons` name type from that map.
- `src/components/atoms/next-icon.tsx` renders the map. New icon components should not be imported by consumers directly.
- Consumers use `<NextIcon name="PascalCaseName" />` and can set `size`, `className`, and standard SVG accessibility props.

## Workflow

1. Read the supplied SVG or artwork and the requested name. Search `src/components/icons/index.ts` and the icon files for an existing equivalent or a name collision before creating files.
2. Normalize the requested name to `PascalCase` for the map key and component export. Use the matching `kebab-case.tsx` filename. Keep the requested meaning; do not invent a different product concept.
3. Choose the most specific existing category by meaning:
   - `accessibility`: visibility and accessibility controls
   - `arrows`: arrows, chevrons, and directional marks
   - `brands`: third-party brand marks
   - `charts`: chart or analytics symbols
   - `finance`: money, payment, and account symbols
   - `layout`: navigation, calendar, and general interface symbols
   - `notifications`: notification and alert symbols
   - `status`: check, error, loading, and state indicators
   If none fits, create a concise lowercase category folder and use it consistently in the index. Do not create a new category when an existing one fits.
4. Create the TSX component as a default export named in PascalCase. Type its props as `IconSvgProps`, preserve the source `viewBox` and geometry, and spread props onto the root `<svg>`. Keep colors based on `currentColor` unless the icon is a brand mark or the supplied source intentionally uses multiple colors. Do not hardcode display size; `NextIcon` controls width and height.
5. Add the import under the matching category section in `src/components/icons/index.ts`, then add the component to `iconsMap`. This updates the `Icons` type automatically; do not create or retain an `AORIcons` alias and do not edit `next-icon.tsx` for an ordinary new icon.
6. Check for duplicate map keys, missing imports, stale direct imports, and unintended formatting changes. Format only the new component and index, then run `git diff --check`. Do not add or run tests unless the user asks.
7. If the user also names a component or location where the icon should appear, update that consumer to use `<NextIcon name="PascalCaseName" />`. Otherwise, only register the icon and include a short usage example in the response.

## Collisions and incomplete sources

- If an equivalent icon already exists, reuse it and explain the existing `NextIcon` name instead of adding a duplicate.
- Never silently overwrite a different icon with the same name. If the user clearly requested a replacement, update its component in place and keep the map entry stable; otherwise choose a distinct descriptive name.
- If the pasted source lacks its vector paths or the artwork cannot be reproduced faithfully from the provided input, ask one concise question for the missing source. Do not fetch or install an icon package to fill gaps.
