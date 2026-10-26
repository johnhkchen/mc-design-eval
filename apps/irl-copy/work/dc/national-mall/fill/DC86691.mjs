// NATIONAL GEOGRAPHIC SOCIETY HEADQUARTERS, 1600 M St NW. A 1960s-70s downtown office block: a granite base course,
// pale precast spandrels, dark bronze glass in light frames, a stepped massing (wings, podium, tower core) from the lidar
// roof heights, smoothed to even tiers so each one stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${FILL}/DC86691.cells.json`, "utf8"));

const PLINTH = "polished_diorite", CORNICE = "polished_diorite", WALL = "white_concrete", PIER = "light_gray_concrete";
const GLASS = "gray_stained_glass", SHOP_GLASS = "glass", SHOP_FRAME = "dark_oak_planks", FLOOR = "smooth_stone";
const LAMP = "glowstone";

const byXZ = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, roof }]));
const at = (x, z) => byXZ.get(`${x},${z}`);
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N, S, W, E
const IN = [[0, 1], [0, -1], [1, 0], [-1, 0]];   // the inward step from each face

// Massing: a 3 x 3 mean of the lidar roof, then to even tiers (6, 8, ... 14) so each storey is a clean flat band.
for (const c of byXZ.values()) {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const o = at(c.x + dx, c.z + dz); if (o) { sum += o.roof; n++; }
  }
  c.H = Math.max(6, Math.round(sum / n / 2) * 2);
}
// Exposed faces: the footprint's edge, or a neighbour on a different tier (a setback's step face).
for (const c of byXZ.values()) {
  c.exp = NB.flatMap(([dx, dz], i) => { const o = at(c.x + dx, c.z + dz); return !o || o.H !== c.H ? [i] : []; });
}

// The front is the first street-side row (at least 8 cells), with the door at the middle of it.
const zs = [...new Set(cells.map(([, z]) => z))].sort((a, b) => a - b);
const zFront = zs.find((z) => cells.filter(([, zz]) => zz === z).length >= 8);
const frontXs = cells.filter(([, z]) => z === zFront).map(([x]) => x);
const mid = (Math.min(...frontXs) + Math.max(...frontXs)) / 2;
const doorX = frontXs.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));

const g = new Voxels([36, 26, 39]);
const lamps = [];

for (const c of byXZ.values()) {
  const { x, z, H } = c;
  const P = c.exp.length > 0, front = P && z === zFront;
  const axisNS = c.exp.some((i) => i < 2), axisWE = c.exp.some((i) => i >= 2);
  const corner = axisNS && axisWE;
  const u = axisNS ? x : z;             // a window's bay is counted along the face it stands on
  const top = H - 1;                    // H is even, so the top course is always an odd row (a floor line)

  for (let y = 0; y <= top; y++) {
    if (y === 0) { g.set(x, y, z, P ? PLINTH : FLOOR); continue; }                // base course / slab
    if (y === top) { g.set(x, y, z, P ? CORNICE : FLOOR); continue; }             // cornice / roof deck
    if (y % 2 === 1) {                                                           // spandrel band or floor slab
      if (P) g.set(x, y, z, front && y === 1 ? SHOP_FRAME : WALL);
      else if (y >= 3) g.set(x, y, z, FLOOR);                                     // a slab per storey, air at the lobby
      continue;
    }
    if (!P) continue;                                                            // air behind the glass
    if (front && y === 2) { g.set(x, y, z, u % 3 === 0 ? SHOP_FRAME : SHOP_GLASS); continue; }
    if (corner || u % 3 === 0) { g.set(x, y, z, PIER); continue; }
    g.set(x, y, z, GLASS);
    if (!front && !corner && y >= 4) lamps.push({ x, y, z, face: c.exp[0] });
  }
  if (P) g.set(x, H, z, CORNICE);                                                 // a one-block parapet on the edge
}

// Entrance: a dark oak door on the street front, a stone-coloured lintel over it.
g.set(doorX, 1, zFront, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(doorX, 2, zFront, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dx of [-1, 1]) if (at(doorX + dx, zFront)) g.set(doorX + dx, 2, zFront, SHOP_FRAME);
for (const dx of [-1, 0, 1]) if (at(doorX + dx, zFront)) g.set(doorX + dx, 3, zFront, "dark_oak_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });

// Warm light behind some panes: a glowstone in the room just inside the glass (one window in nine).
for (const { x, y, z, face } of lamps) {
  if ((x * 7 + z * 5 + y) % 9 !== 0) continue;
  const [dx, dz] = IN[face], ix = x + dx, iz = z + dz;
  const o = at(ix, iz);
  if (o && !o.exp.length) g.set(ix, y, iz, LAMP);
}

// Roof plant: a few light-grey boxes on the tower core and the 12-tier roof, standing on the deck.
for (const c of byXZ.values()) {
  if (c.exp.length || c.H < 12 || c.x % 7 !== 2 || c.z % 5 !== 2) continue;
  g.set(c.x, c.H, c.z, "light_gray_concrete");
  g.set(c.x, c.H + 1, c.z, "light_gray_concrete");
}

const counts = g.save(`${FILL}/DC86691.nbt`);
console.log(`DC86691: ${counts.blocks} blocks, ${counts.palette} palette entries, front z=${zFront} door x=${doorX}`);
