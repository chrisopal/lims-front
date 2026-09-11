# Historical v2.1 scope

This document describes the previous release. Current scope and verification are in FRONTEND_INTERACTIVE_V2_2.md.

# Frontend v2.1 — local request/work-item interaction

## Scope
This is a local interaction prototype on top of the validated Vue 3 / Element Plus frontend. It is not a production LIMS backend, process engine or regulatory decision system. No application dependency versions are changed.

## What now connects
1. Request Composer uses three declarative scenario fixtures: third-party food, environmental field sampling and internal metrology.
2. Choosing a scene creates a local draft with a copied scenario definition and a stable draft id in the route.
3. Save preserves inputs, objects and exactly the selected test item codes. Reload restores the draft.
4. Required fields, allowed options and dates are checked. Zero selected items does not mean select all.
5. Submit creates one local request and only its first work item. Repeating submit with the same draft id returns the same request.
6. My Work reads the repository, not a hardcoded task count. It filters current request, node type and state.
7. RuntimeWorkbench resolves fields from the request-bound node descriptor. The same schema form supports record, sampling, measurement and review presentations.
8. Start / save / complete are guarded transitions. Completing one node creates exactly one next node; completed records are read-only through the application. End-of-sequence completes the local request.

## Storage and consistency
- Namespace: `lims.demo.runtime.v1`. Fixed demo namespace, not tenant isolation.
- One versioned JSON state, Web Locks for cooperating tabs, optimistic draft/work-item revisions.
- Writes notify subscribers only after localStorage succeeds.
- Invalid/incompatible storage is not silently cleared. Quota/permission errors retain inputs and surface failure.
- Explicit navigation guards and beforeunload protect unsaved edits.
- Browser data is modifiable/clearable by the browser owner and must not contain real customer, laboratory, health or confidential data.
- Snapshot references start with DEMO-SNAPSHOT. They are not signatures or authenticity guarantees.

## Integration boundaries
The new local repository and typed commands are a frontend seam for an eventual server adapter. Server-side tenant checks, permission/qualification enforcement, idempotency, concurrency, audit, immutable publication and signature verification remain required. Do not merely expose localStorage JSON as a trusted server command.

`ScenarioPackStudio`, activation, published-catalog statistics and the original field/metrology workbenches still contain independent static examples. The new Request → My Work → RuntimeWorkbench path does not assert those static pages are a connected publication lifecycle. Existing sample workbenches remain accessible from My Work with explicit sample labels.

Only sequential human-node simulation is implemented. No arbitrary scripts, Java code, condition gateways, parallel joins, timers, AI tools, actual instruments, report signing or QMS calls run in the browser. Legal-standard names are inherited example labels; limits and effective dates are not validated.

## Tests
`pnpm test:runtime` compiles src/runtime with strict TypeScript and runs the new domain tests. It is NOT a whole-project vue-tsc/lint certification.

The existing 40-page viewport matrix and 11 interaction tests are retained. The wizard happy-path fixture now fills required fields before advancing. New browser tests cover all three local sequences on desktop/mobile, draft reload, deselection, unsaved navigation, competing tabs, storage failures and missing work ids. Evidence is captured against the production preview.

Commands: `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm test:runtime`. Browser scripts need the isolated `.qa-tools` Playwright installation configured in CI.

## Review limits
No approved golden-image baseline exists. Screenshots and geometry assertions are not pixel-diff certification. Light Chromium is the formal browser target. No backend E2E, production deployment, complete accessibility/contrast audit or server data migration is included.
