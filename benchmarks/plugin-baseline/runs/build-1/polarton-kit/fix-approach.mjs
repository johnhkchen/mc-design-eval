// v2: the farmhouse's porch balustrade ran unbroken across the top of its slab step (x 29..30, z 6), so the way in from
// the gate ended at a fence (owner's approach standard: slab step, landing, door). Open the balustrade there, 2 wide.
import { load } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
const g = load("v1.nbt");
for (const x of [29, 30]) g.set(x, 2, 7, "air");
const fence = (x, y, z) => /fence/.test(g.blockAt(x, y, z));
for (const x of [28, 31]) { const c = g.get(x, 2, 7); if (c && /fence$/.test(c.block)) g.set(x, 2, 7, c.block, { ...c.state, east: String(fence(x + 1, 2, 7)), west: String(fence(x - 1, 2, 7)) }); }
g.save("v2.nbt"); console.log("v2.nbt");
