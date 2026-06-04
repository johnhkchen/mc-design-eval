# Specification: LLM-Driven Minecraft Design Evaluation Stack

**Status:** Draft for review
**Purpose:** Define a composed toolchain for using LLMs as a Minecraft *design* tool, instrumented so that prompting methods can be compared rigorously on constrained, styled survival-palette builds.

-----

## 1. Intent

This is not a project to build a Minecraft bot. It is a measurement instrument.

The object of study is the **LLM's spatial and material design capability** — its ability to compose a coherent, style-consistent structure from a constrained set of materials. Minecraft is the testbed because it renders that capability observable: a voxel grid makes geometry, material choice, and interior layout concrete and scorable.

Every tool in the stack is an instrument chosen to do one job well. The goal is a *neat* composition — each layer earns its place, nothing is adopted wholesale for its own sake.

### Primary use case

Prototype **survival-style builds — primarily shopping malls** — across varied architectural and interior-design styles, each constrained to a palette of survival-obtainable materials (e.g. `industrial`, `cottagecore`, `brutalist`, `art-deco`). The constrained palette is deliberate: it turns "did the model design well?" into a partially automatable question.

### Realization path

The system produces a **survival-feasible design**, exported as a schematic. A **human** builds it by hand in survival, using the **Litematica** mod to project the schematic in-world and place blocks against it. No bot ever places blocks. Survival is therefore a *constraint the design must satisfy* (obtainable materials, buildable structure), not a mode the system runs a bot in. This is what keeps the object of study the *design* rather than any embodied execution.

### Primary research question (and its sequencing)

**Phase 1 — Methods first.** Hold one model fixed. Determine which *prompting methods* meaningfully improve styled, palette-constrained design quality.

**Phase 2 — Models later.** Once the prompting methods that move the needle are known, open the model axis and compare models on those methods.

This sequencing is load-bearing for the design: it lets the artifact contract and evaluation layer stay fixed while only prompt construction varies in Phase 1, making the Phase 2 model sweep cheap to run.

-----

## 2. Design principles

1. **The LLM emits a design, not bot commands.** The model produces a structured *design artifact*, not a turn-by-turn stream of bot actions. The artifact is realized by a human (via Litematica), never auto-placed by a bot. This seam is what makes the system analyzable.
1. **Each tool does its one job.** The Agent SDK runs experiments; the schematic generator exports the human-buildable deliverable; the render harness produces scoring images; the evaluator scores. No layer reaches into another's responsibility.
1. **Reuse patterns, not frameworks.** Borrow narrow primitives (survival-aware placement, web rendering) rather than adopting a full embodied-agent framework whose memory/skill/code-exec machinery is irrelevant noise for styled construction.
1. **Hold everything constant except the variable under test.** In Phase 1, the only thing that changes between trials is the prompting method.
1. **Constrained palette + structured contract = instrument.** Together these convert a build bot into a measurement tool.

-----

## 3. Stack overview

| Layer              | Tool / Component                               | Single responsibility                                                                 |
|--------------------|------------------------------------------------|---------------------------------------------------------------------------------------|
| Experiment harness | **Claude Agent SDK** (Node package)            | Run each trial, vary the prompting method, own full transcript logging                |
| Artifact contract  | **Structured design schema** (project-defined) | The seam: placements + palette manifest + style intent as validated structured output |
| Export             | **Schematic generator** (`.litematic` / `.schem`) | Emit the design as a schematic a human builds in survival via Litematica — the deliverable |
| Render harness     | **prismarine-viewer** (headless; in-memory voxel world, no server) | Render the design to images for scoring and optional vision-feedback — render-only, never the deliverable |
| Evaluation         | **Palette + survival-feasibility validator + style rubric** | Automatic material/buildability metrics + qualitative style scoring                   |
| Human review       | **Tailscale-hosted rating web app** (mobile)   | Serve renders + rubric to a phone over the tailnet; write human scores/votes back to the trial record |

There is **no Minecraft server and no bot**: the design is built as an in-memory voxel world and rendered headless (prismarine-viewer, JavaScript). Rendering exists only to turn a design into scoring images, never to place the build a human will make. The product of a trial is the schematic plus its scores, not a bot-built structure.

### What is *referenced* but not adopted wholesale

- **mc-bench (mcbench.ai):** donor of the `prismarine-viewer` render approach — borrowed **only for headless rendering**; we do **not** run its containerized Minecraft server. Its head-to-head ELO voting is available later if human comparison is wanted. Its single-shot render-and-discard pipeline is **not** our loop.
- **Mindcraft:** a reference for the LLM↔Mineflayer bridge pattern only. Its multi-agent loop, persistent memory, skill system, and LLM-writes-and-runs-code feature are out of scope and would add irrelevant variance. Its `allow_insecure_coding` path is explicitly disabled / not used.
- **PrismarineJS/mineflayer-builder:** **not on the critical path.** It prints schematics in survival via a bot, which is precisely what we do *not* want — placement is human, via Litematica. Its orientation-correct schematic-execution logic (and the stable `prismarine-schematic` it builds on) is a reference only if the render harness needs to materialize a schematic. (Note: upstream `mineflayer-builder` is explicitly a work-in-progress, not yet a usable package.)

-----

## 4. Orchestration route

**Committed route: Agent SDK as the experiment harness; the render harness exposed as a tool it invokes.**

The Agent SDK is *not* glue. Its value is the harness it provides: a managed agent loop, session/context handling, structured message objects, and tool-permission control. That harness is precisely what allows clean prompting-method experiments — vary one input, hold the loop constant, capture comparable traces.

The render harness is exposed as a tool the harness can invoke. Under the default `claude -p` path (below), multimodal revision turns load the render tool as an MCP server via `--mcp-config`; the single-shot milestone never calls it — it renders the final artifact post-generation. (The Agent SDK alternative can wire the same tool in-process.) The model reasons about the design, calls the tool with a design artifact, and — when the prompting method calls for it — receives a rendered image back for a revision turn. The tool renders; it never builds anything a human will later place. Schematic export for Litematica happens off the artifact, independent of any render turn.

### Operational notes (current as of the spec date)

- **Model invocation — `claude -p` shim (default).** Trials invoke the model through the `claude -p` headless CLI authenticated by the Claude **subscription**, not the Agent SDK over a metered `ANTHROPIC_API_KEY`. Run with `--output-format stream-json --verbose --model <id>`, which still yields the per-message stream (per-turn token usage + a terminal result) the harness logs — so structured per-trial logging is preserved. Schema-enforced structured output is *not* available on this path, so the prompt asks for the bare JSON artifact and the binding re-validates it against the schema (retrying on a malformed emission). The **Claude Agent SDK package remains a drop-in alternative** behind the same single seam (`src/sdk-binding.mjs`) for when platform-enforced structured output or in-process tools are wanted.
- **Billing:** the `claude -p` path draws on **subscription credits**, not pay-as-you-go API rates. Note the June 15, 2026 change: headless `claude -p` (and the Agent SDK) move from the shared subscription pool to a separate, *capped* monthly credit ($20 Pro / $100 Max5x / $200 Max20x, no rollover). Batches are therefore still bounded — size a Phase-1 run to the monthly credit, and fall back to a metered API key only if a batch would exceed it.
- **Model IDs:** do not hardcode deprecated model strings; the older Opus 4 / Sonnet 4 IDs retire on the same date. Pin the Phase-1 model by a current ID in config, single-sourced so Phase 2 can sweep it.

-----

## 5. The artifact contract (the spine)

The most important layer. The LLM's output is a **design artifact**, a structured object — not a sequence of bot calls. Minimum shape:

- **Placements:** the block list — coordinates + block type. (Compact primitives like box/line/fill are acceptable to stay within token budgets on large builds; the contract should support both explicit voxels and primitives.)
- **Palette manifest:** the declared set of materials the design commits to use.
- **Style intent:** the named style + a short rationale the model commits to (enables style scoring and post-hoc analysis).
- **Metadata:** prompting-method ID, model ID, seed, server-state ID — everything needed to reproduce and to keep trials comparable.

The artifact is the source of truth; the **Litematica-ready schematic** (`.litematic`, or `.schem` via conversion) is a deterministic export *from* it, not a separate authored thing. The same artifact also drives the render harness. One artifact → one human-buildable schematic + one set of scoring renders.

Why this seam matters: it lets you (a) validate palette adherence and survival-buildability automatically, (b) diff designs across prompting methods, (c) re-render, re-score, or re-export the schematic without re-querying the model.

-----

## 6. Survival feasibility (the constraint that defines the instrument)

**Committed approach: the design must be buildable in survival by a human, realized via the Litematica schematic mod. No bot ever places blocks in survival.**

The deliverable is a *survival-feasible design*, exported as a schematic (§5). A human loads it in Litematica, which projects a ghost overlay in-world, and builds it by hand. Survival is a property the design must satisfy, not a mode the system operates a bot in. Two feasibility constraints, both checkable automatically from the artifact:

- **Material feasibility (palette).** Every block is survival-obtainable. Each style's palette is a JSON whitelist of survival-obtainable blocks, injected into the prompt as the binding material constraint. Violations are counted post-build by the validator (§9) — a clean automatic metric. Litematica's own material-list feature gives an obtainable-quantity cross-check effectively for free.
- **Structural feasibility (buildability).** The structure must be placeable by a player: gravity-affected blocks (sand, gravel, concrete powder) need support, attachment blocks (torches, ladders, slabs, stairs) need a valid face/orientation, and nothing may require creative-only placement. This is a static check over the placement list.

The render harness uses **no Minecraft server** (§3): the design is built as an in-memory voxel world and rendered headless. It exists only to produce scoring images — it never substitutes for the human build and never operates in survival.

*Dropped from the prior draft:* bot-driven survival placement via `mineflayer-builder`. Humans place; the bot does not. Material-acquisition realism (gathering, travel, tool tiers) stays out of scope — Litematica plus the obtainability whitelist is the feasibility bar. If acquisition realism ever becomes a research target, it is added as a *scoring dimension on the design*, not as a bot capability.

-----

## 7. Prompting archetypes (Phase 1)

Structure the harness so the **only** variable between trials is the prompting archetype. Same target, same palette, same style brief, same seed, same server state, same pinned model.

Three archetypes are committed for the first pass. They are not just stylistic variations — each spends tokens in a structurally different way, which is why token cost is a first-class metric (§8) rather than an afterthought.

1. **Single-shot.** One generation produces the complete design artifact. No feedback, no revision. Cost profile: a single large output; baseline against which the others must justify their overhead.
1. **Multi-shot / iterative / phase-based additive.** The build is decomposed into sequential phases (e.g. footprint → shell → roof → interior / detail), each emitted as an additive turn that sees prior state. Cost profile: many smaller turns *plus accumulating context* — each phase re-reads prior placements, so context grows turn over turn. Token accounting must separate input (context) from output growth.
1. **Multimodal enhanced.** Rendered images of the in-progress build are returned to the model for grounded revision turns. Cost profile: adds image tokens per feedback turn, priced differently from text; the question is whether visual grounding improves quality enough to justify that cost.

Each archetype is a named, versioned configuration of how the harness constructs prompts and structures turns — so results are attributable to the archetype, not to incidental wording drift. The comparison is explicitly **quality per token**, an efficiency frontier, not a single winner: an archetype that wins on quality at several times the token cost is a finding, not a disqualification.

-----

## 8. First deliverable: the build set

The first concrete output is a **set of three builds**, produced by each prompting archetype, used to evaluate how strong each approach is. The three targets form a deliberate difficulty ladder, each probing a distinct design capability:

1. **House** — bounded volume with interior logic. The closest proxy to the eventual mall goal: enclosed space, rooms, openings, fit-out. Tests coherent enclosed-structure design.
1. **Path** — linear continuity that follows terrain. Tests whether the model holds a constraint *across distance* — consistent width, grade, material — rather than within a single bounded footprint.
1. **Landscape** — open-ended composition with no single correct footprint. Tests material and aesthetic judgment when geometry is not pinning the answer down.

Each of the three archetypes (§7) produces each of the three builds → a 3 × 3 trial matrix on the pinned model, each cell scored (§9) and token-tracked (§9). This matrix is the Phase-1 result.

Holding the build set fixed across archetypes is what makes the comparison fair; the builds are the constant, the archetype is the variable.

-----

## 9. Evaluation

Every trial is scored on **quality** and **cost** together; neither alone is the result.

- **Automatic — palette adherence:** count of placements outside the declared whitelist; coverage/diversity of palette use. Cheap, objective, runs on every build.
- **Automatic — survival buildability:** count of structurally infeasible placements (unsupported gravity blocks, attachment blocks with no valid face, creative-only blocks). Static check over the artifact; a design that fails this is not a valid Litematica deliverable regardless of how it scores aesthetically.
- **Qualitative — design rubric:** scored adherence to the target's defining capability (house: interior/enclosure coherence; path: continuity and terrain-following; landscape: compositional and material judgment) plus named-style adherence. Human-scored or model-scored with a fixed rubric. When human-scored, scores are collected through the rating system (§10).
- **Cost — token tracking (first-class):** per trial, record input vs. output tokens; for the iterative archetype track how context grows turn over turn; for the multimodal archetype track image tokens separately from text. Report as **quality per token** — an efficiency frontier across archetypes, not a single winner.
- **Optional — head-to-head:** mc-bench-style pairwise voting for human preference between two archetypes' outputs of the same build, if a preference signal beyond the rubric is wanted. Served through the same rating system (§10).

Token accounting comes directly from the Agent SDK's structured message objects (§4) — another reason to use the package rather than `claude -p`, since per-turn usage is available natively.

Log the full Agent SDK transcript per trial alongside the artifact, scores, and token counts, keyed by the §5 metadata, so Phase 1 conclusions are reproducible and Phase 2 inherits the same scoring spine unchanged.

-----

## 10. Feedback & rating system (self-hosted, mobile)

The human-scoring paths in §9 — the qualitative rubric and the optional head-to-head vote — need a way to get builds in front of a human and scores back out, ideally from a phone, ideally from anywhere, without standing up public infrastructure or auth. This layer is that, and nothing more.

**Committed approach: a thin rating web app, bound to a Tailscale tailnet, reached from mobile by tailnet identity.**

- **Hosting.** The app runs on the same machine that holds the trial store (artifacts, renders, scores), bound to the **Tailscale** interface and reached by its MagicDNS name. Both the host and the reviewer's phone are on the tailnet, so the phone reaches it from anywhere with no public ingress, no port-forwarding, and no separately-built login — **the tailnet *is* the access boundary.** Tailscale ACLs scope who can reach it; `Funnel` is available only if a reviewer outside the tailnet ever needs in, and is off by default.
- **What it serves.** Per trial it shows the render images (from the render harness, §3), the declared style intent + palette manifest (from the artifact, §5), and a scoring form bound to the **fixed rubric** (§9). For head-to-head it shows two builds of the *same target* side by side with a single vote control. Mobile-first: image-forward, thumb-friendly controls, fast.
- **What it writes.** Scores and votes are written back into the same per-trial record as the artifact, automatic metrics, and token counts, keyed by the §5 metadata (trial ID). Human scores land in the **same scoring spine** as everything else — no separate spreadsheet, no manual reconciliation. **Phase 1 is single-rater** (one reviewer, on a phone), so each trial holds one human score. The record still carries a `rater` field (from Tailscale `whoami`) so multi-rater agreement can be added later without a data migration — but no aggregation logic is built now.
- **What it is not.** It does not run experiments, render, validate, or export schematics — it reads the trial store and writes scores. One job (design principle 2). Tailscale is reused as a narrow networking primitive (principle 3); we do not build hosting, auth, or tunneling ourselves.

This keeps human scoring as a clean, attributable input to the Phase-1 matrix rather than an out-of-band step, and it carries into Phase 2 unchanged — the same UI rates model-swept builds against the same rubric.

-----

## 11. Build sequence (suggested)

1. Define the design-artifact schema (§5) and one style palette (§6).
1. Build the schematic exporter (artifact → `.litematic`); confirm a hand-built round-trip — export a trivial design, load it in Litematica, build it in survival.
1. Stand up the render harness: build the artifact into an in-memory voxel world and render it headless with prismarine-viewer (no Minecraft server); expose it as an in-process tool the harness invokes.
1. Build the palette + survival-buildability validators and the token-tracking hooks (the three automatic metrics).
1. Implement the Agent SDK harness with **one** archetype (single-shot) building **one** target (house) end-to-end; confirm a full trial (prompt → artifact → schematic export → render → score → token count → logged transcript).
1. Stand up the rating web app (§10) over the tailnet, pointed at the trial store; confirm a render + rubric loads on a phone and a submitted score lands back in the trial record keyed by trial ID.
1. Add the path and landscape targets, then the iterative and multimodal archetypes as versioned configs; run the full 3 × 3 Phase-1 matrix on the pinned model.
1. (Phase 2) Parameterize the model ID and sweep across models on the archetypes that proved worth their token cost.

-----

## 12. Open questions for review

- Artifact contract: explicit voxel list, primitive ops, or both — and what token-budget ceiling forces the choice (the iterative archetype's growing context makes this sharper)?
- Design rubric: human-scored, model-scored, or both? Determines cost and turnaround per cell of the 3 × 3 matrix.
- Build-set scale: fixed target sizes/seeds across archetypes (needed for fair token comparison) — what are they?
- Single style/palette for Phase 1 to isolate archetype effects, or a small set to test generalization?
- Schematic format: target Litematica `.litematic` directly, or emit WorldEdit `.schem` and convert? Affects the exporter and the obtainable-quantity cross-check.
- Render harness: **decided — no Minecraft server.** Build an in-memory voxel world (`prismarine-world`) and render headless with `prismarine-viewer`; stack is JavaScript. Still open: headless WebGL strategy (Playwright/headless Chromium vs headless-gl), an implementation detail to settle in the render scaffold ticket.
- Survival-buildability scope: is the static check (gravity support, attachment faces, no creative-only blocks) the full bar, or do we also flag harder-to-reach geometry that would be tedious (not impossible) to scaffold by hand?
- Rating system (§10): **decided — single-rater for Phase 1** (record keeps a `rater` field so multi-rater is a no-migration add later). Still open: does the head-to-head vote run in Phase 1, or only once the rubric scores suggest it's worth the extra reviewer time?
