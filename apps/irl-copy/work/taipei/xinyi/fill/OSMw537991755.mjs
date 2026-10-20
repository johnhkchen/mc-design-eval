import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537991755";
const W = 22, H = 23, D = 14;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => G.has(`${x},${z}`);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Pass 1: foundations and floors/roof for every footprint cell
for (const [x, z, gr] of cells) {
  const y0 = Math.max(0, Math.round(gr));
  for (let y = 0; y < y0; y++) put(x, y, z, "stone_bricks");

  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  put(x, y0, z, "light_gray_concrete");           // ground floor slab
  put(x, y0 + 5, z, perim ? "smooth_stone" : "light_gray_concrete"); // storey line / slab
  put(x, y0 + 10, z, "light_gray_concrete");      // roof slab (air gap below)

  if (!perim) continue;

  // Wall body: white concrete, two storeys of 5 blocks, parapet above
  for (let y = y0 + 1; y <= y0 + 10; y++) put(x, y, z, "white_concrete");
  put(x, y0 + 1, z, "stone_bricks");              // base course
  put(x, y0 + 5, z, "smooth_stone");              // storey line
  put(x, y0 + 11, z, "smooth_stone");             // cornice / parapet cap

  // Which face is this cell on, and its index along that face
  const northEdge = !has(x, z - 1);
  const southEdge = !has(x, z + 1);
  const westEdge = !has(x - 1, z);
  const eastEdge = !has(x + 1, z);
  const corner = (northEdge || southEdge) && (westEdge || eastEdge);
  const onZFace = northEdge || southEdge;
  const idx = onZFace ? x : z;
  const pier = corner || idx % 3 === 0;
  const front = northEdge;                         // street-facing side (z = 0)

  // Inward direction for placing warm lights behind the glass
  let dx = 0, dz = 0;
  if (northEdge) dz = 1;
  if (southEdge) dz = -1;
  if (westEdge) dx = 1;
  if (eastEdge) dx = -1;

  if (!corner) {
    if (front && x === 11) {
      // Central entrance: dark oak door with canopy above
      put(x, y0 + 2, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, y0 + 3, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (!pier) {
      // Shopfront / window glass, ground and upper storey
      put(x, y0 + 2, z, "glass");
      put(x, y0 + 3, z, "glass");
      put(x, y0 + 7, z, "glass");
      put(x, y0 + 8, z, "glass");
    }
    // Canopy band over the street front
    if (front) put(x, y0 + 4, z, "green_concrete");
  }

  // Warm glowstone behind some upper and lower windows
  if (!pier && (idx % 6 === 2) && dx + dz !== 0) {
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && G.get(`${ix},${iz}`) === y0) {
      put(ix, y0 + 2, iz, "glowstone");
      put(ix, y0 + 7, iz, "glowstone");
    }
  }
}

// Pass 2: rooftop plant on the interior of the roof
for (const [x, z, gr] of cells) {
  const y0 = Math.max(0, Math.round(gr));
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (perim) continue;
  if (x >= 8 && x <= 10 && z >= 5 && z <= 8) {
    put(x, y0 + 11, z, "light_gray_concrete");
    if (x === 9 && z === 6) put(x, y0 + 12, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
