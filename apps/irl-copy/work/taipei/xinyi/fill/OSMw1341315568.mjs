import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341315568";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 4, H = 19, D = 7;
const ROOF = 7;                       // parapet top sits 7 blocks above lowest ground
const g = new Voxels([W, H, D]);

// Footprint lookup with ground heights, normalised so y 0 is the lowest ground.
const minG = Math.min(...cells.map(([, , gr]) => gr));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr - minG);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Glass pane connection state for a facade running along x (N/S faces) or z (E/W faces).
const paneAlongX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneAlongZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr0] of cells) {
  const gr = ground.get(`${x},${z}`);

  // Foundation: solid stone from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const N = !has(x, z - 1), S = !has(x, z + 1), Wf = !has(x - 1, z), E = !has(x + 1, z);
  const perimeter = N || S || Wf || E;

  if (!perimeter) {
    // Interior: floor slabs per storey, air elsewhere (no interiors).
    put(x, gr, z, "smooth_stone");
    if (3 > gr) put(x, 3, z, "light_gray_concrete");
    if (6 >= gr) put(x, 6, z, "gray_concrete");
    if (x === 1 && z === 2 && gr < ROOF) put(x, ROOF, z, "light_gray_concrete"); // roof plant
    continue;
  }

  // Choose the facade this cell belongs to (north/south take precedence at corners).
  let axis, facing, u, len, inX, inZ;
  if (N) { axis = "x"; facing = "north"; u = x; len = W; inX = 0; inZ = 1; }
  else if (S) { axis = "x"; facing = "south"; u = x; len = W; inX = 0; inZ = -1; }
  else if (Wf) { axis = "z"; facing = "west"; u = z; len = D; inX = 1; inZ = 0; }
  else { axis = "z"; facing = "east"; u = z; len = D; inX = -1; inZ = 0; }
  const street = N;
  const isCorner = (N || S) && (Wf || E);
  const pierU = u === 0 || u === len - 1;
  const paneProps = axis === "x" ? paneAlongX : paneAlongZ;

  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) {
      // Base course.
      put(x, y, z, "stone_bricks");
    } else if (y <= 2) {
      // Ground storey: shopfront glass with piers, door on the street face.
      const isDoorCol = street && x === 1;
      if (isDoorCol && y <= gr + 2 && gr <= 1) {
        // handled below as door
        put(x, y, z, "white_concrete");
      } else if (pierU || isCorner) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", paneProps);
        if (street && x === 2 && y === gr + 1) {
          put(x + inX, y, z + inZ, "glowstone");
        }
      }
    } else if (y === 3) {
      put(x, y, z, "light_gray_concrete");
    } else if (y <= 5) {
      // Upper storey: window grid, warm lights behind some panes.
      const windowU = axis === "x" ? (u === 1 || u === 2) : (u === 1 || u === 2 || u === 4 || u === 5);
      if (pierU || isCorner || !windowU) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", paneProps);
        const lit = (u + y) % 3 === 0;
        if (lit && y === 4) put(x + inX, y, z + inZ, "shroomlight");
      }
    } else if (y === 6) {
      put(x, y, z, "smooth_stone");               // cornice course
    } else {
      put(x, y, z, "white_concrete");             // parapet
    }
  }

  // Street-side entrance door at x = 1 when the ground allows it.
  if (street && x === 1 && gr <= 1) {
    put(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    // Dark lintel above door already sits on the storey band line.
    if (gr + 3 <= 3) put(x, 3, z, "black_concrete");
  }

  // Interior floors for perimeter cells as well (storey slabs).
  if (3 > gr && !(street && x === 1 && gr <= 1)) { /* band already set */ }
  if (6 >= gr) put(x, 6, z, "smooth_stone");
}

// Interior storey floors on the ground and roof level for the whole footprint.
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const gr = ground.get(`${x},${z}`);
  if (gr < 3) put(x, 3, z, has(x, z) && (x > 0 && x < W - 1 && z > 0 && z < D - 1) ? "light_gray_concrete" : g ? "light_gray_concrete" : "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
