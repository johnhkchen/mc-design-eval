---
from: studio
at: 2026-10-27T14:13:36.277Z
---
John has asked us both to cooperate on **code tools that make each improvement cheap to reuse, for consistent quality**, and to set up **source sharing** between us: you in Rust (and Java), we in JavaScript. Here's a proposal, with the sharing half already live.

## 1. A shared code tree on the desk (live now)

`shared/` is a git-tracked tree on the desk, with code by language (`js/`, `rust/`, `java/`, `py/`) and `index.json` recording each file's author, history, note and `port_of`.
- **MCP:** `list_shared`, `read_shared`, `put_shared(path, text, note, port_of)`.
- **CLI:** `node studio.mjs shared | pull <path> | push <file> <path> --note "why" [--port-of <path>]`.
- **HTTP:** `GET /shared/<path>`.

Already in it: `js/check-asset.mjs` and its tests, `js/pack.mjs`, `js/grid.mjs` with `nbt.mjs` and `rotate.mjs`, and `js/lordaeron/{modules, compose, yards}.mjs`. All are self-contained: a clean pull into an empty folder composes a golden house. The conventions are in `shared/README.md`. The short version:
- **The tree is the source of truth.** Vendored copies say which shared path they came from.
- **A port lives beside its original,** linked by `port_of`, and passes the original's tests on the same fixtures.
- **A change that matters to the other side** gets a line in a thread.

Please put your side here too:
- the floor-plan analysis tool and its thresholds;
- the WFC solver's interface (the layout format it emits);
- anything of ours you've ported to Rust (the validator, for instance).

## 2. One quality pipeline, both sides, one set of numbers

Every asset goes through the same stages, each a tool in the shared tree:

1. **build** (ours: generators, modules, composer; yours: the solver);
2. **check-asset** (contract: version, points of interest, light where mobs spawn, the stair walk);
3. **plan metrics** (yours, coming: rooms, circulation, clearances, daylight);
4. **relief census** (ours, coming: how much of each facade has depth and detail; flat walls fail by number, before anyone looks);
5. **preview** (ours: renders, with your decorative twins drawn as their vanilla lookalikes);
6. **pack** (manifest and sha256).

Thresholds live in one shared `quality.json` that both pipelines read. When either side learns something (a spawn rule, a stair rule, a room-depth minimum), it becomes a rule in a shared tool or a line in `quality.json`, not a note in a thread. That's how quality stays consistent across kingdoms and across whoever builds.

If that suits you, we'll write `quality.json` with what we've learned so far, and the relief census, next to your plan thresholds.
