import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block with a tiled street front, a red-tile
// canopy over the shopfront and a parapet roof with plant boxes.
const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831857645.cells.json";
const DST = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831857645.nbt";

const cells = JSON.parse(readFileSync(SRC, "utf8"));
const W = 13, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inF = (x, z) => ground.has(key(x, z));

const G = Math.min(...cells.map(c => c[2]));   // lowest ground under the footprint
const ROOF = G + 10;                           // top of second storey (cornice course)
const PARAPET = G + 11;                        // roof ~11 blocks above lowest ground

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function edgeFaces(x, z) {
  const out = [];
  for (const name of ["north", "south", "east", "west"]) {
    const [dx, dz] = DIRS[name];
    if (!inF(x + dx, z + dz)) out.push(name);
  }
  return out;
}

// Street-facing side: prefer the south (+z) edge, then the others.
const front = ["south", "north", "east", "west"].find(f =>
  cells.some(([x, z]) => edgeFaces(x, z).includes(f))
);
const coord = (face, x, z) => (face === "north" || face === "south" ? x : z);

// Entrance: middle of the front wall.
const frontCells = cells.filter(([x, z]) => {
  const f = edgeFaces(x, z);
  return f.length === 1 && f[0] === front;
});
const fc = frontCells.map(([x, z]) => coord(front, x, z));
const doorC = fc.length ? Math.floor((Math.min(...fc) + Math.max(...fc)) / 2) : -1;
const doorCell = frontCells.find(([x, z]) => coord(front, x, z) === doorC) ?? frontCells[0];
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : "";

// Window panes connect along the wall they sit in.
const pane = face =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- Foundation, floors, walls, cornice, parapet ----
for (const [x, z, gr] of cells) {
  const k = key(x, z);
  const faces = edgeFaces(x, z);
  const corner = faces.length >= 2;
  const face = faces[0];

  // Foundation up to this cell's ground, then the ground floor slab.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  for (let y = gr + 1; y <= ROOF - 1; y++) {
    // Storey floor slab between the two storeys (interior and edge alike).
    if (y === G + 5) { put(x, y, z, "smooth_stone"); continue; }
    if (!faces.length) continue; // interior air

    if (corner) { put(x, y, z, "light_gray_concrete"); continue; }

    const isFront = face === front;
    const c = coord(face, x, z);
    const ground1 = y <= G + 4;

    // Entrance door, lower and upper halves.
    if (isFront && k === doorKey && (y === G + 1 || y === G + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: face,
        half: y === G + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (ground1) {
      if (y === G + 4) {
        put(x, y, z, isFront ? "red_terracotta" : "white_terracotta");
      } else if (y >= G + 1 && y <= G + 3) {
        if (isFront) {
          if (c % 3 === 0) put(x, y, z, "stone_bricks");
          else put(x, y, z, "glass_pane", pane(face));
        } else {
          if (c % 3 === 1) put(x, y, z, "glass_pane", pane(face));
          else put(x, y, z, "white_terracotta");
        }
      } else {
        put(x, y, z, "white_terracotta");
      }
    } else {
      // Upper storey: window band with light-grey mullions.
      if (y >= G + 6 && y <= G + 8) {
        if (c % 3 === 1) put(x, y, z, "glass_pane", pane(face));
        else put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "white_terracotta"); // spandrel / lintel band
      }
    }
  }

  // Roof: cornice on the edge, roof deck inside, parapet on top.
  if (gr < ROOF) {
    if (faces.length) {
      put(x, ROOF, z, "stone_bricks");
      put(x, PARAPET, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    } else {
      put(x, ROOF, z, "smooth_stone");
    }
  }
}

// Canopy lantern over the entrance (warm light at dusk).
if (doorCell) {
  const [dx, dz, dg] = doorCell;
  if (G + 3 > dg) {
    put(dx, G + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Warm shroomlights just behind some upper-floor windows.
for (const [x, z, gr] of cells) {
  const faces = edgeFaces(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const c = coord(face, x, z);
  if (c % 6 !== 1) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (!inF(ix, iz)) continue;
  if (edgeFaces(ix, iz).length) continue;
  if (G + 7 <= ground.get(key(ix, iz))) continue;
  put(ix, G + 7, iz, "shroomlight");
}

// Rooftop plant: a grey box with an iron-clad unit on it, set inside the parapet.
for (const [x, z, gr] of cells) {
  if (edgeFaces(x, z).length) continue;
  if (x < 4 || x > 8 || z < 5 || z > 10) continue;
  if (gr >= PARAPET) continue;
  put(x, PARAPET, z, "light_gray_concrete");
  if (x >= 5 && x <= 7 && z >= 6 && z <= 9 && PARAPET + 1 < H) {
    put(x, PARAPET + 1, z, "iron_block");
  }
}

g.save(DST);
