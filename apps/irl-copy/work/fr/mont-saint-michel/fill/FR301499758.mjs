import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499758";
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);

const W = 7, H = 23, D = 5;
const g = new Voxels([W, H, D]);

const info = new Map();
const roofs = [];
for (const c of list) {
  info.set(`${c[0]},${c[1]}`, { ground: c[2], roof: c[3] });
  roofs.push(c[3]);
}

roofs.sort((a, b) => a - b);
const R = roofs.length ? Math.round(roofs[Math.floor(roofs.length / 2)]) : 11;
const TOP = Math.min(Math.max(R, 9), 12);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

function wallBlock(x, y, z) {
  const front = z === 0;
  const back = z === D - 1;
  const side = x === 0 || x === W - 1;

  // Cornice and storey lines
  if (y === TOP - 1) return "stone_bricks";
  if (y === 5) return front ? "red_nether_bricks" : "stone_bricks";

  if (y < 5) {
    if (front && y >= 1 && y <= 4) {
      // Apparatus bays: red glass with stone lintel and mullions
      if (x === 1 || x === 2 || x === 4 || x === 5) {
        return y === 4 ? "stone_bricks" : "red_stained_glass";
      }
      // Pilasters, with a red mullion between bays
      if (x === 0 || x === 6) return "stone_bricks";
      return "red_nether_bricks";
    }
    if (back && (x === 0 || x === 6)) return "stone_bricks";
    return "calcite";
  }

  // Upper floor: window band y 6..8, band at y 9
  if (y >= 6 && y <= 8) {
    const winFront = front && (x === 1 || x === 2 || x === 4 || x === 5);
    const winBack = back && (x === 1 || x === 2 || x === 4 || x === 5);
    const winSide = side && (z === 1 || z === 2 || z === 3);
    if (winFront || winBack || winSide) {
      if (y === 7 && ((front && x === 2) || (back && x === 4) || (side && z === 2))) {
        return "glowstone";
      }
      return "glass_pane";
    }
    if (y === 6 && (x === 0 || x === W - 1)) return "stone_bricks";
    return "calcite";
  }
  if (y === 9) return front && (x === 2 || x === 3 || x === 4) ? "red_concrete" : "stone_bricks";
  return "calcite";
}

const footprint = [];
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const inf = info.get(`${x},${z}`);
    if (!inf && info.size) continue;
    footprint.push([x, z, inf ? inf.ground : 0]);
  }
}

for (const [x, z, groundRaw] of footprint) {
  const gr = Math.min(Math.max(0, Math.round(groundRaw)), TOP - 2);
  const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (perimeter) {
    for (let y = gr; y < TOP; y++) {
      put(x, y, z, y === TOP - 1 ? "stone_bricks" : wallBlock(x, y, z));
    }
    put(x, gr, z, "stone_bricks");
  } else {
    put(x, gr, z, "smooth_stone");
    put(x, 5, z, "smooth_stone");
  }

  put(x, TOP, z, "deepslate_tiles");
}

// Pedestrian entrance on the street face, beside the left bay, with lantern above
put(3, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(3, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(3, 3, 0, "lantern");
put(3, 4, 0, "stone_bricks");

// Hose-drying tower on the rear corner, rising above the roof
const towerCells = [[5, 3], [6, 3], [5, 4], [6, 4]].filter(([x, z]) =>
  info.size === 0 || info.has(`${x},${z}`)
);
if (towerCells.length === 4) {
  for (let y = TOP + 1; y <= TOP + 4; y++) {
    for (const [x, z] of towerCells) {
      const outward = x === 6 || z === 4;
      let b = "red_nether_bricks";
      if (y === TOP + 4) b = "stone_bricks";
      if (outward && (y === TOP + 2 || y === TOP + 3)) {
        if ((x === 6 && z === 3) || (x === 5 && z === 4)) b = "glass_pane";
      }
      put(x, y, z, b);
    }
  }
  for (const [x, z] of towerCells) put(x, TOP + 5, z, "deepslate_tiles");
  put(5, TOP + 6, 3, "lantern");
}

g.save(`${DIR}/${ID}.nbt`);
