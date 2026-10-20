import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539950880.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw539950880.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8")); // [x, z, ground]
const W = 10, H = 23, D = 14;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => x + "," + z;
const inFp = new Set(cells.map(([x, z]) => key(x, z)));

// Common floor level: the highest ground under the footprint, so the
// building is level and the downhill side shows a plinth.
const base = Math.max(...cells.map((c) => c[2]));
// Two storeys of 5 blocks, then cornice and parapet: roof at base+11.
// Clamp so the top never exceeds the grid.
const roofY = Math.min(base + 11, H - 1);

const glassX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const glassZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, ground] of cells) {
  const nN = inFp.has(key(x, z - 1));
  const nS = inFp.has(key(x, z + 1));
  const nW = inFp.has(key(x - 1, z));
  const nE = inFp.has(key(x + 1, z));
  const ring = !nN || !nS || !nW || !nE;
  const corner = (!nN || !nS) && (!nW || !nE);
  const front = !nS;                 // +z side: shopfront and entrance
  const alongX = !nN || !nS;         // exposed on a north/south face -> u = x
  const u = alongX ? x : z;
  const len = alongX ? W : D;
  const windowCol = !corner && ring && u >= 1 && u <= len - 2 && (u - 1) % 3 === 0;
  const glassProps = alongX ? glassX : glassZ;

  // Foundation: solid from y 0 up to the floor level, so nothing floats.
  for (let y = 0; y < base; y++) {
    put(x, y, z, ring ? "stone_bricks" : "stone");
  }
  // Ground floor slab for interior cells, plinth course for the ring.
  if (ring) put(x, base, z, "stone_bricks");
  else put(x, base, z, "smooth_stone");

  if (!ring) {
    // Interior: floor slabs, roof deck, and warm lights behind the shopfront.
    put(x, base + 5, z, "smooth_stone");
    put(x, base + 10, z, "stone");
    if (z === D - 2 && [2, 5, 8].includes(x)) {
      put(x, base + 2, z, "glowstone");
      put(x, base + 7, z, "glowstone");
    }
    // Roof plant: two AC units on the deck.
    if ((x === 3 && z === 4) || (x === 6 && z === 9)) {
      put(x, base + 11, z, "iron_block");
    }
    continue;
  }

  // Exterior wall ring, base+1 .. base+11.
  for (let y = base + 1; y <= roofY; y++) {
    const rel = y - base;
    let id = "white_concrete";
    let props;

    if (rel === 4) {
      id = front ? "smooth_stone" : "white_concrete"; // lintel / canopy band
    }
    if (rel === 5) id = "light_gray_concrete";          // storey line
    if (rel === 10) id = "smooth_stone";                // cornice
    if (rel === 11) id = "light_gray_concrete";         // parapet

    // Ground storey: shopfront on the front, windows elsewhere.
    if (rel >= 1 && rel <= 3 && !corner) {
      if (front) {
        if (x >= 1 && x <= 8 && x !== 4) { id = "glass_pane"; props = glassX; }
      } else if (windowCol) {
        id = "glass_pane"; props = glassX.east === "true" && alongX ? glassX : glassZ;
        props = glassProps;
      }
    }

    // Upper storey: framed window openings.
    if (rel >= 7 && rel <= 8 && windowCol) {
      id = "glass_pane"; props = glassProps;
    }

    put(x, y, z, id, props);
  }

  // Entrance door on the front, centred at x = 4.
  if (front && x === 4) {
    put(x, base + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, base + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

g.save(OUT);
