import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-district commercial block, c. 1990s: two storeys over a shopfront
// ground floor, white concrete frame, quartz storey bands, glass curtain-style
// windows, a cornice, a parapet and rooftop plant. Roof deck at y=10, parapet to y=11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109953";
const W = 27, H = 23, D = 33;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = raw.map((c) => (Array.isArray(c) ? { x: c[0], z: c[1], gr: c[2] } : { x: c.x, z: c.z, gr: c.ground ?? c.g }));

const minG = Math.min(...list.map((c) => c.gr));
const key = (x, z) => `${x},${z}`;
const base = new Map(list.map((c) => [key(c.x, c.z), Math.round(c.gr - minG)]));
const has = (x, z) => base.has(key(x, z));
const baseAt = (x, z) => base.get(key(x, z));

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

const cx = list.reduce((s, c) => s + c.x, 0) / list.length;
const cz = list.reduce((s, c) => s + c.z, 0) / list.length;

// Outward normal for an edge cell (first empty neighbour wins).
function normal(x, z) {
  if (!has(x, z - 1)) return [0, -1];
  if (!has(x, z + 1)) return [0, 1];
  if (!has(x - 1, z)) return [-1, 0];
  if (!has(x + 1, z)) return [1, 0];
  return null; // interior
}
const outwardCount = (x, z) =>
  [has(x, z - 1), has(x, z + 1), has(x - 1, z), has(x + 1, z)].filter((v) => !v).length;
const faceName = (nx, nz) => (nz === -1 ? "north" : nz === 1 ? "south" : nx === -1 ? "west" : "east");

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const c of list) {
  const b = baseAt(c.x, c.z);
  for (let y = 0; y < b; y++) put(c.x, y, c.z, "stone");
}

// 2. Interior: floor slab at the second-storey line, roof deck at y=10.
for (const c of list) {
  const b = baseAt(c.x, c.z);
  if (b <= 5 && b > 0) put(c.x, 5, c.z, "light_gray_concrete");
  if (b <= 10) put(c.x, 10, c.z, "light_gray_concrete");
}

// 3. Entrance: perimeter cell on the north (street) face nearest the middle.
let entrance = null;
let best = Infinity;
for (const c of list) {
  const n = normal(c.x, c.z);
  if (n && n[1] === -1) {
    const d = Math.abs(c.x - cx);
    if (d < best) { best = d; entrance = c; }
  }
}
const entKey = entrance ? key(entrance.x, entrance.z) : null;

// 4. Facade: walls, shopfronts, window grids, bands, cornice, parapet.
for (const c of list) {
  const n = normal(c.x, c.z);
  if (!n) continue;
  const [nx, nz] = n;
  const b = baseAt(c.x, c.z);
  const face = faceName(nx, nz);
  const along = nz !== 0 ? c.x : c.z;
  const pillar = along % 3 === 0;
  const paneProps = nz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const warm = (y) => (c.x * 7 + c.z * 13 + y * 5) % 11 === 0;

  for (let y = b; y <= 11; y++) {
    if (y <= 4) {
      if (y === b) put(c.x, y, c.z, "stone_bricks");
      else if (y === 4) put(c.x, y, c.z, "smooth_stone");
      else if (pillar) put(c.x, y, c.z, "white_concrete");
      else put(c.x, y, c.z, "light_blue_stained_glass");
    } else if (y === 5 || y === 9) {
      put(c.x, y, c.z, "smooth_quartz");
    } else if (y <= 8) {
      if (pillar) put(c.x, y, c.z, "white_concrete");
      else if (warm(y)) put(c.x, y, c.z, "yellow_stained_glass_pane", paneProps);
      else put(c.x, y, c.z, "light_blue_stained_glass_pane", paneProps);
    } else if (y === 10) {
      put(c.x, y, c.z, "smooth_quartz");
    } else if (y === 11) {
      put(c.x, y, c.z, "white_concrete");
    }
  }

  // Entrance door sits on the ground floor of the chosen north-face cell.
  if (key(c.x, c.z) === entKey) {
    const hinge = "left";
    put(c.x, b, c.z, "dark_oak_door", { facing: face, half: "lower", hinge, open: "false", powered: "false" });
    put(c.x, b + 1, c.z, "dark_oak_door", { facing: face, half: "upper", hinge, open: "false", powered: "false" });
    put(c.x, b + 2, c.z, "smooth_stone");
  }

  // Corner lanterns on the parapet for dusk read.
  if (outwardCount(c.x, c.z) >= 2) {
    put(c.x, 12, c.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 5. Rooftop plant: a small mechanical box with vents near the roof centre.
for (const c of list) {
  if (outwardCount(c.x, c.z) !== 0) continue;
  if (baseAt(c.x, c.z) > 10) continue;
  if (Math.abs(c.x - cx) <= 2 && Math.abs(c.z - cz) <= 1) {
    put(c.x, 11, c.z, "light_gray_concrete");
    put(c.x, 12, c.z, "iron_bars");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
