// Columbard: a 1970s-80s concrete-frame office tower with tinted glass and white precast spandrels (the CBD's
// Commercial Bay-era idiom), 18 storeys of 4 blocks on a stepped lidar massing. Tiers come from the lidar roof per
// cell (smoothed to 10/18/34/50/66/70), the ground floor sits on a 2-block podium, each storey is a slab with a
// 3-block band (spandrel, glazed band with mullions, head), interior is air with a structural column grid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861413.cells.json`, "utf8"));
const W = 20, H = 85, D = 36;
const DATUM = 2;                                                  // the ground-floor slab; storeys every 4 above it

// lidar roof -> clean tier tops (each 2 mod 4, so every storey and roof lands on the same grid)
const tierOf = (r) => (r <= 2 ? 2 : r <= 14 ? 10 : r <= 26 ? 18 : r <= 42 ? 34 : r <= 58 ? 50 : r <= 68 ? 66 : 70);
const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, top: tierOf(r) });
const topAt = (x, z) => foot.get(`${x},${z}`)?.top ?? -1;
const inside = (x, z) => topAt(x, z) >= 0;

const DIRS = [
  { dx: 0, dz: -1, name: "north" }, { dx: 0, dz: 1, name: "south" },
  { dx: 1, dz: 0, name: "east" }, { dx: -1, dz: 0, name: "west" },
];
const opposite = (d) => DIRS.find((e) => e.dx === -d.dx && e.dz === -d.dz);

const plan = new Map();
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  plan.set(`${x},${y},${z}`, { x, y, z, block, state });
};
const get = (x, y, z) => plan.get(`${x},${y},${z}`);

// the facade of a storey whose floor slab is at f: spandrel, glazed band with mullions, head course
function facade(x, z, y, f, ground) {
  if (y === f + 1) return ground ? "polished_granite" : "white_concrete";
  if (y === f + 3) return "white_concrete";
  if ((x + z) % 3 === 0) return "light_gray_concrete";                          // mullion
  return (x + 2 * z) % 5 === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
}

// 1. shell: foundation, floor slabs, and the envelope where a storey has no neighbour (outside, or a lower tier)
for (const [key, { top }] of foot) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < DATUM; y++) put(x, y, z, "stone_bricks");
  for (let f = DATUM; f <= top; f += 4) put(x, f, z, "light_gray_concrete");
  for (let f = DATUM; f < top; f += 4) {
    for (let y = f + 1; y <= f + 3; y++) {
      // exposed to the air: outside the footprint, or above a lower tier's roof (that face is exterior too)
      const exposed = DIRS.some((d) => !inside(x + d.dx, z + d.dz) || topAt(x + d.dx, z + d.dz) <= y);
      if (exposed) put(x, y, z, facade(x, z, y, f, f === DATUM));
    }
  }
}

// 2. parapets on every outside edge of a tier roof (lidar 72 on the tower), roof plant on the tower's flat roof
for (const [key, { top }] of foot) {
  if (top < 10) continue;
  const [x, z] = key.split(",").map(Number);
  if (DIRS.some((d) => !inside(x + d.dx, z + d.dz))) put(x, top + 1, z, "light_gray_concrete");
}
for (let x = 7; x <= 8; x++) for (let z = 13; z <= 15; z++) if (topAt(x, z) === 70) put(x, 71, z, "gray_concrete");

// 3. structural column grid through the interior (bays of 4), so every floor plate stands on something
for (const [key, { top }] of foot) {
  const [x, z] = key.split(",").map(Number);
  if (x % 4 !== 1 || z % 4 !== 1) continue;
  if (!DIRS.every((d) => topAt(x + d.dx, z + d.dz) >= top)) continue;
  for (let y = DATUM; y < top; y++) put(x, y, z, "light_gray_concrete");
}

// 4. entrance on the street-facing run of ground-floor wall (the longest outside face), with three stair steps,
// a canopy on two posts, and a hanging lantern under the canopy
const faces = new Map();
for (const [key, { top }] of foot) {
  if (top < 18) continue;
  const [x, z] = key.split(",").map(Number);
  for (const d of DIRS) {
    if (inside(x + d.dx, z + d.dz)) continue;
    if (!faces.has(d.name)) faces.set(d.name, { d, cells: [] });
    faces.get(d.name).cells.push([x, z]);
  }
}
const face = [...faces.values()].sort((a, b) => b.cells.length - a.cells.length)[0];
const along = (c) => (face.d.dz === 0 ? c[1] : c[0]);
const sorted = face.cells.sort((a, b) => along(a) - along(b));
const [ex, ez] = sorted[Math.floor(sorted.length / 2)];
const { dx, dz } = face.d;
const inward = opposite(face.d);
const lat = dz === 0 ? { x: 0, z: 1 } : { x: 1, z: 0 };
for (const y of [3, 4]) put(ex, y, ez, "iron_door", { facing: inward.name, half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
for (let k = 1; k <= 3; k++) {
  const sy = 3 - k;
  for (let l = -1; l <= 1; l++) {
    const sx = ex + k * dx + l * lat.x, sz = ez + k * dz + l * lat.z;
    if (inside(sx, sz)) continue;
    put(sx, sy, sz, "polished_granite_stairs", { facing: inward.name, half: "bottom", shape: "straight", waterlogged: "false" });
    for (let yy = 0; yy < sy; yy++) put(sx, yy, sz, "polished_granite");
  }
}
for (let k = 1; k <= 2; k++) for (let l = -1; l <= 1; l++) {
  const cx = ex + k * dx + l * lat.x, cz = ez + k * dz + l * lat.z;
  if (!inside(cx, cz)) put(cx, 5, cz, "smooth_stone");
}
for (const l of [-1, 1]) {
  const px = ex + 2 * dx + l * lat.x, pz = ez + 2 * dz + l * lat.z;
  for (let y = 2; y <= 4; y++) put(px, y, pz, "white_concrete");
}
put(ex + dx, 4, ez + dz, "lantern", { hanging: "true" });

// 5. warm light: lanterns standing on the floor just inside some glazed bays (the air gap stays)
for (const [key, { top }] of foot) {
  if (top < 10) continue;
  const [x, z] = key.split(",").map(Number);
  for (let f = DATUM; f < top; f += 4) {
    const pane = get(x, f + 2, z);
    if (!pane || !pane.block.endsWith("_pane") || (x * 3 + z) % 7 !== 0) continue;
    for (const d of DIRS) {
      if (inside(x + d.dx, z + d.dz)) continue;
      const xi = x - d.dx, zi = z - d.dz;
      if (!inside(xi, zi) || get(xi, f + 1, zi)) break;
      put(xi, f + 1, zi, "lantern", { hanging: "false" });
      break;
    }
  }
}

// 6. glass panes join their neighbours (glass, mullions, walls, columns), so each bay reads as a frame
const joins = (p) => p && !/lantern|door|stair|slab/.test(p.block);
for (const p of plan.values()) {
  if (!p.block.endsWith("_pane")) continue;
  const st = { waterlogged: "false" };
  for (const d of DIRS) st[d.name] = joins(get(p.x + d.dx, p.y, p.z + d.dz)) ? "true" : "false";
  p.state = st;
}

const g = new Voxels([W, H, D]);
for (const p of plan.values()) g.set(p.x, p.y, p.z, p.block, p.state);
const out = g.save(`${DIR}/way_292861413.nbt`);
console.log(JSON.stringify(out));
