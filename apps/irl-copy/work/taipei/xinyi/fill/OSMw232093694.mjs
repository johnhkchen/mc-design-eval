import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Barista Coffee: a two-storey Taipei shophouse-style café block (~11 blocks tall),
// cream wall tile with red-brown tile piers, a green fascia band, glazed shopfront,
// a stone plinth and cornice, a flat roof with parapet and grouped rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw232093694";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = raw.map((c) => (Array.isArray(c) ? c : [c.x, c.z, c.ground])).map(
  ([x, z, gr]) => [x, z, Math.floor(gr)]
);

const W = 23, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const minG = Math.min(...list.map((c) => c[2]));
const PARAPET = minG + 12;
if (PARAPET + 1 >= H) throw new Error(`Building too tall for volume: parapet at ${PARAPET}`);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr] of list) fp.set(key(x, z), gr);

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const missing = (x, z) => NB.filter(([dx, dz]) => !fp.has(key(x + dx, z + dz)));
const isEdge = (x, z) => missing(x, z).length > 0;

// Window bays: 3-cell rhythm along each exposed face; the pier is the first cell of each bay.
const isWin = (x, z) => {
  const m = missing(x, z);
  if (!m.length) return false;
  return m.some(([dx, dz]) => {
    const t = dz !== 0 ? x : z;
    return t % 3 !== 0;
  });
};

// Entrance: on the north (z-min) face, nearest the middle of the footprint.
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of list) {
    if (fp.has(key(x, z - 1))) continue;
    const d = Math.abs(x - (W - 1) / 2);
    if (d < best) { best = d; doorKey = key(x, z); }
  }
}
const doorX = doorKey ? Number(doorKey.split(",")[0]) : -99;
const doorZ = doorKey ? Number(doorKey.split(",")[1]) : -99;

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

function edgeBlock(x, z, gr, y, win) {
  if (y === gr) return ["stone_bricks"];                       // plinth course
  if (y >= minG + 1 && y <= minG + 3) {                        // shopfront storey
    return win ? ["glass"] : ["polished_andesite"];
  }
  if (y === minG + 4) {                                        // fascia band
    return (!win && (x + z) % 6 === 0) ? ["sea_lantern"] : ["green_terracotta"];
  }
  if (y === minG + 5) return ["white_terracotta"];             // sill course
  if (y >= minG + 6 && y <= minG + 8) {                        // upper storey
    return win ? ["glass"] : ["red_terracotta"];
  }
  if (y === minG + 9) return ["white_terracotta"];             // lintel course
  if (y === minG + 10) return ["smooth_stone"];                // cornice
  return null;
}

// Rooftop plant: two grouped enclosures of interior cells, not scattered single units.
const plantCells = new Set();
const addPlant = (x0, x1, z0, z1) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) plantCells.add(key(x, z));
};
addPlant(4, 7, 5, 7);
addPlant(14, 17, 11, 13);

for (const [x, z, gr] of list) {
  const edge = isEdge(x, z);
  const win = isWin(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (edge) {
    for (let y = gr; y <= minG + 10; y++) {
      const b = edgeBlock(x, z, gr, y, win);
      if (!b) continue;
      put(x, y, z, b[0]);
    }
    // Entrance: dark oak door, two blocks, set into the shopfront.
    if (key(x, z) === doorKey) {
      put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    // Parapet course.
    put(x, PARAPET, z, "smooth_stone");
  } else {
    // Interior: ground floor slab, storey floor slab, no walls.
    put(x, gr, z, "smooth_stone");
    if (minG + 5 > gr) put(x, minG + 5, z, "smooth_stone");

    // Warm lamps standing on the floors, visible through the glazing.
    if (x % 4 === 2 && z % 4 === 2) put(x, gr + 1, z, "lantern", { hanging: "false" });
    if (minG + 5 > gr && x % 4 === 0 && z % 4 === 2) put(x, minG + 6, z, "lantern", { hanging: "false" });

    // Rooftop plant enclosures: walled box with a lid, lit by a lantern inside.
    if (plantCells.has(key(x, z))) {
      const onRim = x === 4 || x === 7 || z === 5 || z === 7 ||
                    x === 14 || x === 17 || z === 11 || z === 13;
      if (onRim) {
        put(x, PARAPET, z, "light_gray_concrete");
        put(x, PARAPET + 1, z, "light_gray_concrete");
      } else {
        put(x, PARAPET, z, "iron_block");
      }
      put(x, PARAPET + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }

  // Flat roof slab over every footprint cell.
  put(x, minG + 11, z, "light_gray_concrete");
}

// Lanterns flanking the entrance, so the door reads at dusk.
if (doorKey) {
  for (const dx of [-1, 1]) {
    const lx = doorX + dx;
    if (fp.has(key(lx, doorZ))) {
      put(lx, minG + 3, doorZ, "lantern", { hanging: "true" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
