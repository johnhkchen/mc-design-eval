// way 269467617: a three-storey brick commercial block (c. 1910-1930 Auckland: shopfront at street level, pilastered
// brick upper floors on string courses, a stone cornice and parapet, a flat roof with a lift overrun). Footprint and
// ground are from the lidar cells; the massing is one flat roof at y 14 on a datum of y 2 (the highest ground under
// it), so the storey lines stay level across the 2-block slope, and every column is solid from y 0 up to the plinth.
// Walls are a one-cell shell; interiors are air except the floor slabs; lights stand on a slab behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_269467617.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inF = (x, z) => F.has(key(x, z));
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const missing = (x, z) => dirs.filter(([dx, dz]) => !inF(x + dx, z + dz)).length;
const ring = (x, z) => inF(x, z) && missing(x, z) > 0;                                  // the shell: a footprint edge cell
const alongX = (x, z) => inF(x - 1, z) || inF(x + 1, z);                                // which way the facade runs
const pier = (x, z) => (x + z) % 3 === 0 || missing(x, z) >= 2;                         // brick piers between the bays
// the interior cell a shell cell looks into, for lights behind its glass
const inward = (x, z) => dirs.map(([dx, dz]) => [x + dx, z + dz]).find(([a, b]) => inF(a, b) && !ring(a, b));

const g = new Voxels([22, 26, 18]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// the front (north, z 0) gets the entrance, at the middle of its three shell cells
const door = [...F.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => z === 0 && ring(x, z));
const doorX = door.length ? door[Math.floor(door.length / 2)][0] : 4;

for (const [x, z] of [...F.keys()].map((k) => k.split(",").map(Number))) {
  // plinth and base course: solid from y 0 to the datum (foundation under the sloped ground, downhill plinth shows extra storeys)
  for (let y = 0; y <= 2; y++) put(x, y, z, "polished_andesite");
  // the ground floor slab and the upper floor slabs and roof deck fill the whole footprint, shell included
  put(x, 6, z, ring(x, z) ? "stone_bricks" : "smooth_stone");
  put(x, 10, z, ring(x, z) ? "stone_bricks" : "smooth_stone");
  put(x, 13, z, ring(x, z) ? "stone_bricks" : "smooth_stone");
  if (!ring(x, z)) continue;

  const p = pier(x, z);
  // ground storey: shopfront glass between stone piers, a lintel course at y 5
  put(x, 3, z, p ? "stone_bricks" : "glass");
  put(x, 4, z, p ? "stone_bricks" : "glass");
  put(x, 5, z, "bricks");
  // upper storeys: 2-high windows (glass panes, framed by the sill, lintel and string courses) or brick piers
  for (const y of [7, 8, 11, 12]) {
    if (p) put(x, y, z, "bricks");
    else put(x, y, z, "glass_pane", alongX(x, z)
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
  put(x, 9, z, "stone_bricks");                                                 // sill / lintel band
  put(x, 10, z, "bricks");                                                      // string course
  put(x, 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });  // coping over the cornice
}

// the entrance: a two-high oak door in the front shell, with its lintel course above
put(doorX, 3, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(doorX, 4, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// warm light: glowstone behind the shopfront glass, shroomlights behind some upper windows; each stands on a slab
for (const [x, z] of [...F.keys()].map((k) => k.split(",").map(Number))) {
  if (!ring(x, z)) continue;
  const into = inward(x, z);
  if (!into) continue;
  if (!pier(x, z) && (x * 3 + z) % 4 === 0) put(into[0], 3, into[1], "glowstone");
  if (!pier(x, z) && (x + z * 2) % 5 === 0) put(into[0], 7, into[1], "shroomlight");
  if (!pier(x, z) && (x * 2 + z) % 7 === 3) put(into[0], 11, into[1], "shroomlight");
}

// roof: a lift overrun on the core and two plant units, on the flat deck the shell's coping closes
for (let x = 9; x <= 12; x++) for (let z = 6; z <= 8; z++) for (let y = 14; y <= 15; y++) put(x, y, z, "stone_bricks");
for (const [x, z] of [[14, 8], [15, 8]]) if (inF(x, z)) put(x, 14, z, "iron_block");

const { blocks, palette } = g.save(`${HERE}/way_269467617.nbt`);
console.log(JSON.stringify({ blocks, palette }));
