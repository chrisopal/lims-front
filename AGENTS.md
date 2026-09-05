# LIMS frontend implementation guide

The actual application is Vue 3 + TypeScript + Element Plus + Vue Router, built by Vite. Do not rewrite it as React because of the original Figma scaffold.

## Entry points
- src/main.ts / src/App.vue: app bootstrap.
- src/router/index.ts: preserve current hash routes and legacy aliases.
- src/index.css and src/styles/: semantic enterprise tokens and scoped responsive fixes.
- src/views/: professional workspaces and legacy static prototypes.
- src/runtime/: typed local-prototype repository, validation and scenario fixtures.
- src/composables/useLocalRuntime.ts: reactive browser adapter; future server adapter boundary.
- src/components/runtime/: shared schema form, status and local-demo disclosure.

## Product boundaries
Scenario configuration, published state, activation and runtime are separate concepts. A request references a specific scenario version. Generic pages must not switch on industry names. Reuse declarative field/node definitions. Never execute arbitrary code or load UI modules from scenario content.

This iteration adds local browser draft/request/work-item interactions ONLY. It is not a backend process engine. Static catalog/publish/activation screens are not connected to the local runtime repository. Local storage is not authorization, tenant isolation, legal audit, electronic signature or durable server persistence. Never label demo hashes as verified signatures. Do not enter real client or test data in fixtures/tests.

## UI constraints
Use the existing Element Plus stack and semantic --ui-* tokens. White sidebar, neutral surfaces, one blue interaction palette. Color indicates state, not module identity. No emoji, decorative icon tiles, purple AI gradients, heavy shadows or broad svg/button/div overrides. Keep accessible field labels, visible focus, loading/error/empty states and keyboard navigation.

## Validation
- pnpm install --frozen-lockfile
- pnpm build
- pnpm test:runtime (strict typecheck for src/runtime and domain tests, NOT whole-project vue-tsc)
- .github/workflows/enterprise-validation.yml executes existing and new browser checks against production preview at multiple viewports.

Preserve dependency versions and the lockfile unless explicitly needed. Do not weaken assertions to hide failures. Screenshot checks are not approved-baseline pixel diffs. Record the exact commit, results and limitations. Do not merge or deploy unverified changes.
