import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-century Taipei low-rise: two storeys over a shopfront base, white
// tiled/rendered concrete walls, light-blue glazing in grey aluminium-style
// frames, a flat roof deck with a cornice-like parapet and rooftop plant.

const ROOT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831858853";
const W = 22, H = 23, D = 17;
const ROOF_DECK_Y = 10;   // top of roof deck blocks => roof surface at y 11
const BAND_FLOOR_Y = 5;   // first-floor slab / storey line
const cells = JSON.parse(readFileSync(`${ROOT}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.min(ROOF_DECK_Y, Math.round(gr))));
}

const inside = (x, z) => ground.has(key(x, z));
const gcOf = (x, z) => ground.get(key(x, z));

let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
  zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
}
const cx = Math.floor((xmin + xmax) / 2);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const isExterior = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
const isCorner = (x, z) => (x === xmin || x === xmax) && (z === zmin || z === zmax);
const isPillar = (x, z) => isCorner(x, z) || (x + z) % 3 === 0;
const isEntrance = (x, z) => z === zmin && x === cx;

// Pass 1: foundations, floors, walls, deck, parapet.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gc = gcOf(x, z);

  // Foundation fill from y 0 up to the cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  if (isExterior(x, z)) {
    for (let y = gc; y <= 12; y++) {
      if (y === gc) { put(x, y, z, "polished_andesite"); continue; }
      if (y < BAND_FLOOR_Y) {
        // Shopfront band.
        if (y === BAND_FLOOR_Y - 1) put(x, y, z, "white_concrete");
        else if (isPillar(x, z)) put(x, y, z, "light_gray_concrete");
        else put(x, y, z, "light_blue_stained_glass_pane");
        continue;
      }
      if (y === 5) { put(x, y, z, "light_gray_concrete"); continue; }   // storey belt
      if (y === 6) { put(x, y, z, "white_concrete"); continue; }        // sill
      if (y === 7 || y === 8) {
        if (isPillar(x, z)) put(x, y, z, "white_concrete");
        else put(x, y, z, "light_blue_stained_glass_pane");
        continue;
      }
      if (y === 9) { put(x, y, z, "white_concrete"); continue; }        // lintel
      if (y === ROOF_DECK_Y) { put(x, y, z, "light_gray_concrete"); continue; } // roof deck
      if (y === ROOF_DECK_Y + 1) {
        put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); // cornice
        continue;
      }
      put(x, y, z, "white_concrete"); // parapet cap
    }
  } else {
    // Interior: floor slabs and roof deck only, air between (no interiors).
    put(x, gc, z, "light_gray_concrete");
    if (gc < BAND_FLOOR_Y) put(x, BAND_FLOOR_Y, z, "light_gray_concrete");
    put(x, ROOF_DECK_Y, z, "light_gray_concrete");

    // Rooftop plant boxes on the deck.
    if (x % 6 === 2 && z % 5 === 2 && gc <= ROOF_DECK_Y) {
      put(x, ROOF_DECK_Y + 1, z, "stone_bricks");
      put(x, ROOF_DECK_Y + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Pass 2: warm lights just inside the glazing.
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (isExterior(x, z)) continue;
  const gc = gcOf(x, z);
  const nb = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]];
  const nearGlass = nb.some(([nx, nz]) => inside(nx, nz) && isExterior(nx, nz) && !isPillar(nx, nz));
  if (!nearGlass) continue;
  // Ground-floor shop lights.
  if (((x * 5 + z * 3) % 4) === 0 && !isEntrance(x, z + 1)) {
    put(x, gc + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // Upper-floor lights on the slab.
  if (gc < BAND_FLOOR_Y && ((x * 5 + z * 3) % 4) === 1) {
    put(x, BAND_FLOOR_Y + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: entrance on the zMin face, centred on the frontage.
for (let x = cx; x <= cx; x++) {
  if (!inside(x, zmin)) continue;
  const gc = gcOf(x, zmin);
  if (gc + 2 >= BAND_FLOOR_Y) continue;
  put(x, gc + 1, zmin, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gc + 2, zmin, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Marquee over the door.
  for (let dx = -1; dx <= 1; dx++) {
    if (!inside(x + dx, zmin)) continue;
    const g2 = gcOf(x + dx, zmin);
    if (g2 + 3 < BAND_FLOOR_Y) {
      put(x + dx, g2 + 3, zmin, "smooth_stone_slab", { type: "top", waterlogged: "false" });
    }
  }
}

g.save(`${ROOT}/${ID}.nbt`);
