import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499713";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));
const cells = raw.map(([x, z, g, r]) => ({ x, z, g: g - minG, r: r - minG }));

const key = (x, z) => `${x},${z}`;
const fp = new Set(cells.map((c) => key(c.x, c.z)));
const has = (x, z) => fp.has(key(x, z));

// Building-wide flat massing from the lidar roof record
const meanR = cells.reduce((s, c) => s + c.r, 0) / cells.length;
const top = Math.min(22, Math.max(10, Math.round(meanR)));
const maxG = Math.max(...cells.map((c) => c.g));
const wallTop = Math.max(top - 2, maxG + 7);

// Storey lines (3 storeys) measured from base y 0
const b = [0, 1, 2, 3].map((k) => Math.round((k * wallTop) / 3));
b[3] = wallTop;

const W = 6, H = 25, D = 6;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const c of cells) {
  const { x, z } = c;
  // Foundation up to this cell's ground
  for (let y = 0; y < c.g; y++) put(x, y, z, "stone");

  const exposedN = !has(x, z - 1);
  const exposedS = !has(x, z + 1);
  const exposedW = !has(x - 1, z);
  const exposedE = !has(x + 1, z);
  const exterior = exposedN || exposedS || exposedW || exposedE;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const onWE = (x === 0 || x === W - 1) && !corner;
  const onNS = (z === 0 || z === D - 1) && !corner;
  const edgeIdx = onWE ? z : onNS ? x : -1;
  const windowable = exterior && !corner && (edgeIdx === 1 || edgeIdx === 4);
  const isSouthEntrance = exposedS && x === 2 && z === D - 1;
  const isDoorPilaster = exposedS && (x === 1 || x === 3) && z === D - 1;

  for (let y = c.g; y < wallTop; y++) {
    // storey index
    let s = 0;
    for (let k = 0; k < 3; k++) if (y >= b[k]) s = k;
    const floorY = b[s];
    const nextY = b[s + 1];

    // Entrance door on south face, ground storey
    if (isSouthEntrance && s === 0 && (y === c.g || y === c.g + 1)) {
      if (y === c.g) {
        put(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else {
        put(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      }
      continue;
    }

    // Chiseled pilasters flanking the door, ground storey
    if (isDoorPilaster && s === 0) {
      put(x, y, z, "chiseled_stone_bricks");
      continue;
    }

    // Cornice course under the roof on exterior cells
    if (exterior && y === wallTop - 1) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    // Storey floor bands
    if (exterior && y === floorY && (s === 1 || s === 2 || y === 0)) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    // Quoins at the building corners
    if (exterior && corner) {
      put(x, y, z, "chiseled_stone_bricks");
      continue;
    }

    if (windowable) {
      if (y === nextY - 1 || y === floorY) {
        put(x, y, z, "stone_bricks");
        continue;
      }
      if (y > floorY && y < nextY - 1) {
        const lit = (s === 0 || s === 2) && (x + z + s) % 2 === 0 && y === floorY + 2;
        put(x, y, z, lit ? "glowstone" : "white_stained_glass_pane");
        continue;
      }
    }

    put(x, y, z, "stone_bricks");
  }

  // Roof: mansard-style stepped cap, flat tiers each standing on the one below
  put(x, wallTop, z, "deepslate_tiles");
  if (x >= 1 && x <= W - 2 && z >= 1 && z <= D - 2) {
    put(x, wallTop + 1, z, "deepslate_tiles");
  }
}

// Chimney on the roof cap
if (has(2, 2)) {
  put(2, top, 2, "stone_bricks");
  put(2, top + 1, 2, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
