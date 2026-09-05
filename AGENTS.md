# lims-front

Vue 3 + Vite + Element Plus prototype for the Composable AI-Native Laboratory Operations Platform (LIMS).

## Product architecture

This repository is a front-end prototype for LIMS v2. The UI must follow these product rules:

- `Scenario Pack` is the only business configuration unit that is validated and published.
- A published scenario version is immutable and runtime requests lock its snapshot/version.
- Reusable assets (test items, standards, methods, limits/formulas, forms, report templates, AI skills) are managed independently and referenced by Scenario Packs.
- Workflow design is part of Scenario Pack configuration. A workflow definition itself is saved as a draft/configuration asset; publishing happens from the Scenario Pack lifecycle.
- Workflow node types come from platform capabilities. A node may have a backend executor plus optional config/runtime UI renderers.
- Generic components must not hard-code Food, Environment, Metrology, Battery, Nuclear or other domain-specific branches when the variation can be driven by scenario metadata/schema.
- AI is a governed business capability. It should not replace deterministic rules, formulas, permissions, version locking or human approval.

## Stack

- Vue 3
- TypeScript
- Vue Router
- Element Plus + `@element-plus/icons-vue`
- Vite 8
- pnpm

Entrypoints:

- `src/main.ts` — application bootstrap, Element Plus and global icon registration.
- `src/App.vue` — root router outlet.
- `src/router/index.ts` — route table.
- `src/components/Layout.vue` — shared enterprise shell and navigation.
- `src/index.css` — enterprise semantic tokens and global Element Plus mapping.
- `src/views/*` — prototype workbenches and configuration screens.

## Enterprise UI rules

Use a restrained enterprise/industrial software style:

- One blue interaction system plus blue-gray neutrals.
- Use semantic tokens instead of adding arbitrary colors in pages.
- Body text 14px; labels 13px; metadata 12px.
- Control radius 4px; panel/dialog radius 6px.
- Sidebar 220px; topbar 48px; desktop page padding 24px 32px.
- Flat surfaces, thin borders, no decorative gradients, glass blur, glow, thick shadows or card-lift animation.
- Use one consistent monochrome outline icon language. Color indicates state, not module identity.
- Do not use emoji, 3D icons, colorful icon tiles, duotone icons or purple-gradient AI styling.
- AI markers must be visually subordinate to the business task/data.
- Professional workbenches (workflow, sampling, report design, review) may have specialized layouts; only unify their shell, typography, controls and semantic color system.

## Interaction and accessibility

- Preserve visible focus states.
- Provide loading, empty, error, disabled and permission states where relevant.
- Keep table overflow inside the table container.
- Avoid page-level horizontal overflow on desktop.
- Verify layouts at 1366, 1440, 1920 and 390px when implementing production UI.
- Never introduce fake toolbar controls or navigation entries without a defined product purpose.

## Code quality

- Prefer reusable data-driven models over large page-specific conditionals.
- Do not add a second UI component framework.
- Keep route targets valid when changing navigation.
- Do not let view components mutate immutable published-scenario data.
- Run `pnpm build` and `pnpm format` before merging implementation changes when a runtime environment is available.
