import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888729";

const W = 7, H = 23, D = 16;

// Footprint: [x, z, ground] per cell (tolerate object form too)
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cells.set(`${x},${z}`, gr | 0);
}

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward directions: neighbour offset that is missing means that face is exposed
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const has = (x, z) => cells.has(`${x},${z}`);
function exposedDirs(x, z) {
  return DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
}

// Choose the entrance: exposed south-facing (z+1 missing) cell nearest the middle
let doorKey = null;
{
  let best = Infinity;
  for (const [key, gr] of cells) {
    const [x, z] = key.split(",").map(Number);
    const ex = exposedDirs(x, z);
    if (ex.length !== 1 || ex[0][1] !== 1) continue;
    const score = Math.abs(x - (W - 1) / 2) - z * 0.001;
    if (score < best) { best = score; doorKey = key; }
  }
}

for (const [key, gr] of cells) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposedDirs(x, z);
  const nExp = ex.length;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (nExp === 0) {
    // Interior: floor slabs only, air elsewhere (no interiors)
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "gray_concrete");
    continue;
  }

  // Exterior shell: plinth, storey lines, cornice, parapet
  put(x, gr, z, "stone_bricks");            // base course
  put(x, gr + 4, z, "red_terracotta");       // shopfront awning band
  put(x, gr + 5, z, "light_gray_concrete");  // storey 2 spandrel / floor line
  put(x, gr + 9, z, "light_gray_concrete");  // cornice
  put(x, gr + 10, z, "light_gray_concrete"); // parapet

  const isCorner = nExp >= 2;
  const isDoorCell = key === doorKey;
  const outward = ex[0];
  const zFace = outward[1] !== 0;           // exposed to north/south
  const idx = zFace ? x : z;                // position along the face
  const paneProps = zFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Storey 1 (ground) : offsets 1..3 ; storey 2 : offsets 6..8
  const storeys = [
    { base: 1, ground: true },
    { base: 6, ground: false },
  ];
  for (const st of storeys) {
    for (let o = st.base; o <= st.base + 2; o++) {
      const y = gr + o;
      const pierId = st.ground ? "stone_bricks" : "light_gray_concrete";

      if (isCorner) {
        put(x, y, z, pierId);
        continue;
      }
      if (st.ground && isDoorCell && o <= st.base + 1) {
        // Door: lower at base, upper above; lantern over it
        if (o === st.base) {
          put(x, y, z, "oak_door", {
            facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else {
          put(x, y, z, "oak_door", {
            facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
          });
        }
        continue;
      }
      if (st.ground && isDoorCell && o === st.base + 2) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      if (idx % 3 === 0) {
        put(x, y, z, pierId);
      } else {
        put(x, y, z, "glass_pane", paneProps);
      }
    }
  }

  // Warm light: glowstone just inside some first-storey windows
  if (!isCorner && !(doorKey === key) && idx % 6 === 1) {
    const inward = [-outward[0], -outward[1]];
    const ix = x + inward[0], iz = z + inward[1];
    if (has(ix, iz) && exposedDirs(ix, iz).length === 0) {
      put(ix, gr + 2, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
