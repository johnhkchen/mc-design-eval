import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw370537811.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw370537811.nbt";

const W = 27, H = 28, D = 15;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// Footprint lookup: "x,z" -> ground y
const foot = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  foot.set(`${x},${z}`, gr);
  if (gr < minG) minG = gr;
}
const base = minG;          // lowest ground = storey 1 floor line
const topRel = 17;          // parapet top rel 16, rooftop plant to rel 17
const has = (x, z) => foot.has(`${x},${z}`);

// Perimeter: any 4-neighbour outside the footprint
const isPerim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: south edge (max z), centred
const xs = cells.map(c => c[0]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const maxZ = Math.max(...cells.map(c => c[1]));
const doorX = Math.round((minX + maxX) / 2);
const isDoor = (x, z) => z === maxZ && x === doorX;
const isDoorFrame = (x, z) => z === maxZ && Math.abs(x - doorX) <= 1;

const g = new Voxels([W, H, D]);
const setB = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, ground] of cells) {
  const perim = isPerim(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < Math.min(ground, H); y++) setB(x, y, z, "stone");

  for (let rel = 0; rel <= topRel; rel++) {
    const y = base + rel;
    if (y < 0 || y >= H) continue;
    if (y < ground) continue;

    // Base course, floor slabs, cornice, roof
    if (rel === 0) {
      setB(x, y, z, perim ? "polished_granite" : "light_gray_concrete");
      continue;
    }
    if (rel === 5 || rel === 10) {
      setB(x, y, z, perim ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (rel === 15) {
      setB(x, y, z, perim ? "stone_bricks" : "light_gray_concrete");
      continue;
    }
    if (rel === 16) {
      if (perim) setB(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else if (x >= 10 && x <= 16 && z >= 6 && z <= 8) setB(x, y, z, "stone_bricks");
      continue;
    }
    if (rel === 17) {
      if (x >= 10 && x <= 16 && z >= 6 && z <= 8) setB(x, y, z, "light_gray_concrete");
      continue;
    }

    // Storey walls: storey index s, local row r (1..4)
    const s = rel < 5 ? 0 : rel < 10 ? 1 : 2;
    const r = rel - 5 * s;

    if (perim) {
      // Pier rhythm follows each wall's own direction
      const onXSide = !has(x - 1, z) || !has(x + 1, z);
      const onZSide = !has(x, z - 1) || !has(x, z + 1);
      const along = (onXSide && !onZSide) ? z : x;
      const corner = onXSide && onZSide;
      const pier = corner || along % 3 === 0;

      // Entrance: door, stone surround, lintel
      if (s === 0 && isDoor(x, z) && (r === 1 || r === 2)) {
        setB(x, y, z, "dark_oak_door", {
          facing: "south",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (s === 0 && isDoorFrame(x, z) && r <= 3) {
        setB(x, y, z, "stone_bricks");
        continue;
      }

      if (pier) {
        setB(x, y, z, "white_concrete");
      } else if (r === 4) {
        setB(x, y, z, "white_concrete");              // spandrel
      } else if (s === 0) {
        setB(x, y, z, "light_blue_stained_glass");    // shopfront rows 1..3
      } else if (r === 2 || r === 3) {
        setB(x, y, z, "light_blue_stained_glass");    // office windows
      } else {
        setB(x, y, z, "white_concrete");              // sill band
      }
    } else {
      // Interior air gap; warm lights behind some windows
      let ix = null, iz = null;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (has(x + dx, z + dz) && isPerim(x + dx, z + dz)) { ix = dx; iz = dz; break; }
      }
      if (ix !== null) {
        if (r === 2 && (x * 3 + z * 5) % 4 === 0 && !isDoor(x, z)) {
          setB(x, y, z, "glowstone");
        } else if (s === 0 && r === 1 && isDoor(x + ix, z + iz)) {
          setB(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
    }
  }
}

g.save(OUT);
