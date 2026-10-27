// Huawei Centre (Auckland CBD, Queen Street side of the Commercial Bay blocks): a late-20th / early-21st century glass
// office tower on a stone plinth, the lidar's ~97 m (116 blocks) roof read as a main deck with a taller service core,
// low wings at the edges. Pale concrete storey bands and blue-green glass in mullioned bays, lit at dusk from behind the
// glass. Massing follows the lidar roof per cell, median-smoothed and snapped to 4-block storey lines, so every tier
// stands on the floor below it; the floors are slabs on pillars and the glass has an air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24252778.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_24252778.nbt";

const X = 51, Y = 128, Z = 44;
const g = new Voxels([X, Y, Z]);

// --- footprint and per-cell massing ---------------------------------------------------------------------------------
const raw = new Map();                                    // "x,z" -> { g, r }
for (const [x, z, ground, roof] of cells) raw.set(`${x},${z}`, { g: ground, r: roof });
const at = (x, z) => raw.get(`${x},${z}`) ?? null;
const inFoot = (x, z) => raw.has(`${x},${z}`);

// a 3x3 median of the lidar roof stops single-cell noise; the top snaps down to a 4-block storey line, and the floor
// line F is the storey at or above the lidar ground, so the plinth (stone) fills up to the ground floor everywhere
const cell = new Map();
for (const [key, c] of raw) {
  const [x, z] = key.split(",").map(Number);
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(x + dx, z + dz); if (n) near.push(n.r); }
  near.sort((a, b) => a - b);
  const rs = near[(near.length - 1) >> 1];
  const F = 4 * Math.ceil(c.g / 4);                      // ground floor slab
  const T = Math.max(4 * Math.floor(rs / 4), F + 4);     // deck: the top floor's slab
  cell.set(key, { x, z, g: c.g, F, T, rs });
}
const deckOf = (x, z) => { const c = cell.get(`${x},${z}`); return c ? c.T : -Infinity; };

// the cell's side is open at height y when there is no footprint beside it or the neighbour's deck is below y
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const openSides = (x, z, y) => DIRS.filter(([dx, dz]) => !inFoot(x + dx, z + dz) || deckOf(x + dx, z + dz) < y);
const deep = (x, z) => { for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (!inFoot(x + dx, z + dz)) return false; return true; };
const faceName = ([dx, dz]) => (dx === 1 ? "east" : dx === -1 ? "west" : dz === 1 ? "south" : "north");

// deterministic pseudo-random in [0, 1) so the same build repeats
const H = (a, b, c) => {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const FOUND = "stone";                  // fill under the ground line
const PLINTH = "stone_bricks";           // the masonry plinth between the ground and the ground floor
const BASE = "polished_andesite";        // base course on the ground floor, and the piers of the shopfront
const SLAB = "light_gray_concrete";      // floor slabs and storey lines
const HEAD = "white_concrete";           // the spandrel band over each window row, and the parapet
const MULLION = "gray_concrete";         // window frames
const GLASS = ["cyan_stained_glass", "light_blue_stained_glass", "gray_stained_glass"];
const PILLAR = "light_gray_concrete";    // interior columns on a 6-cell grid, deep inside the footprint
const LIGHTS = [];                       // lamps behind the glass, set after the facade so they land in the air gap

// --- entrance: the lowest street side, the middle bay of its face -------------------------------------------------
const lowEdge = [...cell.values()].filter(c => c.g <= 2 && openSides(c.x, c.z, c.F + 1).length);
const faceCount = {};
for (const c of lowEdge) { const f = faceName(openSides(c.x, c.z, c.F + 1)[0]); faceCount[f] = (faceCount[f] ?? 0) + 1; }
const street = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0]?.[0];
const bayOf = (c) => { const [dx] = openSides(c.x, c.z, c.F + 1)[0]; return (((dx !== 0 ? c.z : c.x) % 3) + 3) % 3; };
const onStreet = lowEdge.filter(c => faceName(openSides(c.x, c.z, c.F + 1)[0]) === street && bayOf(c) === 1);
const along = (c) => (street === "north" || street === "south" ? c.x : c.z);
onStreet.sort((a, b) => along(a) - along(b));
const entrance = onStreet[Math.floor(onStreet.length / 2)] ?? null;
const doorKey = entrance ? `${entrance.x},${entrance.z}` : null;

// --- the main pass: one column per footprint cell ------------------------------------------------------------------
for (const c of cell.values()) {
  const { x, z, g: ground, F, T } = c;

  // foundation to the lidar ground, then masonry plinth up to the ground floor
  // the plinth is banded in 3-cell piers of polished stone between the masonry, so the flat base reads as a base course
  const pier = x % 3 === 0 || z % 3 === 0 ? BASE : PLINTH;
  for (let y = 0; y < F; y++) g.set(x, y, z, y < ground ? FOUND : (y >= F - 1 ? BASE : pier));

  // floor slabs on every storey line, the base course on the ground floor and the deck on top
  for (let y = F; y <= T; y += 4) g.set(x, y, z, y === F ? BASE : SLAB);

  // pillars: interior columns on a 6-cell grid, only where the 5x5 around them is inside (no pillar behind glass)
  if (x % 6 === 0 && z % 6 === 0 && deep(x, z)) for (let y = F + 1; y <= T; y++) if (y % 4) g.set(x, y, z, PILLAR);

  // the facade: each exposed face is bays of 3 (frame, two glass panes), a spandrel band at the top of each storey
  for (let y = F; y <= T; y++) {
    const rel = y % 4;
    if (rel === 0) continue;
    const open = openSides(x, z, y);
    if (!open.length) continue;
    const [dx, dz] = open[0];
    const bay = dx !== 0 ? z : x;
    const b = ((bay % 3) + 3) % 3;
    const ground_storey = y < F + 4;
    if (rel === 3) { g.set(x, y, z, HEAD); continue; }
    if (ground_storey) {
      if (b === 0) { g.set(x, y, z, BASE); continue; }
      if (entrance && doorKey === `${x},${z}` && b === 1) {
        // the lobby door, facing out, with its lintel canopy above
        const facing = faceName([dx, dz]);
        const st = { facing, hinge: "left", open: "false", powered: "false" };
        g.set(x, y, z, "dark_oak_door", { ...st, half: rel === 1 ? "lower" : "upper" });
        continue;
      }
      g.set(x, y, z, "cyan_stained_glass");
      continue;
    }
    if (b === 0) { g.set(x, y, z, MULLION); continue; }
    const glass = H(bay, y, x * 31 + z) < 0.2 ? GLASS[2] : H(bay, y, x * 31 + z + 7) < 0.35 ? GLASS[1] : GLASS[0];
    g.set(x, y, z, glass);
    if (rel === 1 && b === 2 && H(bay, y, x * 31 + z + 3) < 0.14) {
      // a lit office: the lamp stands on the slab, in the air gap just inside this bay
      const tx = x - dx, tz = z - dz;
      if (inFoot(tx, tz) && deckOf(tx, tz) >= y && !openSides(tx, tz, y).length) {
        LIGHTS.push([tx, y, tz, H(bay, y, 5) < 0.4 ? "glowstone" : "shroomlight"]);
      }
    }
  }

  // parapet and coping on the outer edge of the top, and wherever a taller neighbour does not hide it
  if (openSides(x, z, T + 1).length) {
    g.set(x, T + 1, z, HEAD);
    g.set(x, T + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// the lobby's canopy: a lintel of slabs over the door and the bays either side of it, on the storey above
if (entrance) {
  const [dx, dz] = openSides(entrance.x, entrance.z, entrance.F + 1)[0];
  for (const s of [-1, 0, 1]) {
    const ax = dx !== 0 ? entrance.x : entrance.x + s, az = dx !== 0 ? entrance.z + s : entrance.z;
    if (inFoot(ax, az) && openSides(ax, az, entrance.F + 3).length) {
      g.set(ax, entrance.F + 3, az, "polished_andesite_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// roof equipment on the main deck: plant boxes set in from the parapet, standing on the deck
for (const c of cell.values()) {
  const { x, z, T } = c;
  if (T !== 104 || x % 9 < 4 || x % 9 > 6 || z % 9 < 4 || z % 9 > 6) continue;
  let inner = true;
  for (let dz = -3; dz <= 3 && inner; dz++) for (let dx = -3; dx <= 3; dx++) if (!inFoot(x + dx, z + dz)) { inner = false; break; }
  if (!inner) continue;
  g.set(x, T + 1, z, "gray_concrete");
  g.set(x, T + 2, z, "iron_bars");
}

// the warm lights, last so nothing overwrites them
for (const [x, y, z, block] of LIGHTS) g.set(x, y, z, block);

const stats = g.save(OUT);
console.log("way_24252778:", stats, "entrance:", entrance ? `${entrance.x},${entrance.z} (${street})` : "none", "lights:", LIGHTS.length);
