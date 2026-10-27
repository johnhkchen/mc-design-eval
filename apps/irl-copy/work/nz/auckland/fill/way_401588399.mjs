// Oceanic Hostel (way 401588399): a four-storey, 1970s reinforced-concrete hostel on a round plan, with a
// five-storey setback pavilion over the two lumps of the lidar roof. Era and materials: tilt-up concrete
// piers, tinted glass in aluminium-look bays, a basalt-look plinth on the ground (the Auckland volcanic base
// course), a flat roof with a concrete parapet, and roof plant. Articulation: a base course at y=4, storey
// slabs, glazed bands with spandrels, piers every fourth bay, a lobby on the north face, lights behind glass.
//
// The lidar roof is smoothed into two tiers (a 3x3 median, then 20 or 24 blocks). The 53-block reading is a
// one-cell diagonal along the south-west edge, which a median removes, so it does not set the massing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_401588399.cells.json`, "utf8"));

const W = 42, C = (W - 1) / 2;          // footprint 42 x 42, centre 20.5
const BASE_FILL = "stone_bricks";        // under the ground: solid from y 0 up to the cell's ground
const PLINTH = "deepslate_bricks";       // basalt-look base course above the ground
const SLAB = "smooth_stone";             // storey and roof slabs
const PIER = "white_concrete";           // tilt-up concrete piers and parapets
const SPANDREL = "light_gray_concrete";  // band between the glazing and the next storey
const GLASS = "gray_stained_glass";      // tinted glazing
const CAP = "smooth_stone_slab";         // parapet cap
const PLANT = "iron_block";              // air-conditioning units
const LIFT = "light_gray_concrete";      // lift overrun on the pavilion
const LIGHT_BLOCK = "glowstone";
const LANTERN = "lantern";

// ground and the lidar roof per footprint cell
const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const has = (x, z) => raw.has(`${x},${z}`);

// roof tier per cell: 3x3 median of the lidar roof, then 24 for the setback lumps, 20 for the rest
const tier = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const e = raw.get(`${x + dx},${z + dz}`); if (e) vals.push(e.r);
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  tier.set(`${x},${z}`, med >= 23 ? 24 : 20);
}
const top = (x, z) => tier.get(`${x},${z}`) ?? -1;

// a wall cell is exposed to the outside or to a lower roof (the setback's outer edge and the main ring)
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z) => NB.some(([dx, dz]) => !has(x + dx, z + dz) || top(x + dx, z + dz) < top(x, z));

// piers every fourth bay, bays set by angle around the centre so they run round the drum
const bayOf = (x, z) => Math.floor(((Math.atan2(z - C, x - C) + Math.PI) / (2 * Math.PI)) * 40);

// the cell's inward neighbour (toward the centre), for lights behind the glass
const inward = (x, z) => {
  const dx = x - C, dz = z - C;
  if (Math.abs(dx) >= Math.abs(dz)) return [x - Math.sign(dx), z];
  return [x, z - Math.sign(dz)];
};

const g = new Voxels([W, 65, W]);
const storeys = [4, 8, 12, 16];            // floor slab levels (storey k is 4 blocks high, slab at its base)
const ENTRY = [21, 0];                     // the door on the north face; the lobby is one cell in

// 1. foundation and plinth: solid from y 0 to the floor at 4, under the ground and above it
// 2. floor slabs over every cell at 4, 8, 12, 16 and the roof at 20; the setback's roof at 24
for (const [x, z, gr] of cells) {
  const t = top(x, z), gg = raw.get(`${x},${z}`).g;
  for (let y = 0; y < 4; y++) g.set(x, y, z, y < gg ? BASE_FILL : PLINTH);
  for (const F of [...storeys, 20]) g.set(x, F, z, SLAB);
  if (t === 24) g.set(x, 24, z, SLAB);
}

// 3. the shell: exposed cells are walls. Piers are concrete; the rest are glazing with a spandrel above.
const lights = [];
for (const [x, z] of cells) {
  if (!exposed(x, z)) continue;
  const t = top(x, z), bay = bayOf(x, z);
  const pier = bay % 4 === 0;
  for (let k = 0; ; k++) {
    const F = 4 + 4 * k;
    if (F >= t) break;
    const lo = F + 1;
    if (pier) {
      for (let y = lo; y <= F + 3; y++) g.set(x, y, z, PIER);
    } else {
      g.set(x, lo, z, GLASS); g.set(x, lo + 1, z, GLASS); g.set(x, F + 3, z, SPANDREL);
    }
    if (!pier) lights.push({ x, z, F, k, bay });
  }
  // parapet and cap on the roof edge
  g.set(x, t + 1, z, PIER); g.set(x, t + 2, z, CAP, { type: "bottom" });
}

// 4. the entrance: a dark oak door on the north face, a lobby one cell in, a lintel over the door
const [ex, ez] = ENTRY;
g.set(ex, 5, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex, 6, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(ex, 7, ez, SPANDREL);
g.set(ex, 7, ez + 1, SLAB); g.set(ex + 1, 7, ez + 1, SLAB);           // lobby ceiling and canopy
g.set(ex + 1, 5, ez, GLASS); g.set(ex + 1, 6, ez, GLASS);             // lobby glass beside the door

// 5. warm light behind some windows: glowstone or a lantern on the floor inside
for (const { x, z, F, k, bay } of lights) {
  const [ix, iz] = inward(x, z);
  if (!has(ix, iz) || exposed(ix, iz)) continue;
  if ((bay + 2 * k) % 5 === 0) g.set(ix, F + 1, iz, LIGHT_BLOCK);
  else if ((bay + k) % 7 === 3) g.set(ix, F + 1, iz, LANTERN, { hanging: "false" });
}
// the lobby light
g.set(ex, 5, ez + 2, LANTERN, { hanging: "false" });

// 6. roof equipment: air-conditioning units on the main roof; a lift overrun on the pavilion
const roofInner = cells.filter(([x, z]) => !exposed(x, z) && top(x, z) === 20 && x >= 15 && x <= 26 && z >= 24 && z <= 31);
const unitSpots = [[15, 25], [19, 25], [16, 29], [23, 28]];
for (const [ux, uz] of unitSpots) {
  if (!has(ux, uz) || !has(ux + 1, uz) || !has(ux, uz + 1) || !has(ux + 1, uz + 1)) continue;
  if (!roofInner.some(([x, z]) => x === ux && z === uz)) continue;
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(ux + dx, 21, uz + dz, PLANT);
}
const pav = cells.filter(([x, z]) => top(x, z) === 24 && !exposed(x, z)).map(([x, z]) => [x, z]);
if (pav.length) {
  const [px, pz] = pav[Math.floor(pav.length / 2)];
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    if (!has(px + dx, pz + dz) || exposed(px + dx, pz + dz)) continue;
    for (let y = 25; y <= 27; y++) g.set(px + dx, y, pz + dz, LIFT);
  }
}

const out = g.save(`${DIR}/way_401588399.nbt`);
const counts = { main: 0, setback: 0, walls: 0 };
for (const [x, z] of cells) { if (top(x, z) === 24) counts.setback++; else counts.main++; if (exposed(x, z)) counts.walls++; }
console.log(`Oceanic Hostel: ${cells.length} cells (${counts.main} main roof at 20, ${counts.setback} setback at 24, ${counts.walls} exposed); ${out.blocks} blocks, ${out.palette} palette`);
