import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001477";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, HV = 19, D = 20;
const YMAX = 18;
const g = new Voxels([W, HV, D]);

const at = new Map();
for (const [x, z, gr, rf] of cells) {
  at.set(`${x},${z}`, { ground: Math.max(0, Math.round(gr)), roof: Math.round(rf) });
}
const has = (x, z) => at.has(`${x},${z}`);
const info = (x, z) => at.get(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y > YMAX) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// One flat roof level from the lidar median, never below 5 blocks over any cell's own ground
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const roofMed = roofs[Math.floor(roofs.length / 2)];
const grounds = cells.map(c => Math.round(c[2]));
const baseGround = Math.min(...grounds);
const ROOF_LEVEL = Math.min(16, baseGround + roofMed);

const WIN_PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const WIN_PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const DOOR_X = 9;

for (const [x, z] of [...at.keys()].map(k => k.split(",").map(Number))) {
  const { ground: gr } = info(x, z);
  const T = Math.max(gr + 5, ROOF_LEVEL);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perimeter = !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

  if (perimeter) {
    let along, paneP, zFace = null;
    if (z === 0 || z === D - 1) { along = x; paneP = WIN_PANE_Z; zFace = z === 0 ? "north" : "south"; }
    else { along = z; paneP = WIN_PANE_X; }
    const isDoorCell = z === 0 && x === DOOR_X;
    const isLintelZone = z === 0 && x >= DOOR_X - 1 && x <= DOOR_X + 1;
    const bay = (along % 4 === 1 || along % 4 === 2);

    for (let y = gr; y < T; y++) {
      const rel = y - gr;
      const top = (y === T - 1);

      // Entrance: stone surround, door, and a lintel with a lantern over it
      if (isLintelZone && rel <= 3) {
        if (isDoorCell && (rel === 1 || rel === 2)) {
          put(x, y, z, "oak_door", {
            facing: "north",
            half: rel === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (rel === 3) {
          put(x, y, z, "stone_bricks");
        } else if (rel === 0) {
          put(x, y, z, "stone_bricks");
        } else {
          // jambs beside the door at rel 1 and 2
          put(x, y, z, "stone_bricks");
        }
        continue;
      }

      if (rel === 0) { put(x, y, z, "stone_bricks"); continue; }
      if (top) { put(x, y, z, "smooth_stone"); continue; }
      if (rel % 2 === 0) { put(x, y, z, "smooth_stone"); continue; }

      if (bay) {
        put(x, y, z, "glass_pane", paneP);
        if (along % 8 === 1 && (rel === 1 || rel === 3)) {
          if (zFace === "north" && has(x, 1)) put(x, y, 1, "glowstone");
          else if (zFace === "south" && has(x, D - 2)) put(x, y, D - 2, "glowstone");
          else if (!zFace && x === 0 && has(1, z)) put(1, y, z, "glowstone");
          else if (!zFace && x === W - 1 && has(W - 2, z)) put(W - 2, y, z, "glowstone");
        }
      } else {
        put(x, y, z, "bricks");
      }
    }

    // Solid stone parapet (replaces thin wall posts)
    put(x, T, z, "stone_bricks");
  } else {
    // Interior: floor slabs per storey and a roof deck, air between (no interiors)
    for (let rel = 0; rel < T - gr - 1; rel += 2) put(x, gr + rel, z, "smooth_stone");
    put(x, T - 1, z, "smooth_stone");
  }

  // Roof equipment on the deck of interior cells
  if (!perimeter) {
    if ((x + z) % 7 === 0 && x > 2 && x < W - 3 && z > 2 && z < D - 3) {
      put(x, T, z, "light_gray_concrete");
      put(x, T + 1, z, "light_gray_concrete");
    }
    if (x === 10 && z === 10) {
      for (let k = 0; k < 3; k++) put(x, T + k, z, "iron_bars");
      put(x, T + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
