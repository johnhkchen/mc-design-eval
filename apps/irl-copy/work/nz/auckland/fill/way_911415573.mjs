// The Britomart: a 10-storey 1920s-30s brick commercial block on the Britomart / Queen St edge. Basalt plinth on the
// lidar ground, brick walls with stone quoins and string courses, glazed shopfronts at street level, a stepped
// crown set back from the wings, a flat roof with a parapet and plant. Hollow: a floor slab per storey, air behind glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_911415573.cells.json`, "utf8"));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// footprint: g = lidar ground (top of the basalt plinth), r = lidar roof height above y 0
const foot = new Map();
const k2 = (x, z) => `${x},${z}`;
for (const [x, z, g, r] of cells) foot.set(k2(x, z), { g, r });
const cellAt = (x, z) => foot.get(k2(x, z));

// distance in cells from the footprint edge: the crown sets back one cell from the wings' outer ring
const dist = new Map();
let frontier = [];
for (const [x, z] of cells) if (DIRS.some(([dx, dz]) => !cellAt(x + dx, z + dz))) { dist.set(k2(x, z), 1); frontier.push([x, z]); }
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (cellAt(nx, nz) && !dist.has(k2(nx, nz))) { dist.set(k2(nx, nz), d + 1); next.push([nx, nz]); }
  }
  frontier = next;
}

// flat tiers: the 40-block lidar roof becomes a 10-storey crown (40), the wings and podium stop at 36 (9 storeys)
const topOf = (x, z) => { const c = cellAt(x, z); return c.r >= 38 && dist.get(k2(x, z)) >= 2 ? 40 : 36; };
const groundOf = (x, z) => cellAt(x, z).g;

// a voxel is building where the footprint cell stands from its ground up to its tier, nothing outside the footprint
const present = (x, y, z) => { if (!cellAt(x, z)) return false; return y >= groundOf(x, z) && y < topOf(x, z); };
const exteriorDirs = (x, y, z) => DIRS.filter(([dx, dz]) => !present(x + dx, y, z + dz));

const g = new Voxels([25, 52, 25]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const lanterns = [];   // window voxels whose inside is a room: a lantern or glowstone behind the glass

for (const [x, z] of cells) {
  const G = groundOf(x, z), T = topOf(x, z);
  for (let y = 0; y < T; y++) {
    if (y < G) { set(x, y, z, "cobbled_deepslate"); continue; }    // basalt plinth, the volcanic stone under the city
    const ext = exteriorDirs(x, y, z);
    if (!ext.length) {                                              // inside: floor slab per storey, air above
      if (y === G || (y % 4 === 0 && y > G) || y === T - 1) set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === T - 1) { set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }   // parapet
    if (y === G) { set(x, y, z, "stone_bricks"); continue; }         // base course
    if (y === T - 2) { set(x, y, z, "smooth_stone"); continue; }     // cornice under the parapet
    if (y % 4 === 0) { set(x, y, z, "smooth_stone"); continue; }    // storey string course
    const [dx, dz] = ext[0];
    const a = dx !== 0 ? z : x;                                      // position along this facade
    const pier = a % 3 === 0;
    const ground = y - G <= 3 && y < G + 4;
    if (ground) {                                                    // shopfront: glass between brick piers
      if (pier) set(x, y, z, "bricks"); else { set(x, y, z, "glass"); lanterns.push({ x, y, z, dx, dz, shop: true }); }
      continue;
    }
    const phase = y % 4;
    if (phase === 3) { set(x, y, z, pier ? "bricks" : "stone_bricks"); continue; }   // lintel over each window
    if (pier) set(x, y, z, "bricks");
    else { set(x, y, z, "glass"); lanterns.push({ x, y, z, dx, dz, shop: false }); }
  }
}

// lights behind some of the glass: a lantern or glowstone on the room's floor, in the inside air
const lit = [];
for (const w of lanterns) {
  const ix = w.x - w.dx, iz = w.z - w.dz;
  if (!present(ix, w.y, iz) || exteriorDirs(ix, w.y, iz).length) continue;
  const floorBelow = w.y - 1 === groundOf(ix, iz) || ((w.y - 1) % 4 === 0 && w.y - 1 > groundOf(ix, iz));
  if (!floorBelow) continue;
  if (w.shop && (w.x + w.z) % 3 === 0) { set(ix, w.y, iz, "glowstone"); lit.push(w); }
  else if (!w.shop && (w.x * 7 + w.y * 3 + w.z * 5) % 4 === 0) { set(ix, w.y, iz, "lantern", { hanging: "false", waterlogged: "false" }); lit.push(w); }
}

// the entrance: the south-facing wall cell nearest the middle, a dark oak door with a lintel above it
const south = cells.filter(([x, z]) => !cellAt(x, z + 1)).sort((a, b) => Math.abs(a[0] - 12) - Math.abs(b[0] - 12));
const [dx0, dz0, G0] = south[0];
set(dx0, G0 + 1, dz0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
set(dx0, G0 + 2, dz0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
set(dx0, G0 + 3, dz0, "stone_bricks");

// roof plant: two light-grey plant boxes on the crown, well inside it
const crown = cells.filter(([x, z]) => topOf(x, z) === 40 && dist.get(k2(x, z)) >= 3).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
for (const i of [Math.floor(crown.length / 3), Math.floor((2 * crown.length) / 3)]) {
  const [px, pz] = crown[i];
  for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) for (const yy of [40, 41]) set(px + ox, yy, pz + oz, "light_gray_concrete");
}

const res = g.save(`${DIR}/way_911415573.nbt`);
console.log(JSON.stringify({ cells: cells.length, crown: crown.length, lit: lit.length, ...res }));
