// ITB crown and plaza (plot 0): stepped crown on the shaft (y183..202), its penthouse and aircraft lights, floodlights,
// the plaza planters with trees, lamp posts and the approach ramps. Build only into air; the shell's cells are locked.
import { readFileSync } from "node:fs";
import { aircraft_light, planter_tree, slab_ramp } from "../vocab/h1.mjs";
import { floodlight, lamp_post } from "../vocab/h2.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// A stepped mass: a box with its four vertical corners cut by a chamfer of `ch` (cells with a + b < ch dropped).
const massOf = (x0, x1, z0, z1, ch) => (x, z) => {
  if (x < x0 || x > x1 || z < z0 || z > z1) return false;
  return Math.min(x - x0, x1 - x) + Math.min(z - z0, z1 - z) >= ch;
};

// Walls of a mass: bottom course and the course under the top are brown_terracotta bands, the rest glass bays with a
// brown_terracotta mullion every 3rd cell; the cells inside the walls are dark backing. The top course is the deck.
function massBody(g, [x0, x1, z0, z1], ch, y0, y1) {
  const inside = massOf(x0, x1, z0, z1, ch);
  for (let y = y0; y < y1; y++) for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!inside(x, z)) continue;
    const ext = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
    if (!ext) { g.set(x, y, z, "black_concrete"); continue; }
    const onNS = (z === z0 || z === z1) && x !== x0 && x !== x1;
    const onEW = (x === x0 || x === x1) && z !== z0 && z !== z1;
    const idx = onNS ? x : onEW ? z : x + z;
    const band = y === y0 || y === y1 - 1;
    const frame = band || idx % 3 === 0;
    g.set(x, y, z, frame ? "brown_terracotta" : "brown_stained_glass");
  }
  // the top course: lit rim on the outer ring, sea lantern one in, deck inside with a lantern grid every 12
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!inside(x, z)) continue;
    const ext = !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
    const ring1 = !ext && (!inside(x - 2, z) || !inside(x + 2, z) || !inside(x, z - 2) || !inside(x, z + 2));
    if (ext) g.set(x, y1, z, "light_gray_stained_glass");
    else if (ring1) g.set(x, y1, z, "sea_lantern");
    else if ((x - x0) % 12 === 6 && (z - z0) % 12 === 6) g.set(x, y1, z, "sea_lantern");
    else g.set(x, y1, z, "smooth_stone");
  }
}

export function build(g) {
  const site = JSON.parse(readFileSync(new URL("../site.json", import.meta.url), "utf8")).plots[0];
  const fp = (x, z) => site.footprint[z >> 1]?.[x >> 1] === "#";

  // crown step 1 (y183..190) and step 2 (y191..197): solid stepped masses on the shell's roof deck at y182
  massBody(g, [20, 65, 22, 67], 5, 183, 190);
  massBody(g, [24, 61, 26, 63], 4, 191, 197);

  // penthouse y198..202: brown terracotta walls, iron louvres on alternate cells at y199..200, smooth stone roof
  const ph = [34, 51, 36, 53];
  for (let x = ph[0]; x <= ph[1]; x++) for (let z = ph[2]; z <= ph[3]; z++) {
    for (let y = 198; y <= 201; y++) {
      const ring = x === ph[0] || x === ph[1] || z === ph[2] || z === ph[3];
      if (!ring) { g.set(x, y, z, "black_concrete"); continue; }
      const face = z === ph[2] ? "north" : z === ph[3] ? "south" : x === ph[0] ? "west" : "east";
      const idx = face === "north" || face === "south" ? x : z;
      if ((y === 199 || y === 200) && idx % 2 === 0) g.set(x, y, z, ...B.trapdoor("iron", face, "top", true));
      else g.set(x, y, z, "brown_terracotta");
    }
    g.set(x, 202, z, "smooth_stone");
  }

  // aircraft lights: penthouse corner masts (y203..204) and the step-2 chamfer corners (y198)
  for (const [x, z] of [[35, 37], [50, 37], [35, 52], [50, 52]]) aircraft_light(g, x, 203, z);
  for (const [x, z] of [[26, 28], [59, 28], [26, 61], [59, 61]]) aircraft_light(g, x, 198, z);

  // floodlights on the step-1 deck, aimed at the crown: four per side, end_rod up
  for (const z of [34, 42, 50, 58]) { floodlight(g, 22, 191, z); floodlight(g, 63, 191, z); }
  for (const x of [30, 38, 46, 54]) { floodlight(g, x, 191, 24); floodlight(g, x, 191, 65); }

  // plaza planters: 5 x 5 boxes with an oak, only where the whole box is on footprint cells, in the three triangles
  const shaftBox = (x, z) => x >= 16 && x <= 69 && z >= 18 && z <= 71;
  const planterCells = new Set();
  const tris = [[70, 85, 30, 46], [4, 15, 50, 62], [30, 60, 72, 84]];
  for (const [tx0, tx1, tz0, tz1] of tris) for (let cx = tx0 + 2; cx <= tx1 - 2; cx += 6) for (let cz = tz0 + 2; cz <= tz1 - 2; cz += 6) {
    let ok = true;
    for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) {
      const x = cx + dx, z = cz + dz;
      ok = fp(x, z) && !shaftBox(x, z);
    }
    if (!ok) continue;
    const r = planter_tree(g, cx, 5, cz);
    if (r.ok) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) planterCells.add(`${cx + dx},${cz + dz}`);
    else console.log(`itb-crown: planter at ${cx},${cz} blocked: ${r.blocked.length} cells`);
  }

  // lamp posts every 10 blocks on the plaza, two cells in from the footprint edge, clear of shaft, planters and lobby
  for (let x = 5; x <= 85; x += 10) for (let z = 5; z <= 85; z += 10) {
    let ok = true;
    for (let dx = -2; dx <= 2 && ok; dx++) for (let dz = -2; dz <= 2 && ok; dz++) ok = fp(x + dx, z + dz);
    if (!ok || shaftBox(x, z) || planterCells.has(`${x},${z}`)) continue;
    if (x >= 20 && x <= 61 && z >= 8 && z <= 21) continue;
    lamp_post(g, x, 5, z);
  }

  // approach ramps (plan: east x84..89 z34..40 climbing west; north x36..44 z6..11 climbing south). The shell's plinth
  // fills these cells to y4, so the ramp is refused and the result says so.
  const eastRamp = slab_ramp(g, [89, 0, 34], "west", 7, { rise: 4 });
  const northRamp = slab_ramp(g, [36, 0, 6], "south", 9, { rise: 4 });
  if (!eastRamp.ok) console.log(`itb-crown: east ramp blocked at ${eastRamp.blocked.length} cells (shell plinth)`);
  if (!northRamp.ok) console.log(`itb-crown: north ramp blocked at ${northRamp.blocked.length} cells (shell plinth)`);
}
