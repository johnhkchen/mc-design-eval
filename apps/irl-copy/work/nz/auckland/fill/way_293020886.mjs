// WY Building: a 1980s Auckland office block, ten storeys on a stone plinth, set back in a ziggurat (rim to 24,
// second ring to 32, the core to the lidar's 40-44). Storeys are 4 blocks from y 8 (the grade at the uphill east
// side), so the plinth fills the downhill side. Each footprint column is solid from y 0 to its roof, and the
// storeys are hollow (air behind the glass, one slab per floor), so nothing floats and no tier stands on air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020886.cells.json", "utf8"));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const key = (x, z) => `${x},${z}`;

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { x, z, ground, roof });
const inF = (x, z) => cell.has(key(x, z));

// ring distance in from the outline: 1 = the outer ring
const dist = new Map(), queue = [];
for (const c of cell.values())
  if (NB.some(([dx, dz]) => !inF(c.x + dx, c.z + dz))) { dist.set(key(c.x, c.z), 1); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of NB) {
    const k = key(c.x + dx, c.z + dz);
    if (inF(c.x + dx, c.z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push(cell.get(k)); }
  }
}

// tiers: the lidar roof quantised to whole storeys (4 blocks), then the setbacks: the rim stops at 24, the next ring at 32
const quant = (r) => Math.max(8, Math.round(r / 4) * 4);
const cap = (d) => (d === 1 ? 24 : d === 2 ? 32 : Infinity);
for (const c of cell.values()) {
  c.d = dist.get(key(c.x, c.z));
  c.top = Math.min(quant(c.roof), cap(c.d));
}

// a storey k spans y 8+4k .. 11+4k; it exists over a column whose top is above it
const hasStorey = (c, k) => c && c.top >= 12 + 4 * k;
// the faces of a storey's cell that open to air (outside the outline, or over a lower neighbour)
const openFaces = (c, k) => NB.filter(([dx, dz]) => !hasStorey(cell.get(key(c.x + dx, c.z + dz)), k));

const g = new Voxels([52, 57, 52]);
const GLASS = "light_blue_stained_glass", BAND = "light_gray_concrete", PIER = "white_concrete";

// the entrance: the east-facing street-level bay with the highest ground (the uphill side meets grade at y 8)
let entrance = null;
for (const c of cell.values()) {
  if (!hasStorey(c, 0) || !openFaces(c, 0).some(([dx, dz]) => dx === 1 && dz === 0)) continue;
  if (!entrance || c.ground > entrance.ground || (c.ground === entrance.ground && Math.abs(c.z - 21) < Math.abs(entrance.z - 21)))
    entrance = c;
}
const entranceKey = entrance ? key(entrance.x, entrance.z) : null;

for (const c of cell.values()) {
  // plinth: solid from y 0 to the storeys, base course on top
  for (let y = 0; y < 7; y++) g.set(c.x, y, c.z, "stone_bricks");
  g.set(c.x, 7, c.z, "polished_andesite");

  // storeys, each 4 blocks: a slab (band) at the floor line, glazing and piers, a header band
  const storeys = (c.top - 8) / 4;
  for (let k = 0; k < storeys; k++) {
    const y0 = 8 + 4 * k, open = openFaces(c, k);
    if (!open.length) {                              // interior: one floor slab, air above it
      g.set(c.x, y0, c.z, "white_concrete");
      continue;
    }
    g.set(c.x, y0, c.z, BAND);                       // the floor line; the glazing runs up to the next one
    // the bay along the face: the x-faces run along z, the z-faces along x; a corner is a pier
    const alongX = open.some(([dx]) => dx !== 0), alongZ = open.some(([, dz]) => dz !== 0);
    const isCorner = alongX && alongZ;
    const bay = alongX && !alongZ ? c.z : alongZ && !alongX ? c.x : 0;
    const pier = isCorner || bay % 3 === 0;
    const [odx, odz] = open.length === 1 ? open[0] : [0, 0];
    const inward = [c.x - odx, c.z - odz];
    const inwardOk = open.length === 1 && hasStorey(cell.get(key(...inward)), k) && openFaces(cell.get(key(...inward)), k).length === 0;

    if (k === 0 && c === entrance) {                  // the entrance door, two blocks high on the street side
      const state = (half) => ({ facing: DIR[`${odx},${odz}`] ?? "east", half, hinge: "left", open: "false", powered: "false" });
      g.set(c.x, y0 + 1, c.z, "dark_oak_door", state("lower"));
      g.set(c.x, y0 + 2, c.z, "dark_oak_door", state("upper"));
      g.set(c.x, y0 + 3, c.z, BAND);                 // the door's head: a lintel over the glazing
      continue;
    }
    if (pier) {
      for (let y = y0 + 1; y <= y0 + 3; y++) g.set(c.x, y, c.z, PIER);
    } else {
      for (let y = y0 + 1; y <= y0 + 3; y++) g.set(c.x, y, c.z, GLASS);
      // a few lit rooms: a glowstone just inside the glass, sitting on the floor slab
      if (inwardOk && (c.x * 31 + c.z * 17 + k * 7) % 9 === 0)
        g.set(inward[0], y0 + 1, inward[1], "glowstone");
    }
  }

  // roof deck; the rim gets a parapet
  g.set(c.x, c.top, c.z, BAND);
  if (c.d === 1 && c.top >= 16) g.set(c.x, c.top + 1, c.z, PIER);
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020886.nbt");
console.log(JSON.stringify(info));
