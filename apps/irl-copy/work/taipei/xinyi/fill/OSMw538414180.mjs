import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414180.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414180.nbt";

// Mid-century (c. 1960s-70s) two-storey commercial block: concrete frame, quartz-clad walls,
// polished andesite base and storey lines, glazed shopfront, parapet with cornice, roof plant.
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 20, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

const L = Math.min(...cells.map((c) => c[2]));       // lowest ground under the footprint
const ROOF = L + 11;                                  // parapet top, ~11 blocks above lowest ground
if (ROOF > H - 1) throw new Error("roof exceeds volume height");

const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const midX = Math.floor((minX + maxX) / 2);           // centred street-front entrance

const has = (x, z) => ground.has(key(x, z));
const exposed = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z),
});
const isEdgeCell = (x, z) => {
  const e = exposed(x, z);
  return e.N || e.S || e.E || e.W;
};

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  g.set(x, y, z, id, props ?? {});
};

const glass = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const DIRS = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] }; // inward offsets

for (const [x, z, gr] of cells) {
  const ex = exposed(x, z);
  const edge = isEdgeCell(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-floor level (base course on the edge, slab inside).
  put(x, gr, z, edge ? "polished_andesite" : "smooth_stone");

  // Storey line / second-floor slab at L+5.
  put(x, L + 5, z, edge ? "polished_andesite" : "smooth_stone");

  // Roof slab / cornice at L+10.
  if (edge) {
    put(x, L + 10, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  } else {
    put(x, L + 10, z, "smooth_stone");
  }

  if (!edge) {
    // Interior roof: a few plant boxes on the roof deck.
    if (x > 1 && z > 1 && (x * 5 + z * 3) % 11 === 0) {
      put(x, L + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // Parapet on the edge.
  put(x, L + 11, z, "quartz_block");

  // Facade face for this wall cell.
  const face = ex.N ? "N" : ex.S ? "S" : ex.E ? "E" : "W";
  const s = face === "N" || face === "S" ? x : z;   // position along the wall
  const isFront = face === "N" && x === midX;

  // Body of the wall, default quartz.
  for (let y = gr + 1; y <= L + 9; y++) put(x, y, z, "quartz_block");

  // Ground storey: shopfront glazing with white concrete piers, entrance on the front.
  for (let y = gr + 1; y <= L + 4; y++) {
    if (isFront && y <= gr + 2) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "north", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (s % 4 === 0) put(x, y, z, "white_concrete");
    else put(x, y, z, "glass_pane", glass(face));
  }

  // Upper storey: window band with piers every third bay.
  for (let y = L + 6; y <= L + 9; y++) {
    if (s % 3 === 0) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "glass_pane", glass(face));
      // Warm light behind some upper windows (glowstone in the air gap).
      if (y === L + 7 && (x * 7 + z * 3) % 5 === 0) {
        const [dx, dz] = DIRS[face];
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && !isEdgeCell(ix, iz)) put(ix, y, iz, "glowstone");
      }
    }
  }
}

g.save(OUT);
