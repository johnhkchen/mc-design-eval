import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538034017.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538034017.nbt";

const W = 10, H = 23, D = 25;
// Two-storey low-rise commercial block, c. 1970s-80s Taipei: white tiled concrete walls,
// stone base course, red terracotta storey band, glazed shopfront, parapet roof with AC units.
// Roof top sits 10 blocks above each cell's ground (11 blocks tall including the course).

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, p) => {
  if (!inB(x, y, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward face of an edge cell (first missing neighbour), or null for interior cells.
function outward(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}
const DIR = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// Choose one entrance on the south (street) face nearest the middle of the frontage.
let doorCell = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    if (outward(x, z) !== "south") continue;
    const d = Math.abs(x - Math.floor(W / 2));
    if (d < best) { best = d; doorCell = `${x},${z}`; }
  }
  if (!doorCell) {
    for (const [x, z] of cells.map(c => [c[0], c[1]])) {
      if (outward(x, z) === "north") { doorCell = `${x},${z}`; break; }
    }
  }
}

const paneProps = (face) =>
  (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, grRaw] of cells) {
  const gr = Math.min(grRaw, H - 1);
  const top = Math.min(gr + 10, H - 1);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const face = outward(x, z);
  const edge = face !== null;
  const idx = (face === "north" || face === "south") ? x : z;
  const isDoor = edge && `${x},${z}` === doorCell;

  for (let r = 0; gr + r <= top; r++) {
    const y = gr + r;

    if (!edge) {
      // Interior: floor slabs, roof deck, and a few rooftop AC units. Air otherwise.
      if (r === 5 || r === 9) put(x, y, z, "smooth_stone");
      else if (r === 10 && (x + z) % 5 === 0) put(x, y, z, "iron_block");
      continue;
    }

    if (r === 0) {
      put(x, y, z, "stone_bricks");                       // base course
    } else if (r >= 1 && r <= 3) {                        // storey 1: shopfront
      if (isDoor && r <= 2) {
        put(x, y, z, "oak_door", {
          facing: face, half: r === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
      } else if (idx % 3 === 0) {
        put(x, y, z, "white_concrete");                  // pilaster
      } else {
        put(x, y, z, "glass_pane", paneProps(face));
      }
    } else if (r === 4) {
      put(x, y, z, "red_terracotta");                    // storey line / lintel band
    } else if (r === 5) {
      put(x, y, z, "smooth_stone");                      // floor line
    } else if (r >= 6 && r <= 8) {                       // storey 2: window grid
      if (idx % 3 === 1) {
        put(x, y, z, "glass_pane", paneProps(face));
        if (r === 7 && idx % 6 === 1) {
          // warm light behind a few windows
          const [dx, dz] = DIR[OPP[face]];
          const ix = x + dx, iz = z + dz;
          if (has(ix, iz)) put(ix, y, iz, "glowstone");
        }
      } else {
        put(x, y, z, "white_concrete");
      }
    } else if (r === 9) {
      put(x, y, z, "smooth_stone");                      // cornice
    } else if (r === 10) {
      put(x, y, z, "light_gray_concrete");               // parapet
    }
  }
}

g.save(OUT);
