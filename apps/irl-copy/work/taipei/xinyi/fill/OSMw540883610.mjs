import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883610";
const W = 9, H = 23, D = 11;

// Record: 2-storey low-rise commercial block (1980s-90s Xinyi frontage style).
// Storey lines at y=5, cornice/roof at y=10, parapet at y=11 (lidar roof ~11 above lowest ground).
const COURSE = 5;      // storey line between the two floors
const ROOF = 10;       // cornice row / roof surface
const PARAPET = 11;    // parapet top

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of raw) ground.set(`${x},${z}`, Math.round(gr));

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const cells = [...ground.keys()].map((k) => k.split(",").map(Number));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Edge analysis
const faceN = (x, z) => !has(x, z - 1);
const faceS = (x, z) => !has(x, z + 1);
const faceW = (x, z) => !has(x - 1, z);
const faceE = (x, z) => !has(x + 1, z);
const isPerimeter = (x, z) => faceN(x, z) || faceS(x, z) || faceW(x, z) || faceE(x, z);
const isCorner = (x, z) => (faceN(x, z) || faceS(x, z)) && (faceW(x, z) || faceE(x, z));

// Door: on the southern-most row, nearest to the middle of the frontage
const maxZ = Math.max(...cells.map(([, z]) => z));
const southRow = cells.filter(([, z]) => z === maxZ);
const midX = (W - 1) / 2;
southRow.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
const [doorX, doorZ] = southRow[0];

// 1) Foundation: solid from y 0 up to each cell's ground (inclusive plinth)
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");
}

// 2) Interior floor slab at the storey line and flat roof surface (air elsewhere = hollow)
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  if (isPerimeter(x, z)) continue;
  if (COURSE > gr) put(x, COURSE, z, "smooth_stone");
  if (ROOF > gr) put(x, ROOF, z, "light_gray_concrete");
}

// 3) Facade shell
for (const [x, z] of cells) {
  if (!isPerimeter(x, z)) continue;
  const gr = gAt(x, z);
  const corner = isCorner(x, z);
  const onNS = faceN(x, z) || faceS(x, z); // wall runs along x
  const c = onNS ? x : z;                  // coordinate along the wall
  const isWin = !corner && c % 2 === 1;
  const isDoor = x === doorX && z === doorZ && gr + 2 < COURSE;

  // Cornice and storey line courses run the full perimeter
  put(x, ROOF, z, "quartz_block");
  put(x, COURSE, z, "quartz_block");
  // Parapet
  put(x, PARAPET, z, "smooth_quartz");

  // Ground storey (rows gr+1 .. 4)
  for (let y = gr + 1; y <= 4; y++) {
    if (y === 4) { put(x, y, z, "quartz_block"); continue; }
    if (isDoor && y <= gr + 2) {
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isWin) { put(x, y, z, "glass"); continue; }
    put(x, y, z, y === gr + 1 ? "polished_andesite" : "smooth_quartz");
  }
  if (isDoor && gr + 3 <= 4) put(x, gr + 3, z, "smooth_quartz");

  // Upper storey (rows 6 .. 9)
  for (let y = Math.max(gr + 1, 6); y <= 9; y++) {
    if (y === 9) { put(x, y, z, "smooth_quartz"); continue; }
    if (isWin) {
      put(x, y, z, "glass_pane", onNS
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
    } else {
      put(x, y, z, "smooth_quartz");
    }
  }
}

// 4) Warm light behind selected upper windows (interior, air gap behind the glass)
for (const [x, z] of cells) {
  if (!isPerimeter(x, z) || isCorner(x, z)) continue;
  const onNS = faceN(x, z) || faceS(x, z);
  const c = onNS ? x : z;
  if (c % 4 !== 3) continue;
  let ix = x, iz = z;
  if (faceN(x, z)) iz = z + 1;
  else if (faceS(x, z)) iz = z - 1;
  else if (faceW(x, z)) ix = x + 1;
  else if (faceE(x, z)) ix = x - 1;
  if (!has(ix, iz) || isPerimeter(ix, iz)) continue;
  if (gAt(ix, iz) >= 7) continue;
  put(ix, 7, iz, "glowstone");
}

// 5) Rooftop: AC plant block and a lightning rod, on the flat roof
const interior = cells.filter(([x, z]) => !isPerimeter(x, z));
const acCells = interior.filter(([x, z]) => x >= 3 && x <= 5 && z >= 3 && z <= 5);
for (const [x, z] of acCells) {
  const gr = gAt(x, z);
  if (gr >= ROOF) continue;
  put(x, PARAPET, z, "light_gray_concrete");
  put(x, PARAPET + 1, z, "light_gray_concrete");
}
const rodCell = interior.find(([x, z]) => x === 1 && z === 1) || interior[0];
if (rodCell) {
  const [rx, rz] = rodCell;
  put(rx, PARAPET, rz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(rx, PARAPET + 1, rz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
