# Epics

Epics are the top of the work hierarchy: **Epic → Story → Ticket**. Each epic is a large, spec-grounded body of work that will be broken into stories (`docs/active/stories/`), which in turn break into RDSPI tickets (`docs/active/tickets/`).

Epics are planning artifacts. Unlike tickets, they are **not** scheduled or phase-advanced by Lisa (the `.lisa.toml` `[dirs]` only scans tickets/stories/work). They exist to scope and sequence the work and to anchor stories to the spec.

Source of truth: [`docs/specification.md`](../../specification.md).

## Epic map

| ID   | Title                              | Priority | Depends on        | Spec        |
|------|------------------------------------|----------|-------------------|-------------|
| E-01 | artifact-contract-and-export       | high     | —                 | §5, §6      |
| E-02 | render-harness                     | high     | E-01              | §3, §4      |
| E-03 | experiment-harness                 | high     | E-01, E-02        | §4, §7      |
| E-04 | evaluation-and-scoring             | high     | E-01, E-02        | §9          |
| E-05 | feedback-and-rating-system         | medium   | E-02, E-04        | §10         |
| E-06 | phase-1-study                      | high     | E-03, E-04, E-05  | §8, §11     |
| E-07 | phase-2-model-sweep                | low      | E-06              | §1, §11     |
| E-08 | autonomous-experiment-loop         | high     | E-03, E-04        | §7, §9, §11 |

## Dependency graph

```
E-01 ──┬──> E-02 ──┬──> E-03 ──┬──> E-06 ──> E-07
       │           │           │
       └──> E-04 <─┘           ├──> E-08 (E-03, E-04) ──> E-06
                   E-05 <──────┘ (E-04, E-02)
            E-05 ───────────────> E-06
```

E-01 is the foundation (the artifact contract is the spine, §5). E-02–E-05 build the four instrument layers around it. E-06 runs the Phase-1 3×3 matrix once those layers exist. E-07 is the deferred Phase-2 model sweep. E-08 is the autonomous optimization loop: it *discovers* improved prompting techniques (on top of E-03's runner, judged by E-04) and feeds the promoted champions into E-06's fair comparison.

## Epic frontmatter

```yaml
---
id: E-01
title: kebab-case-name
type: epic
status: open          # open | in-progress | done | deferred
priority: critical | high | medium | low
depends_on: [E-00]    # other epics
spec: "§5, §6"        # relevant specification sections
stories: []           # story IDs, filled in as stories are created
---
```
