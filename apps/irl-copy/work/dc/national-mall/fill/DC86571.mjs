import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86571";
const W = 11, D = 6, H = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Cell map with ground and flattened roof tiers.
const cellMap = new Map();
let baseY = Infinity;
let roofMax = 0;
for (const c of cells) baseY = Math.min(baseY, Math.round(c[2]));
for (const c of cells) roofMax = Math.max(roofMax, Math.round(c[3]));
roofMax = Math.min(roofMax, H - 1);
baseY = Math.max(0, baseY);

for (const [x, z, gr0, rf0] of cells) {
  const ground = Math.max(0, Math.min(H - 2, Math.round(gr0)));
  let top = Math.round(rf0) >= roofMax - 1 ? roofMax : Math.round(rf0);
  top = Math.max(ground + 1, Math.min(top, H - 1));
  cellMap.set(`${x},${z}`, { ground, top });
}
const inFootprint = (x, z) => cellMap.has(`${x},${z}`);

// Storey lines shared across the building.
const NS = Math.max(2, Math.min(4, Math.floor((roofMax - baseY) / 2)));
const L = [];
for (let k = 0; k <= NS; k++) L.push(baseY + Math.round((k * (roofMax - baseY)) / NS));
const isLine = (y) => L.includes(y);

const isPerimeter = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
const isFront = (z) => z === 0;
const isBack = (z) => z === D - 1;
const isEndX = (x) => x === 0 || x === W - 1;
const faceIndex = (x, z) => ((z === 0 || z === D - 1) ? x : z);

// Place a glass bay recessed one block behind the wall face.
const recessedGlass = (x, y, z) => {
  let tx = x, tz = z;
  if (isFront(z)) tz = 1;
  else if (isBack(z)) tz = D - 2;
  else if (x === 0) tx = 1;
  else if (x === W - 1) tx = W - 2;
  if (!inFootprint(tx, tz)) return;
  const c = cellMap.get(`${tx},${tz}`);
  if (y < c.ground || y >= c.top - 1) return;
  put(tx, y, tz, "light_blue_stained_glass");
};

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const { ground, top } = cellMap.get(`${x},${z}`);
  const perim = isPerimeter(x, z);

  // Foundation.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  for (let y = ground; y < top; y++) {
    if (!perim) {
      if (y === top - 1) put(x, y, z, "light_gray_concrete");
      else if (isLine(y) && y > ground) put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (y === top - 1) { put(x, y, z, "smooth_stone"); continue; }
    if (isCorner(x, z)) { put(x, y, z, "white_concrete"); continue; }
    if (y === ground) { put(x, y, z, "stone_bricks"); continue; }
    if (isLine(y) && y > ground) { put(x, y, z, "smooth_stone"); continue; }

    const idx = faceIndex(x, z);
    const isPier = idx % 2 === 0;
    const groundBand = y < L[1];

    if (isPier) {
      put(x, y, z, "white_concrete");
    } else if (groundBand) {
      // Shopfront glass stays flush at street level.
      put(x, y, z, "light_blue_stained_glass");
    } else {
      // Upper bays: wall opening left as a reveal, glass set back.
      put(x, y, z, "white_concrete");
      recessedGlass(x, y, z);
    }
  }

  // Roof equipment on the tallest tier, set back from the parapet.
  if (top === roofMax && !perim && x >= 3 && x <= 4 && z >= 2 && z <= 3) {
    put(x, top, z, "light_gray_concrete");
  }
}

// Ground-floor entrance on the front face.
const entrance = cellMap.get("5,0");
if (entrance) {
  const gy = entrance.ground;
  put(5, gy, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(5, gy + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// Warm lights behind the recessed glass, second storey.
if (NS >= 2) {
  const litY = L[1] + 1;
  if (litY < L[2]) {
    for (const x of [3, 7]) {
      const c = cellMap.get(`${x},2`);
      if (c && litY >= c.ground && litY < c.top) put(x, litY, 2, "shroomlight");
    }
  }
}

// Ground-floor lanterns inside the shopfront.
for (const x of [1, 9]) {
  const c = cellMap.get(`${x},1`);
  if (c && c.ground + 1 < L[1]) put(x, c.ground + 1, 1, "lantern", { hanging: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
