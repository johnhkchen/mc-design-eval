import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001602";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 5;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) cellMap.set(key(x, z), { ground: gr, roof: rf });

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isEdge = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !cellMap.has(key(x + dx, z + dz)));

const paneProps = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Street facade: piers at the corners and every third column
const isPier = (x) => x === 0 || x === W - 1 || x % 3 === 0;

// Side walls (x = 0 or x = W-1): windows on the middle cells, piers at the ends
const isSideWindowCol = (z) => z >= 1 && z <= D - 2;

const DOOR_X = 2;
const TRIM = "terracotta";

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const c = cellMap.get(key(x, z));
  const ground = clamp(Math.round(c.ground), 0, H - 4);
  const top = clamp(Math.round(c.roof), ground + 4, H - 1);
  const exterior = isEdge(x, z);
  const street = exterior && z === 0;
  const back = exterior && z === D - 1;
  const sideWall = exterior && (x === 0 || x === W - 1) && !street && !back;

  // Foundation
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  // Ground course
  if (exterior) {
    if (street && x !== DOOR_X) put(x, ground, z, "dark_oak_planks");
    else put(x, ground, z, TRIM);
  } else {
    put(x, ground, z, "smooth_stone");
  }

  for (let y = ground + 1; y < top; y++) {
    const rel = y - ground;

    if (!exterior) {
      if (y === top - 1) put(x, y, z, "smooth_stone");
      else if (rel % 2 === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // Cornice cap
    if (y === top - 1) {
      put(x, y, z, TRIM);
      continue;
    }

    // Street shopfront with door and lit transom
    if (street && rel === 1) {
      if (x === DOOR_X) {
        put(x, y, z, "oak_door", {
          facing: "north", half: "upper", hinge: "left",
          open: "false", powered: "false",
        });
      } else if (isPier(x)) {
        put(x, y, z, "bricks");
      } else {
        put(x, y, z, "glass_pane", paneProps);
      }
      continue;
    }

    // Transom light above the door
    if (street && x === DOOR_X && rel === 2) {
      put(x, y, z, "glowstone");
      continue;
    }

    // Storey lines: brick spandrels, terracotta string course every second storey
    if (rel % 2 === 0) {
      put(x, y, z, rel % 4 === 0 ? TRIM : "bricks");
      continue;
    }

    // Window rows
    if (sideWall) {
      if (isSideWindowCol(z)) {
        put(x, y, z, "glass_pane", paneProps);
        if (rel >= 3 && (z + rel) % 4 === 0) {
          const inner = x === 0 ? 1 : W - 2;
          put(inner, y, z, "glowstone");
        }
      } else {
        put(x, y, z, "bricks");
      }
      continue;
    }

    if (isPier(x)) {
      put(x, y, z, "bricks");
    } else {
      put(x, y, z, "glass_pane", paneProps);
      if ((street || back) && rel >= 3 && (x + rel) % 5 === 0) {
        const behind = street ? 1 : D - 2;
        put(x, y, behind, "glowstone");
      }
    }
  }

  // Door lower half
  if (street && x === DOOR_X) {
    put(x, ground, z, "oak_door", {
      facing: "north", half: "lower", hinge: "left",
      open: "false", powered: "false",
    });
  }
}

// Roof housing on two cells where there is room
for (const [bx, bz] of [[4, 2], [8, 2]]) {
  const c = cellMap.get(key(bx, bz));
  if (!c) continue;
  const top = clamp(Math.round(c.roof), 0, H - 1);
  if (top + 2 > H - 1) continue;
  put(bx, top, bz, "bricks");
  put(bx, top + 1, bz, "bricks");
  put(bx, top + 2, bz, TRIM);
}

g.save(`${DIR}/${ID}.nbt`);
