import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499709";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 28, D = 9;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(key(x, z), { x, z, gr, roof });
const has = (x, z) => map.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Street-facing side: south (high z). Door goes on an odd (window-grid) index nearest the middle.
let maxZ = -1;
for (const c of map.values()) if (!has(c.x, c.z + 1)) maxZ = Math.max(maxZ, c.z);
const southXs = [...map.values()]
  .filter(c => c.z === maxZ && !has(c.x, c.z + 1) && has(c.x - 1, c.z) && has(c.x + 1, c.z))
  .map(c => c.x)
  .sort((a, b) => a - b);
let doorX = -1;
if (southXs.length) {
  const mid = southXs[Math.floor((southXs.length - 1) / 2)];
  const odd = southXs.filter(x => x % 2 === 1);
  doorX = odd.length
    ? odd.reduce((best, x) => (Math.abs(x - mid) < Math.abs(best - mid) ? x : best), odd[0])
    : mid;
}

const WIN_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const WIN_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const c of map.values()) {
  const { x, z, gr, roof } = c;
  const n = Math.min(3, Math.max(1, Math.round((roof - gr) / 5)));
  const roofY = gr + 5 * n;

  // foundation up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "cobblestone");

  // floor slabs per storey and the roof deck
  for (let k = 0; k < n; k++) put(x, gr + 5 * k, z, "stone_bricks");
  put(x, roofY, z, "deepslate_tiles");

  const faces = [];
  if (!has(x, z - 1)) faces.push("N");
  if (!has(x, z + 1)) faces.push("S");
  if (!has(x - 1, z)) faces.push("W");
  if (!has(x + 1, z)) faces.push("E");

  // stone cornice slab on the exterior edge of the roof
  if (faces.length) put(x, roofY + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  if (faces.length === 0) continue; // interior: air behind glass

  const corner = faces.length >= 2;
  const face = faces[0];
  const idx = (face === "N" || face === "S") ? x : z;

  for (let k = 0; k < n; k++) {
    const base = gr + 5 * k;
    // lintel / spandrel band
    put(x, base + 4, z, "stone_bricks");

    if (corner || idx % 2 === 0) {
      // pier or corner: solid stone up the storey
      for (let dy = 1; dy <= 3; dy++) put(x, base + dy, z, "stone_bricks");
      continue;
    }

    const isDoor = k === 0 && face === "S" && idx === doorX;
    if (isDoor) {
      put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "glass_pane", WIN_NS);
      continue;
    }

    const props = (face === "N" || face === "S") ? WIN_NS : WIN_EW;
    for (let dy = 1; dy <= 3; dy++) put(x, base + dy, z, "glass_pane", props);

    // warm light behind some panes, inside the footprint
    if ((idx + k) % 3 === 0) {
      let ix = x, iz = z;
      if (face === "N") iz = z + 1;
      else if (face === "S") iz = z - 1;
      else if (face === "W") ix = x + 1;
      else if (face === "E") ix = x - 1;
      if (has(ix, iz)) put(ix, base + 2, iz, "glowstone");
    }
  }

  // entrance canopy: small slab hood above the door
  if (face === "S" && idx === doorX) {
    put(x, gr + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// short brick chimney on an interior roof cell, capped with a slab
const interior = [...map.values()].filter(c =>
  has(c.x - 1, c.z) && has(c.x + 1, c.z) && has(c.x, c.z - 1) && has(c.x, c.z + 1));
if (interior.length) {
  const c = interior[Math.floor(interior.length / 2)];
  const n = Math.min(3, Math.max(1, Math.round((c.roof - c.gr) / 5)));
  const top = c.gr + 5 * n;
  for (let dy = 1; dy <= 2; dy++) put(c.x, top + dy, c.z, "bricks");
  put(c.x, top + 3, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
