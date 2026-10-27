// Spark Data Centre, Auckland (way 292861387): a late-1990s precast-concrete office-and-plant block, five storeys on
// a hillside. The lidar roof reads 19-20 over most of the footprint, 16-18 on the north-west shoulder and under 12 at a
// few corners (noise, kept at three storeys). Each column stands on a stone foundation from y 0 to its ground, then
// storeys of 4 blocks: a string course, two rows of glazing in frames, and a spandrel. The footprint's lowest street face
// (the west side here) carries the entrance: a recessed bay with an iron door and glazed flanks under a lintel. The
// ground storey is solid with louvres; the roof is a membrane with a cornice, and a louvred plant box stands on it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861387.cells.json`, "utf8"));   // [x, z, ground, roof]
const OUT = `${DIR}/way_292861387.nbt`;

const W = 35, D = 45, H = 26;
// roof tiers: the lidar's 19-20 is one flat roof, 16-18 a lower wing, the rest noise kept at three storeys;
// never less than two storeys above the column's own ground, so a column is never a stub on a hill
const snapTop = (r) => (r >= 19 ? 20 : r >= 16 ? 16 : 12);
const col = new Map();
for (const [x, z, g, r] of cells) {
  col.set(`${x},${z}`, { x, z, g, top: Math.max(snapTop(r), Math.ceil((g + 8) / 4) * 4) });
}
const at = (x, z) => col.get(`${x},${z}`);
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const FACING = { W: "west", E: "east", N: "north", S: "south" };

// a neighbour is open air at height y when it is off the footprint or y is above its roof
const outdoor = (x, z, y) => { const n = at(x, z); return !n || y >= n.top; };
const exposure = (c, y) => Object.keys(DIRS).filter((d) => outdoor(c.x + DIRS[d][0], c.z + DIRS[d][1], y));

// the entrance: three cells in a row on the lowest street face, all on the lowest ground, the door in the middle
const minG = Math.min(...[...col.values()].map((c) => c.g));
const cx = [...col.values()].reduce((s, c) => s + c.x, 0) / col.size;
const cz = [...col.values()].reduce((s, c) => s + c.z, 0) / col.size;
let bay = null;
for (const c of col.values()) {
  if (c.g !== minG) continue;
  for (const d of Object.keys(DIRS)) {
    if (!exposure(c, 0).includes(d)) continue;
    const t = DIRS[d][0] === 0 ? [1, 0] : [0, 1];
    const cs = [-1, 0, 1].map((k) => at(c.x + t[0] * k, c.z + t[1] * k));
    if (!cs.every((b) => b && b.top === c.top && b.g <= minG + 1)) continue;   // flanks may sit a block up the slope
    const dist = Math.hypot(c.x - cx, c.z - cz);
    if (!bay || dist < bay.dist) bay = { d, mid: c, cells: cs, dist };
  }
}

// the plant box: a 7 x 5 louvred enclosure on the flat roof, well inside the perimeter, nearest the centre
let plant = null;
for (const c of col.values()) {
  if (c.top !== 20) continue;
  const x0 = c.x - 3, x1 = c.x + 3, z0 = c.z - 2, z1 = c.z + 2;
  let fits = true;
  for (let x = x0; x <= x1 && fits; x++) for (let z = z0; z <= z1; z++) {
    const n = at(x, z); if (!n || n.top !== 20 || exposure(n, 19).length) { fits = false; break; }
  }
  if (!fits) continue;
  const dist = Math.hypot(c.x - cx, c.z - cz);
  if (!plant || dist < plant.dist) plant = { x0, x1, z0, z1, dist };
}

const M = {
  foundation: "stone_bricks", base: "polished_andesite", string: "smooth_quartz", wall: "light_gray_concrete",
  spandrel: "white_concrete", mullion: "white_concrete", roof: "gray_concrete", floor: "light_gray_concrete",
  vent: "iron_bars", glass: "light_blue_stained_glass", pane: "light_blue_stained_glass_pane",
  door: "iron_door", lantern: "lantern", plant: "light_gray_concrete",
};

const g = new Voxels([W, H, D]);
const lamps = [];   // interior cells just behind a pane, lit standing on their floor slab

for (const c of col.values()) {
  const { x, z, g: gr, top } = c;
  for (let y = 0; y < top; y++) {
    if (y < gr) { g.set(x, y, z, M.foundation); continue; }
    const ex = exposure(c, y);
    const k = Math.floor(y / 4), o = y % 4;

    if (y === top - 1) { g.set(x, y, z, ex.length ? M.string : M.roof); continue; }   // cornice cap, roof membrane
    if (!ex.length) { if (o === 0) g.set(x, y, z, M.floor); continue; }                 // interior: a slab per storey, air between

    // the entrance bay, recessed on the street face: door and lobby glass under a lintel
    if (bay && bay.cells.includes(c) && y <= 3 && ex.includes(bay.d)) {
      if (c === bay.mid) {
        if (y <= 1) g.set(x, y, z, M.door, { facing: FACING[bay.d], half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        else if (y === 2) g.set(x, y, z, M.glass);
        else g.set(x, y, z, M.string);
      } else {
        g.set(x, y, z, y === 3 ? M.string : M.glass);
      }
      if (c === bay.mid && y === 1) { const n = at(x - DIRS[bay.d][0], z - DIRS[bay.d][1]); if (n) lamps.push({ n, y: 1 }); }
      continue;
    }

    if (o === 0) { g.set(x, y, z, k === 0 ? M.base : M.string); continue; }          // base course, then a string course per storey
    if (o === 3) { g.set(x, y, z, M.spandrel); continue; }
    if (ex.length > 1) { g.set(x, y, z, M.mullion); continue; }                          // a corner column

    const d = ex[0];
    const t = d === "E" || d === "W" ? z : x;
    if (k === 0) {                                                                      // solid ground storey with louvres
      g.set(x, y, z, t % 4 === 2 ? M.vent : M.wall, t % 4 === 2 ? { north: d === "E" || d === "W" ? "true" : "false", south: d === "E" || d === "W" ? "true" : "false", east: d === "N" || d === "S" ? "true" : "false", west: d === "N" || d === "S" ? "true" : "false", waterlogged: "false" } : undefined);
      continue;
    }
    if (t % 3 === 0) { g.set(x, y, z, M.mullion); continue; }                           // window frames
    const along = d === "E" || d === "W" ? { north: "true", south: "true", east: "false", west: "false" }
                                         : { north: "false", south: "false", east: "true", west: "true" };
    g.set(x, y, z, M.pane, { ...along, waterlogged: "false" });
    if (y % 4 === 1 && t % 6 === 1) {                                                   // warm light behind some panes
      const inward = [-DIRS[d][0], -DIRS[d][1]];
      const n = at(x + inward[0], z + inward[1]);
      if (n && !exposure(n, y).length && n.g <= y) lamps.push({ n, y: y });
    }
  }
}

// lamps: a lantern standing on the interior floor slab, behind the glass (y is the pane row or the door row)
for (const { n, y } of lamps) {
  const lampY = y === 1 ? 1 : Math.floor(y / 4) * 4 + 1;
  if (lampY < n.top - 1 && lampY > n.g) g.set(n.x, lampY, n.z, M.lantern, { hanging: "false", waterlogged: "false" });
}

// the plant box: walls to y 22 with louvres, a lid at y 23, standing on the roof membrane at y 19
if (plant) {
  const { x0, x1, z0, z1 } = plant;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    g.set(x, 23, z, M.plant);                                                          // the lid
    if (!edge) continue;
    for (let y = 20; y <= 22; y++) {
      const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
      if (corner) { g.set(x, y, z, M.plant); continue; }
      if (y === 21 && ((x + z) % 2 === 0)) {
        const alongX = z === z0 || z === z1;
        g.set(x, y, z, M.vent, { north: alongX ? "true" : "false", south: alongX ? "true" : "false", east: alongX ? "false" : "true", west: alongX ? "false" : "true", waterlogged: "false" });
      } else g.set(x, y, z, M.plant);
    }
  }
}

const stats = g.save(OUT);
console.log(`way_292861387: ${stats.blocks} blocks, palette ${stats.palette}; entrance ${bay ? bay.d + " face" : "none"}; plant ${plant ? "yes" : "no"}; ${lamps.length} lamp spots`);
