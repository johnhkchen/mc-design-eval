import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Roof ~11 blocks above lowest ground, so a two-storey
// 1980s Taiwanese commercial block: stone plinth, cream tiled walls, shopfront
// glazing on the ground storey, two rows of pane windows above, a cornice,
// a parapet and rooftop water tanks.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831858859";
const W = 19, H = 23, D = 27;

const BAND = 5;     // storey line / upper floor slab
const ROOF = 10;    // roof slab (interior) and cornice course (boundary)
const PARAPET = 11; // parapet course on the boundary

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of raw) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// Outward faces of a footprint cell (a face is outward where the neighbour is missing).
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}
// Step from a wall cell into the building interior.
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Entrance: the middle of the north-facing wall run (single-face north cells).
const northCells = [];
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  const f = faces(x, z);
  if (f.length === 1 && f[0] === "north") northCells.push(x);
}
northCells.sort((a, b) => a - b);
const doorX = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;
const doorZ = (() => {
  if (doorX === null) return null;
  return [...ground.keys()].map(k => k.split(",").map(Number))
    .filter(([x]) => x === doorX)
    .map(([, z]) => z)
    .filter(z => !has(z === undefined ? 0 : doorX, z - 1))
    .sort((a, b) => a - b)[0] ?? null;
})();

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faces(x, z);
  const boundary = f.length > 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!boundary) {
    // Interior: upper floor slab and roof slab, air in between (no interiors).
    if (gr <= BAND) g.set(x, BAND, z, "smooth_stone");
    if (gr <= ROOF) g.set(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  const f0 = f[0];
  const along = (f0 === "north" || f0 === "south") ? x : z;
  const pillar = f.length > 1 || along % 3 === 0;

  // Plinth course at ground level.
  g.set(x, gr, z, "stone_bricks");

  // Ground storey: shopfront glazing, lintel band just under the storey line.
  for (let y = gr + 1; y < BAND; y++) {
    if (y >= BAND - 1) {
      g.set(x, y, z, "smooth_quartz");
    } else if (pillar) {
      g.set(x, y, z, "smooth_quartz");
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Entrance door on the north face, two cells tall, transom glass above.
  if (f0 === "north" && f.length === 1 && x === doorX && z === doorZ && gr + 2 < BAND - 1) {
    g.set(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false" });
    g.set(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false" });
    g.set(x, gr + 3, z, "light_blue_stained_glass");
  }

  // Storey line between the two floors.
  if (gr <= BAND) g.set(x, BAND, z, "light_gray_concrete");

  // Upper storey: pane windows framed by quartz pilasters.
  for (let y = BAND + 1; y <= ROOF - 2; y++) {
    if (pillar) g.set(x, y, z, "smooth_quartz");
    else g.set(x, y, z, "light_blue_stained_glass_pane");
  }
  // Sill / lintel band above the upper windows.
  g.set(x, ROOF - 1, z, "light_gray_concrete");

  // Cornice course and parapet.
  g.set(x, ROOF, z, "stone_bricks");
  g.set(x, PARAPET, z, pillar ? "smooth_quartz" : "white_concrete");

  // Warm lights behind some upper windows: glowstone in the interior cell.
  if (!pillar && along % 6 === 1) {
    const [dx, dz] = INWARD[f0];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && faces(ix, iz).length === 0 && gnd(ix, iz) <= 7) {
      g.set(ix, BAND + 2, iz, "glowstone");
    }
  }
}

// Roof slab across the interior (already set per cell); rooftop water tanks on 2x2 blocks.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (x % 7 !== 3 || z % 7 !== 3) continue;
  const block = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  const ok = block.every(([bx, bz]) => has(bx, bz) && faces(bx, bz).length === 0 && gnd(bx, bz) <= ROOF);
  if (!ok) continue;
  for (const [bx, bz] of block) {
    g.set(bx, ROOF + 1, bz, "white_concrete");
    g.set(bx, ROOF + 2, bz, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
