import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 40 Henry Street, Brooklyn Heights Historic District, 1887.
// Six-storey red-brick block on a brownstone plinth, pale sandstone string
// courses at each storey line, a commercial shopfront on the street (z = 0)
// face with a recessed entrance, and a flat stone-capped roof with chimneys.
// Walls are a single-cell shell; the interior is air apart from floor slabs.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001601";
const W = 14, H = 24, D = 6;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const at = new Map();
for (const [x, z, g, r] of cells) {
  at.set(`${x},${z}`, { x, z, g: Math.round(g), r: Math.round(r) });
}

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- massing: one flat roof level (median of lidar roofs), even-aligned ----
const roofs = [...at.values()].map((c) => c.r).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
const T = Math.min(H - 5, Math.max(4, Math.round(med / 2) * 2));
const gmax = Math.max(...[...at.values()].map((c) => c.g));

let floors = Math.min(6, Math.floor(T / 2));
let G = T - 2 * floors;
if (G < gmax) {
  G = Math.ceil(gmax / 2) * 2;
  floors = Math.floor((T - G) / 2);
}
if (G > T - 2) { G = T - 2; floors = 1; }
const DOOR_X = 1;

const winProps = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const { x, z, g: gr } of at.values()) {
  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = z === 0;
  const back = z === D - 1;
  const left = x === 0;
  const right = x === W - 1;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const alongX = front || back;
  const idx = alongX ? x : z;
  const pier = corner || idx % 3 === 0;

  // interior neighbour direction (for lamps behind glass)
  let nx = x, nz = z;
  if (!corner) {
    if (front) nz = z + 1;
    else if (back) nz = z - 1;
    else if (left) nx = x + 1;
    else if (right) nx = x - 1;
  }

  // foundation / brownstone plinth, solid from y 0 up to G
  for (let y = 0; y < G; y++) {
    if (!perim) put(x, y, z, "stone_bricks");
    else if (y < gr) put(x, y, z, "stone_bricks");
    else put(x, y, z, "brown_terracotta");
  }

  // interior: floor slabs at each storey line and roof slab
  if (!perim) {
    for (let k = 0; k < floors; k++) put(x, G + 2 * k, z, "smooth_stone");
    put(x, T, z, "smooth_stone");
    continue;
  }

  // perimeter shell
  for (let y = G; y < T; y++) {
    const rel = y - G;
    const k = Math.floor(rel / 2);
    const within = rel % 2;

    if (corner) { put(x, y, z, "brown_terracotta"); continue; }

    if (within === 0) {
      if (k === 0) {
        // plinth course at grade
        put(x, y, z, "brown_terracotta");
      } else {
        // pale sandstone string course at each storey line
        put(x, y, z, "smooth_sandstone");
      }
      continue;
    }

    // upper row of each storey: glazing or brick piers
    if (front && k === 0) {
      if (x === DOOR_X + 1 || x === DOOR_X - 1) {
        // entrance surround in pale stone (x = 0 is the corner, handled above)
        put(x, y, z, "smooth_sandstone");
      } else if (pier) {
        put(x, y, z, "dark_oak_planks");
      } else {
        put(x, y, z, "glass_pane", winProps(true));
      }
    } else if (pier) {
      put(x, y, z, "brick");
    } else {
      put(x, y, z, "glass_pane", winProps(alongX));
      if (k % 2 === 0 && (idx + k) % 3 === 1) {
        put(nx, y, nz, "glowstone");
      }
    }
  }

  // shopfront bulkhead spandrel above the entrance row on the street face
  if (front && !corner && x !== DOOR_X && pier) {
    put(x, G, z, "dark_oak_planks");
  }

  // cornice cap on the parapet
  put(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// ---- street entrance on the z = 0 face, recessed one cell ----
{
  const dx = DOOR_X;
  put(dx, G, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, G + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx, G + 1, 1, "glowstone");
  // lintel over the door in pale stone
  put(dx, G + 2, 0, "smooth_sandstone");
}

// ---- chimneys on the roof, rear half ----
for (const [cx, cz] of [[4, 2], [9, 3]]) {
  const cell = at.get(`${cx},${cz}`);
  if (!cell) continue;
  for (let y = T + 1; y <= T + 2 && y < H; y++) put(cx, y, cz, "brick");
  if (T + 3 < H) put(cx, T + 3, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
