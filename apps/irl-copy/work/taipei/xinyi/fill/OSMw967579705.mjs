import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw967579705";
const W = 27, H = 23, D = 17;

// Footprint: [x, z, ground] per cell (tolerates an object form too).
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const G = new Map();
for (const c of list) {
  const x = Array.isArray(c) ? c[0] : c.x;
  const z = Array.isArray(c) ? c[1] : c.z;
  const gr = Array.isArray(c) ? c[2] : (c.ground ?? c.g);
  G.set(`${x},${z}`, gr);
}
const has = (x, z) => G.has(`${x},${z}`);
const xs = [...G.keys()].map(k => +k.split(",")[0]);
const zs = [...G.keys()].map(k => +k.split(",")[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const Y0 = Math.min(...G.values());

// Roof: about 11 blocks above the lowest ground (top index Y0+10), 2 storeys of ~5.
const R = Math.min(H - 1, Y0 + 10);

const FACES = {
  N: { dx: 0, dz: -1, inward: [0, 1] },
  S: { dx: 0, dz: 1, inward: [0, -1] },
  W: { dx: -1, dz: 0, inward: [1, 0] },
  E: { dx: 1, dz: 0, inward: [-1, 0] },
};
const exposed = (x, z) =>
  Object.keys(FACES).filter(k => !has(x + FACES[k].dx, z + FACES[k].dz));

// Front (north, z min) door, centred on a pier-free bay.
const cx = Math.floor((minX + maxX) / 2);
let doorX = minX + 3 * Math.floor((cx - minX) / 3) + 1;
if (!has(doorX, minZ)) doorX = null;

const g = new Voxels([W, H, D]);
const put = (x, y, z, name, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

// Ground-floor glazing and upper glazing colours differ slightly for reading.
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const dirs = exposed(x, z);

  // Interior cells: floor slab per storey and roof deck; air otherwise.
  if (dirs.length === 0) {
    if (gr + 5 < R) put(x, gr + 5, z, "smooth_stone");
    if (R - 1 >= gr + 6) put(x, R - 1, z, "gray_concrete");
    continue;
  }

  // Edge cells: facade.
  const corner = dirs.length > 1;
  const d = dirs[0];
  const along = d === "N" || d === "S";
  const i = corner ? 0 : (along ? x - minX : z - minZ);
  const L = along ? maxX - minX + 1 : maxZ - minZ + 1;
  const pier = corner || i % 3 === 0 || i === L - 1;
  const isDoor = !corner && d === "N" && z === minZ && x === doorX;

  const wall = (y, name, props) => { if (y <= R) put(x, y, z, name, props); };

  // Plinth course at ground.
  wall(gr, "polished_andesite");

  if (isDoor) {
    const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
    wall(gr, "dark_oak_door", door("lower"));
    wall(gr + 1, "dark_oak_door", door("upper"));
    wall(gr + 2, "white_concrete");
    wall(gr + 3, "cyan_stained_glass");
  } else {
    for (let y = gr + 1; y <= gr + 3; y++) {
      wall(y, pier ? "white_concrete" : "cyan_stained_glass");
    }
  }

  // Fascia and storey line.
  wall(gr + 4, "light_gray_concrete");
  wall(gr + 5, "light_gray_concrete");

  // Upper storey glazing with warm lights behind some panes.
  for (let y = gr + 6; y <= gr + 8; y++) {
    wall(y, pier ? "white_concrete" : "light_blue_stained_glass");
  }
  if (!pier && (i + gr) % 4 === 0 && !corner) {
    const [ox, oz] = FACES[d].inward;
    const ix = x + ox, iz = z + oz;
    if (has(ix, iz) && gr + 7 <= R) put(ix, gr + 7, iz, "glowstone");
  }

  // Cornice band and parapet cap.
  wall(gr + 9, "light_gray_concrete");
  if (R >= gr) put(x, R, z, "stone_bricks");
}

// Roof equipment: a few condenser units on the deck of the top-level interior.
for (const [key, gr] of G) {
  if (gr !== Y0) continue;
  const [x, z] = key.split(",").map(Number);
  if (exposed(x, z).length) continue;
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  const ok = quad.every(([a, b]) => has(a, b) && exposed(a, b).length === 0);
  if (ok && (x - minX) % 7 === 3 && (z - minZ) % 6 === 2 && R + 1 < H) {
    for (const [a, b] of quad) put(a, R, b, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
