// Way 269714221: a 1920s stripped-classical brick commercial block, three storeys at its tallest, stepping
// down to two and one on the lower wings. Materials are the period's: red brick walls, cream render (smooth
// quartz) for the string courses, piers and parapet, stone-brick plinth, dark-oak shopfront fascia, glass panes.
// Lidar roof heights are median-smoothed on the footprint, then quantised to 1, 2 or 3 storeys on a 4-block pitch.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_269714221.cells.json`, "utf8"));   // [x, z, ground, roof]
const X = 47, Z = 18, Y = 26;

const foot = new Map();                                    // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) foot.set(`${x},${z}`, { ground, roof });
const inF = (x, z) => foot.has(`${x},${z}`);

// Storey count per cell: the lidar roof averaged over a 5x5 window of footprint cells (the roof field is noisy cell to
// cell, and the averaged field gives clean tiers instead of a sawtooth), then quantised: 1 storey ~6-7 blocks, 2 ~10, 3 ~13.
const storeys = new Map();
for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const f = foot.get(`${x + dx},${z + dz}`); if (f) { sum += f.roof; n++; } }
  const mean = sum / n;
  storeys.set(key, mean >= 12 ? 3 : mean >= 8 ? 2 : 1);
}
const nOf = (x, z) => storeys.get(`${x},${z}`) ?? 0;
// Storey datum: solid plinth 0-1, ground floor slab at y=2, then a slab every 4 blocks; the roof cap sits at 2+4n.
const capOf = (x, z) => (inF(x, z) ? 2 + 4 * nOf(x, z) : -1);
// A face is exposed at height y when the neighbour is outside or its roof is below y (a setback or step).
const exposed = (x, z, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]]
  .filter(([dx, dz]) => !inF(x + dx, z + dz) || capOf(x + dx, z + dz) < y);

const g = new Voxels([X, Y, Z]);
const lit = [];                                            // interior cells behind lit windows (glowstone)

for (const key of foot.keys()) {
  const [x, z] = key.split(",").map(Number);
  const n = nOf(x, z), C = 2 + 4 * n;

  // plinth (base course) and the ground-floor slab
  g.set(x, 0, z, "stone_bricks"); g.set(x, 1, z, "stone_bricks");
  const ex2 = exposed(x, z, 2);
  g.set(x, 2, z, ex2.length ? "smooth_quartz" : "smooth_stone");

  for (let y = 3; y <= C; y++) {
    if (y === C) { g.set(x, y, z, "stone"); continue; }     // roof cap: dark grey, reads as flat roof from the air
    const ex = exposed(x, z, y);
    const r = (y - 2) % 4;                                  // 0 = floor slab, 1-3 = storey rows
    if (r === 0) {                                          // floor slab, cream string course where it is outside
      g.set(x, y, z, ex.length ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (!ex.length) continue;                               // interior air behind the envelope
    const ground = y < 6;
    const [dx, dz] = ex[0];
    const coord = dz !== 0 ? x : z;
    const pier = ex.length > 1 || coord % 4 === 0;          // corners and every fourth bay are cream piers
    const door = ground && x === 5 && z === 1 && dz === -1; // the entrance on the north face
    if (pier) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (r === 3) { g.set(x, y, z, ground ? "dark_oak_planks" : "bricks"); continue; }   // fascia / brick head
    if (door) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ground && x === 6 && z === 1 && r === 2) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    const isLit = ex.length === 1 && (x * 5 + z * 3 + n) % 5 === 0;
    if (r === 1 && !isLit) { g.set(x, y, z, ground ? "stone_bricks" : "smooth_quartz"); continue; }   // bulkhead / sill
    // glazing: panes that join along the wall they sit in
    const along = dz !== 0 ? { east: "true", west: "true", north: "false", south: "false" }
                           : { north: "true", south: "true", east: "false", west: "false" };
    g.set(x, y, z, "glass_pane", along);
    if (r === 1 && isLit) lit.push([x - dx, y, z - dz]);   // the lamp stands on the floor slab behind the pane
  }

  // parapet on the roof edge, where the cap meets the outside or a lower step
  if (C < 16 && exposed(x, z, C).length && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inF(x + dx, z + dz) || capOf(x + dx, z + dz) < C))
    g.set(x, C + 1, z, "smooth_quartz");
}

// warm light behind the lit panes (only where the interior cell is air)
for (const [x, y, z] of lit) if (inF(x, z) && !exposed(x, z, y).length) g.set(x, y, z, "glowstone");

// roof plant on the tallest tier: a light-grey concrete box on the cap, on cells whose neighbours are all in the top tier
for (let x = 17; x <= 24; x++) for (let z = 4; z <= 7; z++) {
  const top = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) top.push(nOf(x + dx, z + dz) === 3);
  if (top.every(Boolean)) { g.set(x, 15, z, "light_gray_concrete"); g.set(x, 16, z, "light_gray_concrete"); }
}

const out = `${DIR}/way_269714221.nbt`;
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries; storeys ${[1, 2, 3].map(n => [...storeys.values()].filter(v => v === n).length).join("/")}`);
