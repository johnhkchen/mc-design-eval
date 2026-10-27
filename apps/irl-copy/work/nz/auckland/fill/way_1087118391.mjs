// Way 1087118391, Eden Terrace edge of the CBD: a 1980s ten-storey office block on a stepped base, a glazed
// shopfront at street level and a plant box on the roof. The lidar roof is smoothed (3x3 median over the footprint)
// and quantised into 4-block storeys counted up from each cell's own ground, so the downhill side carries more storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1087118391.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1087118391.nbt";
const [W, H, D] = [42, 55, 36];

const FOUND = "stone";              // solid from y 0 up to each cell's ground
const BASE = "polished_andesite";   // base course at street level
const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";     // mullions, spandrels, cornice
const SLAB = "light_gray_concrete"; // floor slab line per storey
const ROOF = "gray_concrete";       // roof covering
const PLANT = "light_gray_concrete";
const LIGHT = "glowstone";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inFoot = (x, z) => cell.has(key(x, z));
// [dx, dz, name of the direction the face looks]
const NB = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const outward = (x, z) => NB.filter(([dx, dz]) => !inFoot(x + dx, z + dz));

// massing: the lidar roof is blurred over a 7x7 window of footprint cells (its 1-3 block spikes are noise at this
// scale), then snapped to three flat tiers: a podium, a mid block and the tower (lidar tops reach 42)
const TIERS = [[10, 8], [26, 20], [Infinity, 40]];
for (const c of cell.values()) {
  let sum = 0, cnt = 0;
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) { const n = cell.get(key(c.x + dx, c.z + dz)); if (n) { sum += n.r; cnt++; } }
  const blur = sum / cnt;
  const tierTop = TIERS.find(([lim]) => blur <= lim)[1];
  c.n = Math.min(10, Math.max(2, Math.round((tierTop - c.g) / 4)));
  c.top = c.g + 4 * c.n;
  c.faces = outward(c.x, c.z);
  c.perim = c.faces.length > 0;
}

// entrance: the perimeter cell nearest the footprint's centre, lower ground preferred (street side)
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length, cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
const door = [...cell.values()].filter((c) => c.perim && c.faces.length)
  .sort((a, b) => (Math.hypot(a.x - cx, a.z - cz) + 2 * a.g) - (Math.hypot(b.x - cx, b.z - cz) + 2 * b.g))[0];
const doorKey = key(door.x, door.z);
const doorFacing = door.faces[0][2];

const g = new Voxels([W, H, D]);
const maxTop = Math.max(...[...cell.values()].map((c) => c.top));

for (const c of cell.values()) {
  const { x, z, g: gr, n, top } = c;
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  if (!c.perim) {
    // interior: a floor slab per storey and a roof, air between; glow behind the glass comes from the wall pass
    for (let k = 1; k < n; k++) g.set(x, gr + 4 * k, z, SLAB);
    g.set(x, top - 1, z, ROOF);
    if (top >= maxTop - 1 && x % 3 === 1 && z % 3 === 1) {
      g.set(x, top, z, PLANT); g.set(x, top + 1, z, PLANT);
    }
    continue;
  }

  for (let k = 0; k < n; k++) {
    const b = gr + 4 * k;
    const isDoor = k === 0 && key(x, z) === doorKey;
    g.set(x, b, z, isDoor ? "oak_door" : k === 0 ? BASE : SLAB, isDoor ? { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" } : undefined);
    for (const dy of [1, 2]) {
      const y = b + dy;
      if (isDoor && dy === 1) { g.set(x, y, z, "oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      const mullion = (x + z) % 3 === 0;                 // frames every third cell, glass between
      g.set(x, y, z, mullion ? FRAME : GLASS);
    }
    if (isDoor) g.set(x, b + 3, z, FRAME);               // lintel over the door
    if (k < n - 1) g.set(x, b + 3, z, FRAME);            // spandrel under the next floor line
    else g.set(x, top - 1, z, ROOF);                      // roof covering on the walls
  }
  g.set(x, top, z, FRAME);                                 // cornice / parapet course

  // warm light behind some windows: the interior air cell opposite each outward face, one row above its floor
  for (let k = 0; k < n; k++) {
    if ((x * 3 + z * 5 + k) % 4 !== 0) continue;
    for (const [dx, dz] of c.faces) {
      const ix = x - dx, iz = z - dz;                    // inward
      const inner = cell.get(key(ix, iz));
      if (!inner || inner.perim || k >= inner.n) continue;
      g.set(ix, inner.g + 4 * k + 1, iz, LIGHT);
      break;
    }
  }
}

const info = g.save(OUT);
console.log(`way_1087118391: ${info.blocks} blocks, ${info.palette} palette entries, door at ${door.x},${door.z} facing ${doorFacing}, tallest top ${maxTop}`);
