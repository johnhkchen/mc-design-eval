import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541376805";
const W = 13, D = 18, H = 23;
const ROOF = 11;   // top of parapet (about 11 blocks above lowest ground)

// Load footprint cells: [x, z, ground]
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const lo = Math.min(...raw.map(c => c[2]));
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(12, Math.round(gr - lo))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };
function exposedFaces(x, z) {
  const out = [];
  for (const [n, [dx, dz]] of Object.entries(DIRS)) if (!has(x + dx, z + dz)) out.push(n);
  return out;
}

// Single front door on the north (z-min) street face, nearest the middle of the facade
const northCells = [...ground.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([x, z]) => exposedFaces(x, z).includes("north") && gAt(x, z) + 2 <= 4);
northCells.sort((a, b) => Math.abs(a[0] - 6) - Math.abs(b[0] - 6));
const doorCell = northCells.length ? { x: northCells[0][0], z: northCells[0][1] } : null;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const faces = exposedFaces(x, z);
  const exposed = faces.length > 0;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab at storey line 2 and roof deck, on every footprint cell
  put(x, 5, z, "smooth_stone");
  put(x, 10, z, "smooth_stone");

  if (!exposed) {
    // Rooftop mechanical plant standing on the deck
    if (x % 4 === 2 && z % 5 === 2) {
      put(x, 11, z, "light_gray_concrete");
      put(x, 12, z, "light_gray_concrete");
    }
    continue;
  }

  // Primary street-facing face (north is first in order, so door cell uses north)
  const f = faces[0];
  const horiz = f === "north" || f === "south";
  const idx = horiz ? x : z;
  const isWin = idx % 2 === 1;
  const [ix, iz] = [x + INWARD[f][0], z + INWARD[f][1]];
  const innerOK = has(ix, iz) && exposedFaces(ix, iz).length === 0;
  const gi = innerOK ? gAt(ix, iz) : 0;
  const paneProps = horiz
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;

  for (let y = gr; y <= ROOF; y++) {
    if (y === gr) {
      put(x, y, z, "polished_andesite");                // base course
    } else if (y <= 4) {
      if (y <= gr + 2) {                                 // shopfront band
        if (isDoor && y <= gr + 2 && y >= gr + 1) {
          const upper = y === gr + 2;
          put(x, y, z, "dark_oak_door", {
            facing: "north", half: upper ? "upper" : "lower", hinge: "left",
            open: "false", powered: "false"
          });
        } else if (isWin) {
          put(x, y, z, "light_blue_stained_glass_pane", paneProps);
        } else {
          put(x, y, z, "stone_bricks");                  // pier between shop windows
        }
      } else {
        put(x, y, z, "white_terracotta");                // spandrel above shopfront
      }
    } else if (y === 5) {
      put(x, y, z, "stone_bricks");                      // storey line
    } else if (y >= 6 && y <= 9) {
      if (y === 6 || y === 9 || !isWin) {
        put(x, y, z, "white_terracotta");                // spandrel / mullion
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      }
    } else if (y === 10) {
      put(x, y, z, "stone_bricks");                      // cornice
    } else if (y === ROOF) {
      put(x, y, z, "white_terracotta");                  // parapet
    }
  }

  // Warm light set back behind glass (air gap inside, only where the inner cell is interior)
  if (innerOK) {
    if (isWin && idx % 4 === 1 && gr + 1 <= 4 && gi <= 4) {
      put(ix, 7, iz, "shroomlight");
    }
    if (isWin && idx % 3 === 1 && gi <= 4) {
      put(ix, gi, iz, "lantern");
    }
  }
  if (isDoor && innerOK && gi <= 4) {
    put(ix, gi, iz, "lantern");
  }
}

g.save(`${DIR}/${ID}.nbt`);
