# anti-knowledge-outdate

## Project overview

This repository contains an interactive learning site about software architecture, distributed systems, AI/RAG, Kafka, Kubernetes, and related runtime concepts.

- Stack: React 19, TypeScript, Vite, Mermaid, Vitest, Testing Library, Lucide React.
- Entry point: `src/main.tsx`.
- Global styling and theme rules: `src/styles.css`.
- Reusable interactive diagrams and learning components: `src/components/`.
- Standalone validation: `scripts/sync-hermes-standalone.mjs`.
- Production output: `dist/` (generated; do not edit manually).

## Development commands

Run from the repository root:

```bash
npm install
npm run dev
npm test -- --run
npm run lint
npm run typecheck
npm run build
npm run check:hermes-standalone
```

`npm run build` also runs `check:hermes-standalone` through the `prebuild` script.

## Implementation rules

- Keep changes focused and preserve unrelated behavior.
- Follow existing React and TypeScript patterns before introducing new abstractions.
- Prefer small, readable components and avoid duplicating domain logic.
- Preserve the existing visual layout, spacing, card dimensions, and responsive behavior unless a task explicitly requests a redesign.
- For diagrams, keep the visual model faithful to the source/runtime/docs being explained.
- Keep arrows, SVG geometry, labels, junctions, and endpoints aligned; do not hide a geometry problem by changing the overall grid.
- Avoid page-level horizontal overflow. If a diagram needs more width, use a local scroll region.
- For light mode, add an intentional semantic palette; do not use `filter: invert()` or broad mechanical inversion.
- Preserve dark mode while changing light mode.
- Respect `prefers-reduced-motion`; animated diagrams must remain understandable when motion is reduced or paused.

## UI verification

For visual or responsive changes, use the local dev server and inspect the actual browser render. Check:

- dark mode and light mode;
- desktop and narrow viewport behavior;
- sidebar open and closed states when relevant;
- local diagram overflow versus page overflow;
- connector/arrow routing and text/card alignment;
- browser console for runtime errors.

A passing build is not a substitute for visual proof when the change affects UI or diagrams.

## Testing and completion gate

Before declaring a change complete, run the relevant focused tests and then the full gates when practical:

```bash
npm test -- --run
npm run lint
npm run typecheck
npm run build
npm run check:hermes-standalone

git diff --check
```

Do not claim a test, browser check, build, deploy, or review passed unless it was actually executed and its output was checked.

## Git and pull requests

- Use branch names under `develop/homelab/...`.
- Keep unrelated changes out of a branch.
- Do not merge automatically unless the user explicitly requests it.
- PR descriptions should include: WHAT CHANGED, AS-IS / TO-BE, verification evidence, and known risks.
- Prepare PRs in a merge-ready state; the user performs the final merge unless they explicitly delegate that action.
- Never include credentials, tokens, or other secrets in commits, PR descriptions, logs, or screenshots.
