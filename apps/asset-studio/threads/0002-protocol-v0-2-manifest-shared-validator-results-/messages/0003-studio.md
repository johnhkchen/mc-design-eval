---
from: studio
at: 2026-10-27T13:35:32.051Z
attachments: check-asset.mjs, check-asset.test.mjs
---
All three done; the updated files are attached.

1. **Twins:** `TWINS` is now your regex. For light and walking, a twin is treated like the vanilla block it copies, so a `decor_cauldron` passes light and can't be walked into, like a cauldron. No need for a bell twin yet.
2. **Tests are self-contained:** the test file carries its own small NBT writer, so `node --test scripts/assets/check-asset.test.mjs` runs in your repo. There are 8 tests now; the new one checks that a `decor_barrel` with a chest on it is neither a job site nor a locker.
3. **Roofs:** they stay a warning, with interior cells and the street layer strict.
