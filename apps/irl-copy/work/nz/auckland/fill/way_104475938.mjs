// WC Building, Auckland: a 1970s-80s three-storey commercial block of pale precast concrete and blue-tinted glazing,
// with a two-block plant band and lift overrun on its east end (the lidar's 13-14 m block). Built only on the footprint.
//   Massing: lidar roof median-smoothed (3x3), tiers 12 (3 storeys of 4) and 14 (the east block with plant).
//   Foundation: solid from y 0 to each cell's ground. Storeys are on absolute rows (floor slabs at 0, 4, 8, 12).
//   Facade: a one-cell shell (glass or spandrel on the outside), air behind it, floor slabs and a roof slab per tier.
//   Exposure per row: a side is exposed where the neighbour is off the footprint or lower than this row, so the
//   setback walls of the east block stand on the main roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_104475938.cells.json`, "utf8"));

const W = 79, D = 44, H = 27;
const vox = new Voxels([W, H, D]);
const SIDES = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// palette
const FOUND = "stone_bricks";           // foundation and the ground-level plinth
const SLAB = "smooth_stone";            // interior floor slabs
const ROOF = "gray_concrete";           // roof membrane (interior top)
const SPAN = "light_gray_concrete";     // spandrels, storey lines, fascia
const CORNICE = "smooth_stone";         // roof-edge cornice
const PIER = "white_concrete";          // wall and window mullions
const GLASS = "light_blue_stained_glass";
const SHOP = "gray_stained_glass";      // dark tinted shopfront
const SHOPFRAME = "white_concrete";
const DOOR = "dark_oak_door";

const key = (x, z) => `${x},${z}`;
const byKey = new Map();
const list = cells.map(([x, z, g, raw]) => {
  const c = { x, z, g, raw, T: 0 };
  byKey.set(key(x, z), c);
  return c;
});

// 1. Roof tiers: 3x3 median of the lidar roof, then two tiers: 12 (three storeys) and 14 (east block with plant)
const median = (a) => a.slice().sort((p, q) => p - q)[Math.floor(a.length / 2)];
for (const c of list) {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = byKey.get(key(c.x + dx, c.z + dz)); if (n) v.push(n.raw); }
  c.T = median(v) >= 13.5 ? 14 : 12;
}
const at = (x, z) => byKey.get(key(x, z));

// the sides of this cell exposed at row y: off the footprint, or the neighbour's roof is below this row
const exposed = (c, y) => SIDES.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y >= n.T; });
const isInterior = (c, y) => exposed(c, y).length === 0;

// 2. Facade rows for an exposed cell
function facade(c, y, E) {
  if (y === c.T - 1) return CORNICE;
  if (y === c.g) return FOUND;
  const k = Math.floor(y / 4), r = y % 4;
  const [dx] = E[0];
  const along = dx !== 0 ? c.z : c.x;
  const pier = E.length >= 2 || along % 3 === 0;   // corners and every third cell are mullions
  if (k === 0) {
    if (r === 0) return FOUND;
    if (r === 3) return SPAN;
    return pier ? SHOPFRAME : SHOP;
  }
  if (r === 0 || r === 3) return SPAN;
  return pier ? PIER : GLASS;
}

// 3. Fill: foundation, then facade or interior per row
for (const c of list) {
  for (let y = 0; y < c.T; y++) {
    if (y < c.g) { setB(c.x, y, c.z, FOUND); continue; }
    const E = exposed(c, y);
    if (E.length) { setB(c.x, y, c.z, facade(c, y, E)); continue; }
    if (y === c.T - 1) setB(c.x, y, c.z, ROOF);
    else if (y % 4 === 0) setB(c.x, y, c.z, SLAB);
  }
}
function setB(x, y, z, b, st) { vox.set(x, y, z, b, st); }

// 4. Entrance on the side with the most ground-level perimeter (ground at or below 1), centred on that side
{
  const sideCount = Object.fromEntries(SIDES.map(([dx, dz, n]) => [n, 0]));
  const ground = list.filter((c) => c.g <= 1 && c.T === 12 && exposed(c, 1).length === 1);
  for (const c of ground) sideCount[exposed(c, 1)[0][2]]++;
  const side = Object.entries(sideCount).sort((a, b) => b[1] - a[1])[0][0];
  const sd = SIDES.find((s) => s[2] === side);
  const row = ground.filter((c) => exposed(c, 1)[0][2] === side);
  const along = (c) => (sd[0] !== 0 ? c.z : c.x);
  const alongs = row.map(along).sort((a, b) => a - b);
  const mid = alongs[Math.floor(alongs.length / 2)];
  const door = row.find((c) => along(c) === mid);
  if (door) {
    // stone surround: pilasters either side of the door, lintel above (the storey-one fascia row)
    for (const s of [-1, 0, 1]) {
      const cx = door.x + (sd[0] !== 0 ? 0 : s), cz = door.z + (sd[0] !== 0 ? s : 0);
      const c = at(cx, cz); if (!c || c.T !== 12) continue;
      if (s !== 0) for (const y of [1, 2]) setB(cx, y, cz, FOUND);
      setB(cx, 3, cz, FOUND);
    }
    setB(door.x, 1, door.z, DOOR, { facing: side, half: "lower", hinge: "left", open: "false", powered: "false" });
    setB(door.x, 2, door.z, DOOR, { facing: side, half: "upper", hinge: "left", open: "false", powered: "false" });
    // a warm lantern hanging inside the lobby under the slab, lit through the glazing
    const ix = door.x - sd[0], iz = door.z - sd[1], inner = at(ix, iz);
    if (inner && isInterior(inner, 3)) setB(ix, 3, iz, "lantern", { hanging: "true" });
  }
}

// 5. Warm lights: glowstone or shroomlight behind some shopfronts and windows (the cell inside the facade)
for (const c of list) {
  for (let y = 1; y < c.T; y++) {
    if (y < c.g) continue;
    const E = exposed(c, y);
    if (!E.length) continue;
    const r = y % 4;
    if (r !== 1 && r !== 2) continue;            // the two glass rows of each storey
    if (E.length > 1) continue;                  // not on corners
    const [dx, dz] = E[0];
    const h = (c.x * 5 + c.z * 3 + y * 7) % 7;
    if (h !== 0) continue;
    const ix = c.x - dx, iz = c.z - dz, inner = at(ix, iz);
    if (!inner || !isInterior(inner, y) || y < inner.g) continue;
    const lamp = (c.x + c.z + y) % 2 === 0 ? "glowstone" : "shroomlight";
    setB(ix, y, iz, lamp);
  }
}

// 6. Roof: a plant band of AC boxes on the main roof, a lift overrun on the east block
for (const c of list) {
  if (c.T !== 12) continue;
  const interiorTop = SIDES.every(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return n && n.T >= c.T && n.T === 12; }) && (c.x % 9 === 4 && c.z % 7 === 3);
  if (interiorTop) { setB(c.x, 12, c.z, "iron_block"); }
}
{
  const east = list.filter((c) => c.T === 14);
  const cx = Math.round(east.reduce((s, c) => s + c.x, 0) / east.length);
  const cz = Math.round(east.reduce((s, c) => s + c.z, 0) / east.length);
  let ok = true;
  const ring = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -1; dz <= 1; dz++) {
    const c = at(cx + dx, cz + dz);
    if (!c || c.T !== 14) ok = false; else ring.push([c, dx, dz]);
  }
  if (ok) {
    for (const [c, dx, dz] of ring) {
      const edge = Math.abs(dx) === 2 || Math.abs(dz) === 1;
      if (edge) { setB(c.x, 14, c.z, "white_concrete"); setB(c.x, 15, c.z, "gray_concrete"); }
      else { setB(c.x, 15, c.z, "gray_concrete"); }
    }
  }
}

// 7. Save and report
const summary = vox.save(`${DIR}/way_104475938.nbt`);
const tiers = list.reduce((m, c) => (m[c.T] = (m[c.T] || 0) + 1, m), {});
console.log(JSON.stringify({ footprint: list.length, tiers, ...summary }));
