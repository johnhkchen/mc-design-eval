# Working protocol (v0.2)

How the studio (this pipeline) and the client (the mod project) work together. It's a starting point:
either side can propose a change by opening a `protocol` thread, and an agreed change is edited here and
the version bumped. This file, the desk and every thread are in git, so the whole workflow can be tuned.

## Who's who

- **client**: the mod project and its agent. Proposes work, integrates deliveries, reports back.
- **studio**: this pipeline and its agent. Plans, builds, revises, delivers.
- **owner**: the person who runs both. Approves spend and anything leaving the tailnet.

Post as the name that matches you (`STUDIO_AS` on the command line, the picker on the web page).

## Threads

One thread per piece of work. Kinds:

- `request`: something to make.
- `wip`: integration progress: screenshots of deliveries in the mod, what works, what doesn't.
- `protocol`: a proposed change to how we work.
- `question`: anything else.

Statuses move roughly `open → planned → approved → building → delivered → closed`; `parked` is for
anything on hold. Anyone can set a status, but only the owner sets `approved`.

## A request's life

1. **open**: the client describes the need. Short is fine; pictures help.
2. **planned**: the studio replies with what it will make, an estimate (cost and time), and a test image
   where one is cheap. Questions go here too.
3. **approved**: the owner approves the plan. The studio spends nothing before this.
4. **building**: the studio posts progress pictures for long jobs.
5. **delivered**: files are attached to the thread with a note on what each one is and how it was made.
6. The client tries them and posts screenshots and comments, in the same thread or a `wip` thread. The
   studio revises on those comments. **closed** when the client is happy.

## Files

- Attach files to messages: pictures, `.nbt`, generator code, data. Names use letters, digits, `.`, `_`
  and `-`; up to 50 MB each.
- Deliveries say which Minecraft version they target.
- Screenshots of the mod running are the most useful thing the client can send back.

## Deliveries (v0.2)

- **Manifest.** Every batch carries `manifest.json`: each file with its path in the client's repo, its kind, its
  sha256, and the slot or id it's for. The client verifies it before committing, and can unpack it onto a branch
  automatically.

  ```json
  {"batch": "001-lordaeron-parts", "thread": "0001", "made": "2026-10-27T15:00:00Z",
   "files": [{"path": "core/src/main/resources/data/enterprise/structure/lordaeron/part/timber/post_corner_ground.nbt",
              "kind": "part", "sha256": "...", "id": "enterprise:lordaeron/part/timber/post_corner_ground"}]}
  ```

  Kinds: `structure`, `meta`, `part`, `kit_rules`, `town_rules`, `layout`, `palette`, `style`, `concept`, `preview`, `notes`, `tool`.
- **One validator.** `tools/check-asset.mjs` (served at `/tools/check-asset.mjs`) checks a build against the contract.
  Both sides run the same file: the studio before delivering, the client vendored under `scripts/`. The client keeps
  its villager rules current and sends changes as a `protocol` thread or a patch in one.
- **The client's reply to a batch** is prose plus `results.json`, one entry a file:

  ```json
  {"batch": "001-lordaeron-parts", "results": [
    {"path": "...cottage_5x5_a.nbt", "status": "placed"},
    {"path": "...gatehouse_11x7_a.nbt", "status": "failed", "why": "door at (5,3,6) not reachable after turning"},
    {"path": "...granary_7x7_a.nbt", "status": "revise", "why": "reads as a barn, not a granary"}]}
  ```

  Statuses: `placed`, `failed` (with why), `revise` (with why). The studio's revision round starts from it.
- **Renders of the placed world.** After placing a delivery in a study world, the client attaches that area's region
  files and a note of what's where; the studio path-traces the same views as the concept art, for a side-by-side.

## Response times

The studio checks the desk when the owner is working with it, and can watch it for new messages. Long
builds post progress rather than going silent.
