import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-1990s Xinyi-type mid-rise: two storeys of pale glazed tile over a
// stone-base shopfront, a smooth quartz cornice, a parapet and a small
// rooftop plant box. Roof deck top sits at y=11, about 11 blocks above the
// lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw538458214.cells.json`, "utf8"));

const W = 11, H = 23, D = 16;
const DECK = 10;      // roof deck layer (top surface at 11)
const PARAPET = 11;   // parapet course on the perimeter
const BAND = 5;       // storey line between the two storeys
const SHOP_TOP = 4;   // top of the shopfront band

const g = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;

// Ground heights, clamped to what the build can use.
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.min(Math.max(gr, 0), 9));
}
const inside = (x, z) => ground.has(key(x, z));

const DIRS = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
];

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// A cell is on the perimeter if any orthogonal neighbour is outside the footprint.
const missingFaces = (x, z) => DIRS.filter((d) => !inside(x + d.dx, z + d.dz));
const isPerimeter = (x, z) => missingFaces(x, z).length > 0;

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pick the facade block for a perimeter cell at height y.
// Returns { id, props, door?, window? } or null for nothing.
function facadeBlock(i, n, y, gr, face) {
  const pier = i === 0 || i === n - 1;

  if (y === DECK) return { id: "smooth_quartz" };          // cornice course
  if (y === BAND) return { id: "polished_andesite" };      // storey belt course

  if (y <= SHOP_TOP) {                                    // ground storey
    if (y === SHOP_TOP) return { id: "polished_andesite" }; // lintel
    const doorCol = face === "south" && i === Math.floor(n / 2);
    if (doorCol && y <= gr + 2 && gr + 1 <= SHOP_TOP) return { door: true };
    if (pier) return { id: "stone_bricks" };
    return { id: "light_blue_stained_glass_pane", props: paneProps(face), window: true };
  }

  // Upper storey: 6..9
  if (pier) return { id: "white_terracotta" };
  const isWindowBay = i % 2 === 1;
  if (!isWindowBay) return { id: "white_terracotta" };
  if (y === 6 || y === 9) return { id: "smooth_quartz" };  // sill and head
  return { id: "light_blue_stained_glass_pane", props: paneProps(face), window: true };
}

// ---- Foundation, floors, deck ----
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");   // foundation
  put(x, gr, z, "smooth_stone");                               // ground floor slab
  if (gr < BAND) put(x, BAND, z, "smooth_stone");              // storey slab
  put(x, DECK, z, "smooth_stone");                             // roof deck
}

// ---- Perimeter walls ----
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerimeter(x, z)) continue;

  const face = missingFaces(x, z)[0];
  const dir = DIRS.find((d) => d.name === face.name);
  const along = dir.name === "north" || dir.name === "south" ? x : z;
  const n = dir.name === "north" || dir.name === "south" ? W : D;
  const outward = dir;

  for (let y = gr + 1; y <= DECK - 1; y++) {
    const fb = facadeBlock(along, n, y, gr, dir.name);
    if (!fb) continue;
    if (fb.door) {
      const lower = y === gr + 1;
      put(x, y, z, "oak_door", {
        facing: dir.name,
        half: lower ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (y === BAND || y === DECK) {
      put(x, y, z, fb.id);
      continue;
    }
    put(x, y, z, fb.id, fb.props);

    // Warm light in the air gap behind some windows.
    if (fb.window && y === 7 && along % 4 === 1) {
      const ix = x - outward.dx;
      const iz = z - outward.dz;
      if (inside(ix, iz) && !isPerimeter(ix, iz)) {
        put(ix, 7, iz, "glowstone");
      }
    }
  }

  // Cornice at the deck line already handled above; add the parapet cap.
  put(x, DECK, z, "smooth_quartz");
  put(x, PARAPET, z, "stone_brick_wall", { up: "true" });
}

// ---- Rooftop plant box, set back from the parapet ----
for (const [k] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (isPerimeter(x, z)) continue;
  if (x >= 3 && x <= 7 && z >= 5 && z <= 10) {
    put(x, PARAPET, z, "gray_concrete");
  }
  if (x >= 4 && x <= 6 && z >= 6 && z <= 9) {
    put(x, PARAPET + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/OSMw538458214.nbt`);
