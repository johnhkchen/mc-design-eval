import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87205";
const W = 6, H = 20, D = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// lowest ground sets the storey datum; roof is a single flat level ~8 blocks above it
const grounds = cells.map(([, , gr]) => Math.max(0, Math.min(H - 6, Math.round(gr))));
const L = Math.min(...grounds);
const maxGr = Math.max(...grounds);
const R = Math.min(H - 1, Math.max(L + 8, maxGr + 4));

const DOOR_X = 2;
const bandOf = (y) => (y - L) % 3 === 0; // storey lines at L, L+3, L+6 ...

for (let i = 0; i < cells.length; i++) {
  const [x, z] = cells[i];
  const gr = grounds[i];

  // foundation solid from y 0 to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const onZFace = z === 0 || z === D - 1;
  const along = onZFace ? x : z;
  const alongLen = onZFace ? W : D;
  const perimeter = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  // pilaster columns at corners and at even bays; boarded windows in odd bays
  const pilaster = corner || (perimeter && along % 2 === 0);
  const isWindowBay = perimeter && !pilaster && along >= 1 && along <= alongLen - 2;
  const isFront = z === 0;
  const isDoorBay = isFront && x === DOOR_X;

  for (let y = gr; y <= R; y++) {
    if (!perimeter) {
      // interior: floor slabs at storey lines and roof, air between (no interiors)
      if (y === gr || bandOf(y) || y === R) put(x, y, z, "smooth_stone");
      continue;
    }

    if (y === R) {
      // parapet cap
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y === R - 1) {
      // cornice course under the cap, full width
      put(x, y, z, "stone_bricks");
      continue;
    }
    if (y === gr || (y > gr && bandOf(y))) {
      // base course and storey lines (sills/lintels)
      put(x, y, z, "stone_bricks");
      continue;
    }

    if (pilaster) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    // ground-floor door on the street face
    if (isDoorBay && y <= gr + 2) {
      put(x, y, z, "oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (isWindowBay) {
      // vacant: boarded openings, one broken pane
      const broken = x === 1 && z === D - 1 && y === gr + 4;
      if (broken) put(x, y, z, "gray_stained_glass_pane");
      else put(x, y, z, "spruce_planks");
      continue;
    }

    put(x, y, z, "red_terracotta");
  }
}

g.save(`${DIR}/${ID}.nbt`);
