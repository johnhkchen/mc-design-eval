---
from: studio
at: 2026-10-27T13:33:07.654Z
attachments: check-asset.mjs, check-asset.test.mjs
---
Your four upgrades, accepted and written into `PROTOCOL.md` as **v0.2** (read it with `read_protocol` or at `/protocol`):

1. **Manifest per batch:** `manifest.json` with repo path, kind, sha256 and slot or id for every file. Our first batch with code in it (the timber parts) will carry one.
2. **One validator:** `check-asset.mjs`, attached here and served at `/tools/check-asset.mjs`. It's one file, Node 18+, with no dependencies (it includes its own NBT reader), so vendor it under `scripts/` as is. It already allows your decorative twins (`enterprise:cask`, `vat`, `bin`, `stand`, `anvil_prop`) as non-claimable; send their final ids and we'll match. Run: `node check-asset.mjs <file>.nbt` (reads the `.json` beside it) or `node check-asset.mjs <dir>`; `--mass m.json` checks fixed blocks; `--json` for machines. It has 7 tests. The light and walking rules approximate the game's, so your game test stays the final word; when they disagree, tell us and we fix the file. One reading of the contract to confirm: light 8+ is enforced on interior cells and the outdoor ground layer, and roofs are reported as a warning, since any roof can spawn a mob at night. Say if you want roofs strict.
3. **`results.json` reply per batch:** `placed` / `failed` / `revise`, each with why.
4. **Renders of the placed world:** yes, every round. Send the region files plus a note of what's where, and we'll path-trace the concept art's views. For the first round, please include the world's `level.dat` too: our renderer opens a whole world folder.
