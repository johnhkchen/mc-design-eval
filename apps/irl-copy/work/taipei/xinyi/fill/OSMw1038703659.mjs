import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038703659";
const W = 41, H = 23, D = 26;

// Record: no tags. Read as a 2-storey, flat-roofed commercial block of
// pale tiled concrete with a glazed shopfront on the low-z (north) face,
// quartz pilasters, a belt course, a cornice and a parapet. Roof ~11 blocks
// above its lowest ground.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
let minX = Infinity, maxX = -Infinity;
for (const c of cells) {
  const gr = Math.max(0, Math.round(c[2]));
  fp.set(key(c[0], c[1]), gr);
  minX = Math.min(minX, c[0]);
  maxX = Math.max(maxX, c[0]);
}
const has = (x, z) => fp.has(key(x, z));
const cx = Math.round((minX + maxX) / 2); // centre of the front for the entrance

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const GLASS = "glass_pane";
const FRAME = "quartz_pillar";

for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const north = !has(x, z - 1);
  const south = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const isEdge = north || south || west || east;
  const isCorner = (west || east) && (north || south);

  // Ground floor slab / base course on every footprint cell.
  put(x, gr, z, isEdge ? "polished_andesite" : "smooth_stone");

  if (!isEdge) {
    // Interior: floor slabs at storey lines, air between, roof deck.
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "light_gray_concrete");
    // Rooftop plant boxes standing on the roof deck.
    if (x % 9 === 4 && z % 8 === 4) {
      put(x, gr + 11, z, "light_gray_concrete");
      put(x, gr + 12, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade coordinate along the wall.
  const alongX = north || south;
  const u = alongX ? x : z;
  const pilaster = isCorner || u % 4 === 0;
  const shopfront = north; // glazed ground floor on the low-z face
  const entrance = north && Math.abs(x - cx) <= 2;

  // Storey 1: sill gr+1, windows gr+2..gr+3, lintel gr+4.
  // Storey 2: sill gr+6, windows gr+7..gr+8, lintel gr+9.
  const storeys = [
    { sill: gr + 1, lo: gr + 1, hi: gr + 4, storey: 1 },
    { sill: gr + 6, lo: gr + 6, hi: gr + 9, storey: 2 },
  ];

  for (const s of storeys) {
    for (let y = s.lo; y <= s.hi; y++) {
      if (pilaster && !(shopfront && entrance && y <= s.lo + 2 && !isCorner)) {
        put(x, y, z, FRAME, { axis: "y" });
        continue;
      }
      if (y === s.hi) {
        put(x, y, z, "quartz_block");
        continue;
      }
      if (y === s.sill) {
        // Ground floor on the shopfront face is glazed right down to the lintel.
        if (shopfront && s.storey === 1) put(x, y, z, GLASS);
        else put(x, y, z, "quartz_block");
        continue;
      }
      // Window rows (glass with quartz frame), or shopfront glazing.
      if (s.storey === 1 && shopfront) {
        if (entrance && y === s.lo) put(x, y, z, "glass");
        else put(x, y, z, "glass");
      } else if (s.storey === 2 && y === s.lo + 2 && u % 8 === 2) {
        put(x, y, z, "shroomlight"); // warm lit room behind glass
      } else if (s.storey === 1 && y === s.lo + 2 && u % 8 === 6) {
        put(x, y, z, "shroomlight");
      } else {
        put(x, y, z, GLASS);
      }
    }
  }

  // Belt course at the floor line between storeys.
  put(x, gr + 5, z, "quartz_block");

  // Cornice and roof.
  put(x, gr + 10, z, "quartz_block");
  put(x, gr + 11, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance: two standing lanterns inside the lobby on the shopfront side.
for (const [k, gr] of fp) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x, z - 1) && Math.abs(x - cx) === 2 && has(x, z + 1)) {
    put(x, gr + 1, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
