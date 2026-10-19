// 146 West 46 Street, 1920: a five-storey red-brick Renaissance-style mixed-use block on a 5 x 24 lot. Granite base, limestone
// storey lines and cornice, a shopfront with the entrance on the street (z 0) end, a two-storey rear wing (z 19..23) stepping
// down from the body (z 0..18, lidar 14-15), a 17-high party-wall parapet along the west edge (lidar 17), a tar roof inside an
// attic ring with a stair bulkhead. Windows are glass panes on a one-block shell with air behind them; a few hold warm lights.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1022650.cells.json`, "utf8"));

// Massing from the lidar, smoothed into flat tiers: lidar of 11+ is the body (roof 15, or 17 along the west party wall where
// lidar reads 17); lower is the rear wing (roof 7, lidar 6-9).
const roofAt = new Map();
for (const [x, z, , lidar] of cells) {
  const wing = lidar < 11;
  roofAt.set(`${x},${z}`, { R: wing ? 7 : x === 0 && lidar >= 16 ? 17 : 15, wing });
}
const cell = (x, z) => roofAt.get(`${x},${z}`);

// A wall cell faces open where the neighbour is outside the footprint or stands lower than this block.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
function faces(x, z, y) {
  return Object.entries(DIRS)
    .filter(([, [dx, dz]]) => { const n = cell(x + dx, z + dz); return !n || n.R <= y; })
    .map(([d]) => d);
}
const plane = (d, x, z) => (d === "N" || d === "S" ? z : x);     // the wall's fixed coordinate
const along = (d, x, z) => (d === "N" || d === "S" ? x : z);     // position along the wall

// The extent of each exposed wall run at each height, so bays are counted from the run's own end.
const run = new Map();
for (const [x, z] of roofAt.keys().map((k) => k.split(",").map(Number))) {
  const { R } = cell(x, z);
  for (let y = 0; y < R; y++) for (const d of faces(x, z, y)) {
    const k = `${d}|${plane(d, x, z)}|${y}`, a = along(d, x, z), r = run.get(k);
    run.set(k, r ? { lo: Math.min(r.lo, a), hi: Math.max(r.hi, a) } : { lo: a, hi: a });
  }
}

const BODY_WINDOW_ROWS = [1, 2, 4, 5, 7, 8, 10, 11, 13];   // four storeys of two-block lights, then the one-block attic
const WING_WINDOW_ROWS = [1, 2, 4, 5];
const glass = (d) => (d === "N" || d === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

const v = new Voxels([5, 17, 24]);
for (const [x, z] of roofAt.keys().map((k) => k.split(",").map(Number))) {
  const { R, wing } = cell(x, z);
  const deck = wing ? 6 : 12;                               // the tar roof: top floor of the body, the wing's top
  const rows = wing ? WING_WINDOW_ROWS : BODY_WINDOW_ROWS;
  for (let y = 0; y < R; y++) {
    const f = faces(x, z, y);
    if (!f.length) {                                         // interior: floor slabs at each storey line, air between
      if (y % 3 === 0 && y <= deck) v.set(x, y, z, y === deck ? "black_concrete" : "smooth_stone");
      continue;
    }
    if (y === 0) { v.set(x, y, z, "polished_granite"); continue; }   // base course
    if (f.length > 1 || y % 3 === 0 || y === R - 1) { v.set(x, y, z, "calcite"); continue; }  // quoins, storey lines, cornice
    const d = f[0], r = run.get(`${d}|${plane(d, x, z)}|${y}`);
    const off = along(d, x, z) - r.lo, len = r.hi - r.lo + 1;
    const bay = len <= 5 ? off > 0 && off < len - 1 : off % 3 === 1;   // short faces: every inner cell; long: one window, two piers
    if (rows.includes(y) && bay) v.set(x, y, z, "glass_pane", glass(d));
    else v.set(x, y, z, "bricks");
  }
}

// Shopfront and entrance on the street (z 0) front: door in bay 1, dark bulkhead under the shop glass in bay 2.
v.set(1, 1, 0, "dark_oak_door", door("lower"));
v.set(1, 2, 0, "dark_oak_door", door("upper"));
v.set(2, 1, 0, "polished_blackstone");

// Warm lights in the air behind the glass: a hanging lantern in the shop, glowstone and shroomlight upstairs.
v.set(2, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
v.set(1, 4, 1, "glowstone");
v.set(2, 7, 1, "shroomlight");
v.set(1, 10, 1, "glowstone");

// Stair bulkhead on the roof, standing on the tar deck.
for (const x of [1, 2]) for (const z of [9, 10]) {
  v.set(x, 13, z, "bricks");
  v.set(x, 14, z, "bricks");
  v.set(x, 15, z, "calcite");
}

const out = v.save(`${dir}/NYC1022650.nbt`);
console.log(JSON.stringify(out));
