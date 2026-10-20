import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682861";
const W = 14, H = 23, D = 11;

// Footprint: [x, z, ground] per cell (x 0..13, z 0..10)
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.floor(gr));

const L = Math.min(...ground.values());          // storey datum = lowest ground under the footprint
const PARAPET_Y = L + 11;                        // roof about 11 blocks above lowest ground

const vx = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vx.set(x, y, z, id, props);
  else vx.set(x, y, z, id);
};

const inside = (x, z) => ground.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIR_NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const outDirs = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));

// Entrance: middle of the north (z-min) facade, else any facade cell
let entKey = null, entDir = null;
{
  let cand = [];
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (outDirs(x, z).some(([dx, dz]) => dx === 0 && dz === -1)) cand.push([x, z]);
  }
  if (cand.length === 0) {
    for (const k of ground.keys()) {
      const [x, z] = k.split(",").map(Number);
      const o = outDirs(x, z);
      if (o.length) { cand.push([x, z]); break; }
    }
  } else {
    cand.sort((a, b) => a[0] - b[0]);
    cand = [cand[Math.floor(cand.length / 2)]];
    entDir = [0, -1];
  }
  if (cand.length) {
    const [x, z] = cand[0];
    entKey = `${x},${z}`;
    if (!entDir) entDir = outDirs(x, z)[0];
  }
}

for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number);
  const out = outDirs(x, z);
  const isFacade = out.length > 0;
  const isEnt = key === entKey;
  const idx = x + z;

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  put(x, g, z, "smooth_stone");

  // Floor slabs at storey lines and roof slab (all cells)
  for (const y of [L + 5, L + 10]) if (y > g) put(x, y, z, "light_gray_concrete");

  // Ground storey (commercial shopfront)
  if (isFacade) {
    const [dx, dz] = out[0];
    const paneProps = dz !== 0
      ? { north: "true", south: "true", east: "false", west: "false" }
      : { north: "false", south: "false", east: "true", west: "true" };
    for (let y = L + 1; y <= L + 4; y++) {
      if (y <= g) continue;
      if (isEnt && (y === g + 1 || y === g + 2) && y <= L + 4 && entDir) {
        const face = DIR_NAME[`${entDir[0]},${entDir[1]}`];
        const lower = y === g + 1;
        put(x, y, z, "dark_oak_door", {
          facing: face, half: lower ? "lower" : "upper", hinge: "left",
          open: "false", powered: "false"
        });
        continue;
      }
      if (y === L + 4) put(x, y, z, "light_gray_concrete");
      else if (idx % 3 === 0) put(x, y, z, "white_concrete");
      else if (y === L + 1) put(x, y, z, "black_concrete");
      else put(x, y, z, "glass_pane", paneProps);
    }
  }

  // Upper storey (offices / residential-style windows)
  for (let y = L + 6; y <= L + 9; y++) {
    if (y <= g) continue;
    if (!isFacade) continue;
    const [dx, dz] = out[0];
    const paneProps = dz !== 0
      ? { north: "true", south: "true", east: "false", west: "false" }
      : { north: "false", south: "false", east: "true", west: "true" };
    if (idx % 3 === 0) put(x, y, z, "white_concrete");
    else if (y === L + 6 || y === L + 9) put(x, y, z, "light_gray_concrete");
    else {
      put(x, y, z, "glass_pane", paneProps);
      // warm light behind a few windows (interior cell one step inward)
      if (y === L + 7 && (x * 5 + z * 3) % 7 === 0) {
        const ix = x - dx, iz = z - dz;
        if (inside(ix, iz) && ground.get(`${ix},${iz}`) < L + 7) {
          put(ix, L + 7, iz, "glowstone");
        }
      }
    }
  }

  // Parapet on the facade, roof slab and equipment
  if (isFacade && PARAPET_Y > g) put(x, PARAPET_Y, z, "white_concrete");
  if (!isFacade && (x % 5 === 2) && (z % 5 === 2) && PARAPET_Y > g) {
    put(x, PARAPET_Y, z, "iron_block");
  }
}

vx.save(`${DIR}/${ID}.nbt`);
