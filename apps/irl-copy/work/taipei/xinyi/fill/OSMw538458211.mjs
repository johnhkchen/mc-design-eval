import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Taipei low-rise shophouse, ~1980s: two storeys over a shopfront, white
// tiled-concrete upper floors with aluminium-framed glass, flat roof with a
// parapet, a stair housing and lightning rod on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458211";
const W = 10, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isBoundary = (x, z) =>
  has(x, z) && (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));

const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Storey structure. g0 = cell ground; base course g0, shopfront g0..g0+4,
// upper storey g0+5..g0+9, parapet cap g0+10 (roof top = 11 blocks).
// Pick entrance: first north-face non-corner boundary cell with smallest x.
let door = null;
for (const [x, z] of cells.map(([a, b]) => [a, b]).sort((a, b) => a[0] - b[0])) {
  if (!isBoundary(x, z)) continue;
  const N = !has(x, z - 1), Wn = !has(x - 1, z), E = !has(x + 1, z);
  if (N && !Wn && !E) { door = [x, z]; break; }
}

const lightCells = [];

for (const [x, z, gr] of cells) {
  const g0 = gr;
  const N = !has(x, z - 1), S = !has(x, z + 1), Wn = !has(x - 1, z), E = !has(x + 1, z);
  const boundary = N || S || Wn || E;
  const alongX = N || S;                       // wall runs east-west
  const corner = (N || S) && (Wn || E);
  const u = alongX ? x : z;                    // position along the facade
  const winCol = !corner && u % 2 === 1;       // window column vs pier

  // Interior floor slabs at each storey line and roof slab at top.
  if (!boundary) {
    put(x, g0, z, "light_gray_concrete");
    put(x, g0 + 5, z, "light_gray_concrete");
    put(x, g0 + 10, z, "light_gray_concrete");
    continue;
  }

  // Boundary walls, full height.
  for (let y = g0; y <= g0 + 10; y++) {
    const dy = y - g0;
    let id;
    let props;

    if (dy === 0) {
      id = "stone_bricks";                                  // base course
    } else if (dy <= 3) {                                   // shopfront
      if (winCol) { id = "glass_pane"; props = alongX ? paneX : paneZ; }
      else id = "dark_oak_log";                             // timber pier
    } else if (dy === 4) {
      id = "white_concrete";                                // lintel
    } else if (dy === 5) {
      id = "light_gray_concrete";                           // storey line
    } else if (dy <= 8) {                                   // upper storey
      if (winCol) { id = "glass_pane"; props = alongX ? paneX : paneZ; }
      else id = "white_concrete";
    } else if (dy === 9) {
      id = "light_gray_concrete";                           // upper lintel
    } else {
      id = "smooth_stone";                                  // parapet cap
    }

    // Entrance: two-high dark oak door at ground floor.
    if (door && door[0] === x && door[1] === z && (dy === 1 || dy === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: dy === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    put(x, y, z, id, props);
  }

  // Warm lights behind some upper windows, in the interior cell just inside.
  if (winCol && u % 4 === 1) {
    let ix = x, iz = z;
    if (N) iz = z + 1; else if (S) iz = z - 1; else if (Wn) ix = x + 1; else if (E) ix = x - 1;
    if (has(ix, iz) && !isBoundary(ix, iz)) lightCells.push([ix, g0 + 7, iz]);
  }
}

for (const [x, y, z] of lightCells) put(x, y, z, "glowstone");

// 3. Roof equipment: stair housing on the interior cell nearest the centre,
// with a lightning rod on a corner.
let best = null;
for (const [x, z, gr] of cells) {
  const N = !has(x, z - 1), S = !has(x, z + 1), Wn = !has(x - 1, z), E = !has(x + 1, z);
  if (N || S || Wn || E) continue;
  const d = Math.abs(x - 4.5) + Math.abs(z - 7.5);
  if (!best || d < best.d) best = { x, z, gr, d };
}
if (best) {
  for (let y = best.gr + 11; y <= best.gr + 12; y++) put(best.x, y, best.z, "white_concrete");
  put(best.x, best.gr + 13, best.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// Lightning rod on the roof, on a boundary corner cell.
for (const [x, z, gr] of cells) {
  const N = !has(x, z - 1), Wn = !has(x - 1, z);
  if (N && Wn) {
    put(x, gr + 11, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    break;
  }
}

g.save(`${DIR}/${ID}.nbt`);
