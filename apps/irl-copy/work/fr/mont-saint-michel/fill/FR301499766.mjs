import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499766.cells.json", "utf8"));

const H = 26;
const W = 11, D = 11;
const g = new Voxels([W, H, D]);

const STONE = "stone_bricks";
const BASE = "mossy_stone_bricks";
const COURSE = "chiseled_stone_bricks";
const CORNER = "polished_andesite";
const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const clampY = (y) => Math.max(0, Math.min(H - 1, y));
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };

const byXZ = new Map();
for (const c of cells) byXZ.set(`${c[0]},${c[1]}`, c);

// One storey datum and one roof height for the whole tower (smooths lidar noise)
const B = median(cells.map((c) => Math.round(c[2])));
const T = Math.min(H - 2, Math.max(median(cells.map((c) => Math.round(c[3]))), B + 10));

// Pass 1: massing
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = byXZ.get(`${x},${z}`);
    if (!c) continue;
    const gr = Math.round(c[2]);
    const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
    const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

    // Foundation up to this cell's ground
    for (let y = 0; y < gr; y++) g.set(x, clampY(y), z, STONE);

    if (edge) {
      for (let y = gr; y <= T - 2; y++) {
        let b;
        if (y - B < 2) b = BASE;
        else if (corner) b = CORNER;
        else if ((y - B) % 5 === 0) b = COURSE;
        else b = STONE;
        g.set(x, clampY(y), z, b);
      }
    } else {
      // Interior: floor slabs on the shared storey datum, so they line up across cells
      for (let y = gr; y <= T - 2; y++) {
        if (y >= B && (y - B) % 5 === 0) g.set(x, clampY(y), z, STONE);
      }
    }

    // Continuous roof deck
    g.set(x, clampY(T - 1), z, STONE);

    // Crenellated parapet
    if (edge && (corner || (x + z) % 2 === 0)) g.set(x, clampY(T), z, STONE);
  }
}

// Pass 2: windows, lights, entrance
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    const c = byXZ.get(`${x},${z}`);
    if (!c) continue;
    const gr = Math.round(c[2]);
    const onZFace = (z === 0 || z === D - 1) && x === 5;
    const onXFace = (x === 0 || x === W - 1) && z === 5;
    if (!(onZFace || onXFace)) continue;
    if (onZFace && z === 0 && x === 5) continue; // entrance cell handled below

    const pane = onZFace ? GLASS_EW : GLASS_NS;
    const dx = x === 0 ? 1 : x === W - 1 ? -1 : 0;
    const dz = z === 0 ? 1 : z === D - 1 ? -1 : 0;

    for (const wy of [B + 2, B + 7, B + 12]) {
      if (wy < gr || wy + 1 > T - 2) continue;
      g.set(x, wy, z, "glass_pane", pane);
      g.set(x, wy + 1, z, "glass_pane", pane);
      if (wy === B + 2) g.set(x + dx, wy, z + dz, "glowstone");
    }
  }
}

// Entrance on the south face (z = 0), centred, with a stone surround
const dc = byXZ.get("5,0");
if (dc) {
  const gr = Math.round(dc[2]);
  g.set(5, clampY(gr), 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(5, clampY(gr + 1), 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(4, clampY(gr + 2), 0, STONE);
  g.set(6, clampY(gr + 2), 0, STONE);
  g.set(5, clampY(gr + 2), 0, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499766.nbt");
