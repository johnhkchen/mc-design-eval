import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw340390110";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 9 x 19 x 9 footprint volume
const W = 9, H = 19, D = 9;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

// Face of a perimeter cell: which outward face and its along-face index u
const faceOf = (x, z) => {
  if (!has(x - 1, z)) return { face: "W", u: z };
  if (!has(x + 1, z)) return { face: "E", u: z };
  if (!has(x, z - 1)) return { face: "N", u: x };
  return { face: "S", u: x };
};
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Single street entrance: centre bay of the first available face, in preference order S, N, W, E
const entranceKey = (() => {
  const pref = ["S", "N", "W", "E"];
  for (const f of pref) {
    for (const [x, z] of cells) {
      if (!isPerim(x, z)) continue;
      const fo = faceOf(x, z);
      if (fo.face === f && fo.u === 4) return `${x},${z}`;
    }
  }
  return null;
})();

// Era: 1980s-90s Taipei concrete-frame low-rise commercial block.
const ROOF = 7;       // roof slab level (absolute y)
const FLOOR2 = 4;     // second-floor slab / storey line
const GROUND_TOP = 3; // top of ground storey (fascia row)
const CORNICE = 6;    // projecting cornice course under the roof

// Pass 1: foundations, floor slabs, roof slabs, interior storey slabs
for (const [x, z, gr] of cells) {
  const G = Math.min(Math.max(gr, 0), H - 6);
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  put(x, G, z, perim ? "polished_andesite" : "smooth_stone");
  if (G < FLOOR2) put(x, FLOOR2, z, "smooth_stone");

  const roofY = Math.max(ROOF, G + 2);
  put(x, roofY, z, "light_gray_concrete");
}

// Pass 2: facades, entrance, cornice, parapet
for (const [x, z, gr] of cells) {
  if (!isPerim(x, z)) continue;
  const G = Math.min(Math.max(gr, 0), H - 6);
  const roofY = Math.max(ROOF, G + 2);
  const top = roofY - 1;
  const { face, u } = faceOf(x, z);
  const isEntrance = `${x},${z}` === entranceKey;

  put(x, roofY + 1, z, "white_concrete"); // parapet

  for (let y = G + 1; y <= top; y++) {
    if (y <= GROUND_TOP) {
      // Ground storey shopfront
      if (y === GROUND_TOP) {
        put(x, y, z, "red_concrete"); // fascia
      } else if (u === 0 || u === 8) {
        put(x, y, z, "polished_andesite"); // corner piers
      } else if (isEntrance && y === G + 1 && G + 2 <= GROUND_TOP) {
        put(x, y, z, "oak_door", { facing: face === "S" ? "south" : face === "N" ? "north" : face === "W" ? "west" : "east", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (isEntrance && y === G + 2 && G + 2 <= GROUND_TOP) {
        put(x, y, z, "oak_door", { facing: face === "S" ? "south" : face === "N" ? "north" : face === "W" ? "west" : "east", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "glass_pane");
      }
    } else if (y === FLOOR2) {
      put(x, y, z, "white_concrete"); // storey line
    } else if (y === CORNICE && y <= top) {
      // Projecting cornice course: bottom slab reads as a shadow line under the roof
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    } else {
      // Upper storey window grid
      if (u === 0 || u === 4 || u === 8) {
        put(x, y, z, "white_concrete"); // mullions
      } else if (u === 2 && y === FLOOR2 + 1) {
        put(x, y, z, "glowstone"); // warm light behind glass
      } else {
        put(x, y, z, "glass_pane");
      }
    }
  }
}

// Rooftop water tank on the roof, centre of footprint
const tankBase = ROOF + 1;
for (let x = 3; x <= 5; x++) {
  for (let z = 3; z <= 5; z++) {
    if (!has(x, z)) continue;
    put(x, tankBase, z, "smooth_stone");
    put(x, tankBase + 1, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
