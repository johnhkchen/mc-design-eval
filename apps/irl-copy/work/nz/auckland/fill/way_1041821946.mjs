// The Manhattan (way 1041821946): a late-1960s/70s concrete office-apartment block, 13 storeys on a 24 x 30 m footprint,
// with a 22-storey slim tower on its south-west edge and a 10-storey wing at the north-east. Heights come from the lidar
// roof record (roof 36..92 blocks above y 0), snapped to four tiers so every tier stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 29, H = 105, D = 36;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1041821946.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1041821946.nbt";

// Four tiers, each top on a storey line (top - 1 = 1 + 4k): wing 38, body 50, setback 66, tower 90
const tierTop = (r) => (r >= 80 ? 90 : r >= 60 ? 66 : r >= 46 ? 50 : 38);

const FOUND = "polished_andesite", FLOOR = "stone", ROOF = "gray_concrete", PIER = "white_concrete";
const BAND = "light_gray_concrete", PARAPET = "light_gray_concrete", COPING = "stone_brick_slab";
const LINTEL = "stone_bricks", LIT = "glowstone";
const glassFor = (top) => (top >= 90 ? "cyan_stained_glass" : "light_blue_stained_glass");

const C = new Map();                                    // "x,z" -> { g: ground, top: first air row }
for (const [x, z, g, r] of cells) C.set(`${x},${z}`, { g, top: tierTop(r) });
const colAt = (x, z) => C.get(`${x},${z}`);
const solid = (x, y, z) => { const c = colAt(x, z); return !!c && y >= 0 && y < c.top; };
const FACES = [["west", -1, 0], ["east", 1, 0], ["north", 0, -1], ["south", 0, 1]];
const exposed = (x, y, z) => FACES.filter(([, dx, dz]) => !solid(x + dx, y, z + dz));

// Entrances: the exterior ground-storey window cell nearest each target (south front, north front)
const doorCands = [];
for (const [key] of C) {
  const [x, z] = key.split(",").map(Number);
  const ext = exposed(x, 2, z);
  if (ext.length) doorCands.push({ x, z, face: ext[0] });
}
const nearest = (tx, tz) => doorCands.reduce((best, c) => (Math.hypot(c.x - tx, c.z - tz) < Math.hypot(best.x - tx, best.z - tz) ? c : best));
const doors = [nearest(14, 35), nearest(18, 0)];
const doorAt = new Map(doors.map((d) => [`${d.x},${d.z}`, d]));

const g = new Voxels([W, H, D]);
for (const [key, { g: ground, top }] of C) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < top; y++) {
    // plinth: everything from y 0 to the ground under the cell (and the first floor's base row)
    if (y < Math.max(1, ground)) { g.set(x, y, z, FOUND); continue; }
    const ext = exposed(x, y, z);
    if (y === top - 1) {                                  // the roof: a parapet on the edge, a flat roof inside
      if (ext.length) { g.set(x, y, z, PARAPET); g.set(x, top, z, COPING, { type: "bottom", waterlogged: "false" }); }
      else g.set(x, y, z, ROOF);
      continue;
    }
    const k = Math.floor((y - 1) / 4), phase = (y - 1) % 4;   // storey k starts at floor row 1 + 4k
    if (!ext.length) { if (phase === 0) g.set(x, y, z, FLOOR); continue; }   // interior: a floor slab, else air
    const [face, dx, dz] = ext[0];
    const along = dx ? z : x, bay = along % 3 !== 0;     // two glass bays to a pier, on every face
    const door = doorAt.get(`${x},${z}`);
    if (door && k === 0 && (phase === 1 || phase === 2)) {
      g.set(x, y, z, "oak_door", { facing: face, half: phase === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    let m;
    if (k === 0) m = phase === 0 ? FOUND : phase === 3 ? LINTEL : bay ? glassFor(top) : FOUND;
    else m = phase === 0 || phase === 3 ? BAND : bay ? glassFor(top) : PIER;
    g.set(x, y, z, m);
    // a warm room behind some upper-storey windows: glowstone in the air gap just inside the glass
    if (k >= 1 && (phase === 1 || phase === 2) && bay && (x * 7 + z * 13 + k * 5) % 6 === 0) {
      const ix = x - dx, iz = z - dz;
      if (solid(ix, y, iz) && !exposed(ix, y, iz).length) g.set(ix, y, iz, LIT);
    }
  }
}

// Roof plant: a few one-block housings on the body's flat roof; a lightning rod on the tower
for (const [key, { top }] of C) {
  const [x, z] = key.split(",").map(Number);
  if (top === 50 && (x * 3 + z * 5) % 11 === 0 && !exposed(x, 49, z).length) g.set(x, 50, z, BAND);
}
const rodAt = [...C].filter(([, c]) => c.top === 90).map(([k]) => k.split(",").map(Number)).sort((a, b) => Math.abs(a[0] - 10) + Math.abs(a[1] - 27) - (Math.abs(b[0] - 10) + Math.abs(b[1] - 27)))[0];
if (rodAt) g.set(rodAt[0], 90, rodAt[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const res = g.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, ${res.palette} palette entries`);
