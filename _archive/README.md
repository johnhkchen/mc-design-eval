# _archive/ — the DEAD-code home

**Location encodes status (E-37).** Everything under `_archive/` is **retired from the live path**:
superseded chains, runners, and outputs kept for provenance but no longer executed or measured.

This directory is created by **T-155-01** (E-37 / S-155) and **populated by S-156** — the move of the old
parallel chains (`pattern-book.mjs`'s program-seed chain, `styled-/challenge-/reconstructed-milestone.mjs`
as terminal chains, etc., per `STRUCTURE.md` → "Retired from the live path"). It is intentionally **empty**
until then.

A file's home answers its status at a glance:

- `builds/` — **draft** (free zone, regenerated).
- `measurements/` + ratified `packs/` — **frozen** (pin-guarded).
- `_archive/` — **dead** (retired; provenance only).

The architecture of record is `docs/knowledge/pipeline-philosophy.md`.
