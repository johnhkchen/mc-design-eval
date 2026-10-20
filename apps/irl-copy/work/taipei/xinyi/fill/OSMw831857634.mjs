import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857634";
const W = 19, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground (rounded)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
const outward = (x, z) => DIRS.find(([dx, dz]) => !has(x + dx, z + dz)) ?? null;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance: street-facing (north preferred) edge cell nearest the middle of the frontage.
let ent = null;
let best = Infinity;
for (const [x, z] of [...ground.keys()].map(k => k.split(",").map(Number))) {
  if (!isEdge(x, z)) continue;
  const out = outward(x, z);
  if (!out) continue;
  const score = (out[1] === -1 ? 0 : 100) + Math.abs(x - 9) + (out[0] !== 0 ? 50 : 0);
  if (score < best) { best = score; ent = { x, z, dir: out[2] }; }
}

const isWindowCell = (x, s) => s % 3 !== 0;

for (const [x, z, gr] of cells) {
  const G = Math.round(gr);
  const s = x + z;
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= G; y++) put(x, y, z, "stone_bricks");

  // Ground-floor slab (interior) / base course (edge).
  if (edge) {
    put(x, G + 1, z, "polished_granite");
  } else {
    put(x, G + 1, z, "smooth_quartz");
  }

  if (edge) {
    const isEnt = ent && ent.x === x && ent.z === z;
    if (isEnt) {
      const facing = ent.dir;
      put(x, G + 2, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, G + 3, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, G + 4, z, "glass_pane");
    } else {
      // Shopfront: glass with grey concrete piers every fourth column.
      const pier = s % 4 === 0;
      for (let y = G + 2; y <= G + 4; y++) {
        put(x, y, z, pier ? "gray_concrete" : "glass_pane");
      }
    }
    // Lintel over the shopfront.
    put(x, G + 5, z, "light_gray_concrete");
  }

  // Floor slab between storeys (all cells).
  put(x, G + 6, z, "smooth_quartz");

  // Second storey: spandrels above and below, window band between piers.
  if (edge) {
    put(x, G + 7, z, "light_gray_concrete");
    put(x, G + 10, z, "light_gray_concrete");
    const window = isWindowCell(x, s);
    for (let y = G + 8; y <= G + 9; y++) {
      put(x, y, z, window ? "glass_pane" : "white_concrete");
    }
  }

  // Roof deck.
  put(x, G + 11, z, "gray_concrete");

  // Parapet cap on the perimeter.
  if (edge) put(x, G + 12, z, "smooth_quartz");

  // Warm lights behind some glass: glowstone in the interior cell next to a window.
  if (edge && isWindowCell(x, s) && ((x * 31 + z * 17) % 5 === 0)) {
    const inDir = DIRS.find(([dx, dz]) => has(x + dx, z + dz) && !isEdge(x + dx, z + dz));
    if (inDir) {
      const ix = x + inDir[0], iz = z + inDir[1];
      const iG = ground.get(`${ix},${iz}`);
      put(ix, iG + 8, iz, "glowstone");
      put(ix, iG + 3, iz, "glowstone");
    }
  }

  // Roof plant room on the interior core.
  if (!edge && x >= 7 && x <= 11 && z >= 6 && z <= 10 && G + 14 < H) {
    put(x, G + 12, z, "light_gray_concrete");
    put(x, G + 13, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
