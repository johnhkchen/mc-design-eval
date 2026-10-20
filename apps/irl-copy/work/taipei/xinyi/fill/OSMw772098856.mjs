import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772098856";
const W = 25, H = 23, D = 14;

// Two-storey mid-century commercial block: stone plinth, white tiled-concrete piers,
// glazed bays, shopfront on the street (front) face, flat roof with parapet and plant.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

// Perimeter test: any side open to the outside
const isPerim = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Street-facing front (z minimum) door: middle of the front row
const frontXs = cells.filter(([x, z]) => !has(x, z - 1)).map(([x]) => x);
const doorX = frontXs.length ? Math.round((Math.min(...frontXs) + Math.max(...frontXs)) / 2) : -1;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  const exposedCount = [n, s, w, e].filter(Boolean).length;
  const corner = exposedCount > 1;
  const face = n ? "front" : s ? "back" : w ? "xm" : "xp";
  const i = (face === "front" || face === "back") ? x : z; // bay index along the face

  if (!perim) {
    // Interior: floor slabs, roof deck, no interior fit-out
    put(x, gr, z, "smooth_stone");
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "gray_concrete");
    continue;
  }

  const winBay = !corner && (i % 4 === 1 || i % 4 === 2);

  for (let k = 0; k <= 11; k++) {
    const y = gr + k;
    let b = null;

    if (k === 0) {
      b = "stone_bricks"; // base course
    } else if (k === 4 || k === 10) {
      b = "light_gray_concrete"; // storey line / cornice
    } else if (k === 5) {
      b = "smooth_stone"; // floor slab edge
    } else if (k === 11) {
      b = "white_concrete"; // parapet
    } else if (k <= 3) {
      // Ground storey
      if (corner) {
        b = "white_concrete";
      } else if (face === "front") {
        if (x === doorX) {
          if (k === 1) { put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
          if (k === 2) { put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
          if (k === 3) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
        }
        if (i % 6 === 0) b = "white_concrete";
        else b = k === 1 ? "smooth_stone" : "glass";
      } else {
        if (winBay) b = k === 1 ? "smooth_stone" : "glass_pane";
        else b = "white_concrete";
      }
    } else {
      // Upper storey (k 6..9)
      if (corner || !winBay) b = "white_concrete";
      else if (k === 6) b = "smooth_stone";
      else if (k === 9) b = "light_gray_concrete";
      else b = "glass_pane";
    }

    if (b) put(x, y, z, b);
  }

  // Warm light behind a few glazed bays (interior cell just inside the glass)
  if (winBay) {
    const dx = face === "xm" ? 1 : face === "xp" ? -1 : 0;
    const dz = face === "front" ? 1 : face === "back" ? -1 : 0;
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && !isPerim(ix, iz)) {
      if (i % 8 === 1) put(ix, gr + 7, iz, "glowstone");
      if (i % 8 === 5 && !(face === "front" && x === doorX)) put(ix, gr + 2, iz, "glowstone");
    }
  }
}

// Roof plant on the deck, set back from the parapet (sits on the k=10 deck)
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  if (x % 5 === 2 && z % 3 === 1) put(x, gr + 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
