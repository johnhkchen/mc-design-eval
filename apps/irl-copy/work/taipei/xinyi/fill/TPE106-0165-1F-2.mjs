import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE106-0165-1F-2";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 19, D = 15;
const ROOF = 7;                       // flat roof, about 7 blocks above lowest ground
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const exposed = (x, z) => ({ w: !has(x - 1, z), e: !has(x + 1, z), n: !has(x, z - 1), s: !has(x, z + 1) });
const isEdge = (e) => e.w || e.e || e.n || e.s;
const isCorner = (e) => (e.w || e.e) && (e.n || e.s);

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Entrance: south-exposed, non-corner cell nearest the average x of south-facing edge cells.
const southCells = cells
  .filter(([x, z]) => { const e = exposed(x, z); return e.s && !isCorner(e); })
  .map(([x]) => x);
const avgX = southCells.length ? southCells.reduce((a, b) => a + b, 0) / southCells.length : W / 2;
let doorCell = null;
for (const x of southCells) {
  if (!doorCell || Math.abs(x - avgX) < Math.abs(doorCell.x - avgX)) {
    const z = cells.find(([cx, cz]) => cx === x && exposed(cx, cz).s)[1];
    doorCell = { x, z };
  }
}
const isDoor = (x, z) => doorCell && doorCell.x === x && doorCell.z === z;

const paneProps = (e) => {
  const p = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (e.w || e.e) { p.north = "true"; p.south = "true"; } else { p.east = "true"; p.west = "true"; }
  return p;
};

// Along-facade bay pattern: mullion every 3rd block, glazing elsewhere.
const along = (x, z, e) => ((e.w || e.e) ? z : x);
const isWindow = (x, z, e) => along(x, z, e) % 3 !== 0;

// Spandrel/wall bays alternate two concretes so the facade has depth in tone.
const wallBlock = (x, z, e) => (Math.floor(along(x, z, e) / 3) % 2 === 0 ? "white_concrete" : "light_gray_concrete");

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0, ROOF - 1));
  // One flat roof for the whole block; only cells whose ground rises past it get more room.
  const T = Math.min(Math.max(ROOF, gr + 3), H - 3);
  const e = exposed(x, z);
  const edge = isEdge(e);
  const corner = isCorner(e);

  // Foundation fill up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: floor slabs only, air between (no interiors).
    put(x, gr, z, "smooth_stone");
    if (gr + 4 < T - 1) put(x, gr + 4, z, "smooth_quartz");
    put(x, T - 1, z, "smooth_quartz");
    // Roof plant box on inner cells.
    if (x >= 5 && x <= 11 && z >= 4 && z <= 10) {
      put(x, T, z, "light_gray_concrete");
      if (x >= 6 && x <= 10 && z >= 5 && z <= 9) put(x, T + 1, z, "iron_block");
    }
    continue;
  }

  // Facade column, clipped to the flat roof.
  put(x, gr, z, "stone_bricks");                                   // base course
  const groundTop = Math.min(gr + 3, T - 2);
  for (let y = gr + 1; y <= groundTop; y++) {                      // ground storey / shopfront
    if (corner) { put(x, y, z, "white_concrete"); continue; }
    if (isWindow(x, z, e)) put(x, y, z, "glass");
    else put(x, y, z, "smooth_quartz");
  }
  if (gr + 4 <= T - 2) put(x, gr + 4, z, "smooth_quartz");        // storey line / lintel
  for (let y = gr + 5; y <= T - 2; y++) {                          // upper storey
    if (corner) { put(x, y, z, "white_concrete"); continue; }
    if (isWindow(x, z, e)) put(x, y, z, "light_blue_stained_glass_pane", paneProps(e));
    else put(x, y, z, wallBlock(x, z, e));
  }
  put(x, T - 1, z, "smooth_quartz");                               // cornice
  put(x, T, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); // parapet cap

  // Entrance door and hanging lantern on the south face.
  if (isDoor(x, z) && e.s) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Warm light behind some upper-storey windows, in the air gap just inside.
  if (!corner && (x + z) % 2 === 0 && gr + 6 <= T - 2 && isWindow(x, z, e)) {
    let ix = x, iz = z;
    if (e.w) ix = x + 1; else if (e.e) ix = x - 1; else if (e.n) iz = z + 1; else if (e.s) iz = z - 1;
    if (has(ix, iz) && !isEdge(exposed(ix, iz))) put(ix, gr + 6, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
