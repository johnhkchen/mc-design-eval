import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 逸林華廈: 1980s four-storey residential block with a ground-floor street shop row,
// white tiled facade, light-gray floor bands, aluminium-style sills and sliding windows,
// steel water tank and mast on a flat roof. Roof surface at y=21 (parapet row y=20).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1147304677";
const W = 12, H = 33, D = 16;
const TOP = 20;      // parapet row; roof surface at y = 21
const DOOR_X = 6;    // entrance column, nearest to centre on the street (north) face

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const GR = new Map();
for (const [x, z, gr] of cells) GR.set(`${x},${z}`, gr);
const has = (x, z) => GR.has(`${x},${z}`);
const ground = (x, z) => GR.get(`${x},${z}`);
const exposure = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z),
});
const isWall = (x, z) => { const e = exposure(x, z); return e.N || e.S || e.W || e.E; };

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => (props ? g.set(x, y, z, id, props) : g.set(x, y, z, id));

// Pane / bar connection states so runs of windows join up instead of standing as posts.
const connect = (face) => face === "NS"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const litCells = [];

for (const [key, Gr] of GR) {
  const [x, z] = key.split(",").map(Number);
  const e = exposure(x, z);
  const wall = e.N || e.S || e.W || e.E;
  const corner = (e.N || e.S) && (e.W || e.E);
  const face = e.N || e.S ? "NS" : "EW";
  const idx = face === "NS" ? x : z;

  // Foundation: solid from y=0 up to this cell's ground.
  for (let y = 0; y < Gr; y++) put(x, y, z, "stone_bricks");

  if (!wall) {
    // Interior: floor slabs per storey and the roof deck. Air between, behind the glass.
    for (const y of [Gr, 5, 10, 15, TOP]) {
      if (y < Gr || y > TOP) continue;
      put(x, y, z, y === TOP ? "light_gray_concrete" : "smooth_stone");
    }
    continue;
  }

  // Perimeter wall, from ground up to the parapet.
  for (let y = Gr; y <= TOP; y++) {
    const r = y % 5;
    let id = null;
    let props;
    if (y === Gr) id = "stone_bricks";                 // plinth course
    else if (y === TOP) id = "white_concrete";         // parapet
    else if (y === TOP - 1) id = "light_gray_concrete"; // cornice
    else if (r === 0) id = "light_gray_concrete";      // storey floor band
    else if (r === 4) id = "white_concrete";           // spandrel / lintel
    else {
      const ground = y < 5;
      const pier = corner || idx % 3 === 0;
      const front = ground && e.N && face === "NS";
      if (pier) id = "white_concrete";
      else if (front) id = "glass";                    // street shopfront glazing
      else if (r === 1) { id = "iron_bars"; props = connect(face); }   // sill grilles
      else { id = "light_blue_stained_glass_pane"; props = connect(face); }

      // Some lit rooms: a warm block just inside the middle glass row.
      if (!pier && r === 2 && (x * 7 + y * 13 + z * 31) % 7 === 0) {
        const dx = e.W ? 1 : e.E ? -1 : 0;
        const dz = e.N ? 1 : e.S ? -1 : 0;
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && !isWall(ix, iz)) litCells.push([ix, y, iz]);
      }
    }
    if (id) put(x, y, z, id, props);
  }
}

// Glowing rooms behind the glass.
for (const [x, y, z] of litCells) put(x, y, z, "glowstone");

// Street entrance: nearest north-face cell to the door column.
const nFace = [...GR.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !has(x, z - 1))
  .sort((a, b) => Math.abs(a[0] - DOOR_X) - Math.abs(b[0] - DOOR_X) || a[0] - b[0]);
if (nFace.length) {
  const [dx, dz] = nFace[0];
  const dg = ground(dx, dz);
  put(dx, dg + 1, dz, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 2, dz, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx, dg + 3, dz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof: steel water tank (2x2, 3 high, capped) and a mast on an adjacent cell.
const roofFree = (x, z) => has(x, z) && !isWall(x, z);
let best = null;
for (const key of GR.keys()) {
  const [x, z] = key.split(",").map(Number);
  if ([[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => roofFree(a, b))) {
    const d = Math.abs(x - (W / 2 - 1)) + Math.abs(z - (D / 2 - 1));
    if (!best || d < best.d) best = { x, z, d };
  }
}
if (best) {
  const { x: tx, z: tz } = best;
  for (let y = TOP + 1; y <= TOP + 3; y++)
    for (const [a, b] of [[tx, tz], [tx + 1, tz], [tx, tz + 1], [tx + 1, tz + 1]])
      put(a, y, b, "iron_block");
  for (const [a, b] of [[tx, tz], [tx + 1, tz], [tx, tz + 1], [tx + 1, tz + 1]])
    put(a, TOP + 4, b, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Mast on a free roof cell well away from the tank.
  let mast = null;
  for (const key of GR.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (!roofFree(x, z)) continue;
    if (Math.abs(x - tx) < 2 && Math.abs(z - tz) < 2) continue;
    const d = Math.abs(x - 1) + Math.abs(z - 1);
    if (!mast || d < mast.d) mast = { x, z, d };
  }
  if (mast) {
    for (let y = TOP + 1; y <= TOP + 4; y++)
      put(mast.x, y, mast.z, "chain", { axis: "y", waterlogged: "false" });
    put(mast.x, TOP + 5, mast.z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
