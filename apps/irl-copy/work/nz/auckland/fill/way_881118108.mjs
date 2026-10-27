// Te Kupenga, Mt Eden side of the CBD: a ten-storey concrete-and-glass office block on a stone plinth. The lidar roof
// reads as one 36-block body (nine storeys) with a 40-block core (ten) pushed into its middle, so the massing is a
// tower on a podium: the core steps in one cell all round at the body's level, and a plant box sits on the core roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_881118108.cells.json", "utf8"));
const g = new Voxels([88, 52, 71]);

const STOREY = 4;                       // blocks per storey (about 3.3 m)
const key = (x, z) => `${x},${z}`;
const roof = new Map(), ground = new Map();
for (const [x, z, gr, r] of cells) { roof.set(key(x, z), r); ground.set(key(x, z), gr); }
const inFp = (x, z) => roof.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 1. Roof from lidar: 3x3 median over the footprint (kills the DSM noise), then quantised to storeys
const smooth = new Map();
for (const [x, z] of [...roof.keys()].map((k) => k.split(",").map(Number))) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) vals.push(roof.get(key(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  smooth.set(key(x, z), vals[Math.floor(vals.length / 2)]);
}
const storeys = new Map();
for (const [k, s] of smooth) storeys.set(k, Math.max(1, Math.round((s - 1) / STOREY)));   // 39+ -> 10, 36-38 -> 9

// 2. Setback: the ten-storey core keeps only its interior; the ring one cell in steps down to the body's nine
const core = (x, z) => storeys.get(key(x, z)) >= 10;
const dist = new Map();
const queue = [];
for (const k of storeys.keys()) { const [x, z] = k.split(",").map(Number); if (!core(x, z)) { dist.set(k, 0); queue.push([x, z]); } }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i]; const d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const nk = key(x + dx, z + dz);
    if (inFp(x + dx, z + dz) && !dist.has(nk)) { dist.set(nk, d + 1); queue.push([x + dx, z + dz]); }
  }
}
const topStoreys = (x, z) => {
  if (!core(x, z)) return storeys.get(key(x, z));
  return dist.get(key(x, z)) >= 2 ? 10 : 9;
};
const N = new Map();
for (const [k] of storeys) { const [x, z] = k.split(",").map(Number); N.set(k, topStoreys(x, z)); }
const nAt = (x, z) => (inFp(x, z) ? N.get(key(x, z)) : 0);

// Which sides of a cell at storey k face open air (a missing neighbour or a lower roof): those are the walls
const exposed = (x, z, k) => DIRS.filter(([dx, dz]) => nAt(x + dx, z + dz) <= k);

// 3. Foundation: solid from y 0 up to the cell's ground
for (const [x, z, gr] of cells) for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

// 4. Storeys: slab per storey, walls on exposed faces, air behind the glass
const PIER = "white_concrete", SPANDREL = "light_gray_concrete", GLASS = "light_blue_stained_glass", SHOP = "glass";
const SLAB = "smooth_stone", ROOF = "gray_concrete", CORNICE = "smooth_stone_slab";
let lit = 0;
for (const [x, z] of [...smooth.keys()].map((k) => k.split(",").map(Number))) {
  const n = N.get(key(x, z));
  for (let k = 0; k < n; k++) {
    const y0 = k * STOREY, faces = exposed(x, z, k);
    if (!faces.length) { g.set(x, y0, z, SLAB); continue; }
    // the facade runs along x for a z-facing face, else along z; corners take the x run
    const along = faces.some(([dx, dz]) => dz !== 0) ? x : z;
    const bay = along % 3 === 0;   // pier every third block
    const inward = faces[0];        // inside is the opposite way to the first exposed face
    const ix = x - inward[0], iz = z - inward[1];
    if (k === 0) {
      g.set(x, 0, z, "stone_bricks");                       // base course
      for (let y = 1; y <= 2; y++) g.set(x, y, z, bay ? PIER : SHOP);
      g.set(x, 3, z, PIER);                                  // shopfront lintel
    } else {
      g.set(x, y0, z, SLAB);                                 // storey line
      g.set(x, y0 + 1, z, bay ? PIER : GLASS);
      g.set(x, y0 + 2, z, bay ? PIER : GLASS);
      g.set(x, y0 + 3, z, bay ? PIER : SPANDREL);
      // warm light behind some lit windows: glowstone on the inside cell, one bay in five
      if (!bay && (along + k) % 5 === 0 && inFp(ix, iz) && nAt(ix, iz) > k && !exposed(ix, iz, k).length) {
        g.set(ix, y0 + 1, iz, "glowstone"); lit++;
      }
    }
  }
  // roof: a gray slab on top of the last storey, cornice on the exposed edge
  const top = n * STOREY;
  g.set(x, top, z, ROOF);
  if (exposed(x, z, n - 1).length) g.set(x, top + 1, z, CORNICE, { type: "bottom", waterlogged: "false" });
}

// 5. Entrance: a door in the west wall of the ground floor, nearest the middle of the street front
let door = null;
for (const [x, z] of [...smooth.keys()].map((k) => k.split(",").map(Number))) {
  if (inFp(x - 1, z) || ground.get(key(x, z)) > 1) continue;
  if (!door || Math.abs(z - 35) < Math.abs(door[1] - 35)) door = [x, z];
}
if (door) {
  const [dx, dz] = door;
  g.set(dx, 1, dz, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, 2, dz, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// 6. Plant on the core roof: a solid box well inside the core, a lantern on its corner
const coreCells = [...N.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => N.get(key(x, z)) === 10 && dist.get(key(x, z)) >= 3);
if (coreCells.length) {
  const cx = Math.round(coreCells.reduce((s, c) => s + c[0], 0) / coreCells.length);
  const cz = Math.round(coreCells.reduce((s, c) => s + c[1], 0) / coreCells.length);
  const top = 10 * STOREY;
  const plant = coreCells.filter(([x, z]) => Math.abs(x - cx) <= 5 && Math.abs(z - cz) <= 4);
  for (const [x, z] of plant) {
    g.set(x, top + 1, z, "light_gray_concrete");
    g.set(x, top + 2, z, "light_gray_concrete");
  }
  const [lx, lz] = plant.reduce((a, b) => (a[0] + a[1] <= b[0] + b[1] ? a : b));   // a lantern on the plant's corner
  g.set(lx, top + 3, lz, "lantern", { hanging: "false", waterlogged: "false" });
}

// 7. Check: no hole in any wall band (the floor slabs inside are supposed to hang over the air of the storey below)
const holes = [];
for (const [x, z] of [...smooth.keys()].map((k) => k.split(",").map(Number))) {
  const n = N.get(key(x, z));
  for (let k = 0; k < n; k++) {
    if (exposed(x, z, k).length) for (let y = k * STOREY; y < k * STOREY + STOREY; y++) if (!g.get(x, y, z)) holes.push([x, y, z]);
  }
}
console.log(`wall holes ${holes.length}`);

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_881118108.nbt";
const r = g.save(out);
console.log(`Te Kupenga: ${r.blocks} blocks, ${r.palette} palette, ${lit} lit windows, door ${door ? door.join(",") : "none"} -> ${out}`);
