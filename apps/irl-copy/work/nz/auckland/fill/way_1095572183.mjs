// Way 1095572183: a two-storey interwar brick commercial block at the Mt Eden / Eden Terrace edge. The lidar roof is
// flat (ground 0, roof 9 on every cell), so the massing is three flat tiers: a stone plinth and string course, brick
// walls with stone quoins, glazed bays in dark-wood frames, and a brick parapet on a stone head band. The street face
// is the west side: a dark-wood shopfront with a door. Interiors are air except the floor slab (y4), the roof deck (y7)
// and a few lights behind glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_1095572183.cells.json`, "utf8"));
if (cells.some(([, , ground, roof]) => ground !== 0 || roof !== 9)) throw new Error("bands assume ground 0, roof 9");

const g = new Voxels([6, 22, 10]);
const inF = (x, z) => cells.some(([cx, cz]) => cx === x && cz === z);
const NB = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const exposed = (x, z) => Object.keys(NB).filter((f) => !inF(x + NB[f][0], z + NB[f][1]));

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // a run along z
const PANE_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // a run along x
const windows = new Set();

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  // plinth (y0), string course and floor slab (y4), roof deck (y7) over the whole footprint
  g.set(x, 0, z, "stone_bricks");
  g.set(x, 4, z, "stone_bricks");
  g.set(x, 7, z, "stone_bricks");

  const faces = exposed(x, z);
  if (!faces.length) { g.set(x, 7, z, "smooth_stone"); continue; }   // interior: air below the roof deck, lit below
  const corner = faces.length > 1;
  g.set(x, 8, z, corner ? "stone_bricks" : "bricks");          // parapet on the wall line, cornered in stone
  if (corner) {                                                  // the stepped outline has many corners: brick, not quoins
    for (let y = 1; y <= 7; y++) g.set(x, y, z, "bricks");
    continue;
  }

  const f = faces[0];
  const along = f === "W" || f === "E" ? z : x;
  const street = f === "W";
  const window = along % 2 === 1;                               // every other bay; the rest are piers
  const pane = f === "W" || f === "E" ? PANE_NS : PANE_EW;
  if (window) windows.add(`${x},${z}`);

  for (const y of [1, 2]) g.set(x, y, z, window ? "glass_pane" : street ? "dark_oak_planks" : "bricks", window ? pane : undefined);
  g.set(x, 3, z, street ? "dark_oak_planks" : "bricks");        // shopfront fascia / ground-storey lintel
  for (const y of [5, 6]) g.set(x, y, z, window ? "glass_pane" : "bricks", window ? pane : undefined);
  g.set(x, 7, z, "stone_bricks");                               // head band over the upper bays
}

// the shop door on the street face, one cell past the corner
g.set(0, 1, 6, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(0, 2, 6, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm light: a lantern on the shop floor behind the street glass, glowstone behind some upper bays
g.set(1, 1, 7, "lantern", { hanging: "false", waterlogged: "false" });
for (let x = 0; x < 6; x++) for (let z = 0; z < 10; z++) {
  if (!inF(x, z) || exposed(x, z).length) continue;
  const nearWindow = Object.values(NB).some(([dx, dz]) => windows.has(`${x + dx},${z + dz}`));
  if (nearWindow && (x + z) % 3 === 0) g.set(x, 5, z, "glowstone");
}

// roof plant: two steel units on the deck, inside the parapet
g.set(3, 8, 3, "iron_block");
g.set(4, 8, 3, "iron_block");

const stats = g.save(`${dir}/way_1095572183.nbt`);
console.log(JSON.stringify({ cells: cells.length, windows: windows.size, ...stats }));
