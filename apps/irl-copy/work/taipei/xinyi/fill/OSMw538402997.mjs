import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s-90s commercial block: two storeys over a tiled base,
// white terracotta cladding, tinted glazing in aluminium-look bands,
// a red-tile shopfront at street level, flat roof with parapet and plant room.

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538402997";
const cells = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 24;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 14, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Outward missing neighbours of a footprint cell
function missing(x, z) {
  const m = [];
  if (!has(x, z - 1)) m.push("N");
  if (!has(x, z + 1)) m.push("S");
  if (!has(x + 1, z)) m.push("E");
  if (!has(x - 1, z)) m.push("W");
  return m;
}

// Face class: single missing side => that face; two or more => corner/pier
function faceOf(m) {
  if (m.length === 0) return null;
  if (m.length >= 2) return "C";
  return m[0];
}

const paneProps = (face) =>
  (face === "N" || face === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: middle of the north face (lowest z edge), by x order
const northCells = [];
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  if (!has(x, z - 1)) northCells.push(x);
}
northCells.sort((a, b) => a - b);
const entranceX = northCells.length ? northCells[Math.floor(northCells.length / 2)] : -1;

// Inward neighbour for a given outward face
function inward(x, z, face) {
  if (face === "N") return [x, z + 1];
  if (face === "S") return [x, z - 1];
  if (face === "W") return [x + 1, z];
  if (face === "E") return [x - 1, z];
  return null;
}

// Pick the block for an exterior wall cell at height y
function wallBlock(x, z, y, gr, face, t) {
  // Base course at grade
  if (y === gr && y <= 4) return { id: "stone_bricks" };
  // Storey line at y=5, lintel band at y=9
  if (y === 5 || y === 9) return { id: "gray_concrete" };
  // Shopfront fascia
  if (y === 4) return { id: "polished_andesite" };

  // Corners and piers
  const ground = y <= 3;
  const pier = ground ? { id: "red_terracotta" } : { id: "white_terracotta" };
  if (face === "C") return pier;

  // Entrance on north face
  if (face === "N" && x === entranceX) {
    if (y === gr) return { id: "oak_door", props: { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" } };
    if (y === gr + 1) return { id: "oak_door", props: { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" } };
    if (y === gr + 2) return { id: "polished_andesite" };
    return pier;
  }
  // Flanking piers of entrance read as dark tile
  if (face === "N" && Math.abs(x - entranceX) === 1 && y <= gr + 2) {
    return { id: "red_terracotta" };
  }

  if (ground) {
    const win = t % 3 === 1 && y > gr;
    return win ? { id: "cyan_stained_glass_pane", props: paneProps(face) } : pier;
  }
  // Upper storey: sill at 6, glazing 7-8, pier otherwise
  const win = (y === 7 || y === 8) && t % 3 === 1;
  return win ? { id: "cyan_stained_glass_pane", props: paneProps(face) } : pier;
}

// Pass 1: foundations, shell, floors, roof, parapet
for (const [x, z, gr] of cells) {
  // Foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const m = missing(x, z);
  if (m.length === 0) {
    // Interior: air, with a floor slab at the storey line
    if (gr <= 5) g.set(x, 5, z, "smooth_stone");
  } else {
    const face = faceOf(m);
    const t = (face === "N" || face === "S") ? x : z;
    for (let y = gr; y <= 9; y++) {
      const b = wallBlock(x, z, y, gr, face, t);
      if (b.props) g.set(x, y, z, b.id, b.props);
      else g.set(x, y, z, b.id);
    }
    // Parapet
    g.set(x, 11, z, "white_terracotta");
  }
  // Roof slab over every footprint cell
  g.set(x, 10, z, "light_gray_concrete");
}

// Pass 2: glowstone just inside lit upper-storey windows
for (const [x, z, gr] of cells) {
  const m = missing(x, z);
  if (m.length !== 1) continue;
  const face = m[0];
  const t = (face === "N" || face === "S") ? x : z;
  if (t % 6 !== 1) continue;
  const [ix, iz] = inward(x, z, face);
  if (!has(ix, iz) || missing(ix, iz).length !== 0) continue;
  if (gr > 7) continue;
  g.set(ix, 7, iz, "glowstone");
}

// Pass 3: rooftop plant room near the centre
for (const [x, z, gr] of cells) {
  if (missing(x, z).length !== 0) continue;
  if (x < 7 || x > 11 || z < 9 || z > 14) continue;
  if (gr > 10) continue;
  g.set(x, 11, z, "light_gray_concrete");
  g.set(x, 12, z, "light_gray_concrete");
}

g.save(`${BASE}/${ID}.nbt`);
