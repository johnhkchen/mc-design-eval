import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-area commercial block, c. 1980s: two storeys of white painted
// reinforced concrete on a stone-brick base, a shopfront with a central entrance
// on the south (street) face, a stone cornice and a parapet, and rooftop AC plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542407472";
const W = 15, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr | 0);
const has = (x, z) => G.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// outward offset for each exposed face
const FACES = { N: [0, -1, "north"], S: [0, 1, "south"], W: [-1, 0, "west"], E: [1, 0, "east"] };

const frontCells = [];

for (const [x, z, gr] of cells) {
  const base = gr;

  // foundation up to this cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // floor slabs: ground floor, first floor, roof
  put(x, base, z, "smooth_stone");
  put(x, base + 5, z, "smooth_stone");
  put(x, base + 10, z, "smooth_stone");

  const exposed = Object.keys(FACES).filter((f) => {
    const [dx, dz] = FACES[f];
    return !has(x + dx, z + dz);
  });
  if (exposed.length === 0) continue;

  // corner cells read as solid concrete piers
  if (exposed.length >= 2) {
    for (let k = 0; k <= 11; k++) {
      const b = k === 0 || k === 10 ? "stone_bricks" : "white_concrete";
      put(x, base + k, z, b);
    }
    continue;
  }

  const f = exposed[0];
  const [dx, dz] = FACES[f];
  const i = f === "N" || f === "S" ? x : z; // position along the face
  const front = f === "S";
  if (front) frontCells.push({ x, z, base });

  for (let k = 0; k <= 11; k++) {
    const y = base + k;
    let b;
    if (k === 0) {
      b = "stone_bricks"; // base course
    } else if (k === 4) {
      b = "smooth_stone"; // ground-floor lintel band
    } else if (k === 5) {
      b = "white_concrete"; // first-floor line
    } else if (k === 9) {
      b = "smooth_stone"; // storey line
    } else if (k === 10) {
      b = "stone_bricks"; // cornice
    } else if (k === 11) {
      b = "white_concrete"; // parapet
    } else if (k <= 3 && front) {
      // shopfront: glass bays between polished pillars
      b = i % 3 === 0 ? "polished_andesite" : "light_blue_stained_glass_pane";
    } else if (k <= 3) {
      b = i % 3 === 0 || k === 1 ? "white_concrete" : "light_blue_stained_glass_pane";
    } else {
      // upper floor window grid (k 6..8)
      b = i % 3 === 0 ? "white_concrete" : "light_blue_stained_glass_pane";
    }
    put(x, y, z, b);

    // warm light behind some upper-floor glass
    if (k >= 6 && k <= 8 && i % 3 !== 0 && (i + k) % 5 === 0) {
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }
}

// Central entrance on the street face, with a lantern above the door
if (frontCells.length) {
  frontCells.sort((a, b) => a.x - b.x);
  const d = frontCells[Math.floor(frontCells.length / 2)];
  const props = (half) => ({
    facing: "south",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(d.x, d.base + 1, d.z, "dark_oak_door", props("lower"));
  put(d.x, d.base + 2, d.z, "dark_oak_door", props("upper"));
  put(d.x, d.base + 3, d.z, "lantern", { hanging: "true", waterlogged: "false" });
}

// Rooftop plant: scattered AC units and a lightning rod on the roof
const roofCells = cells.filter(([x, z]) => {
  const exposed = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  return !exposed;
});
for (const [x, z, gr] of roofCells) {
  if ((x * 3 + z) % 11 === 0) put(x, gr + 11, z, "iron_block");
}
if (cells.length) {
  const [rx, rz, rg] = cells.reduce((a, b) => (b[0] - b[1] > a[0] - a[1] ? b : a));
  put(rx, rg + 11, rz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
