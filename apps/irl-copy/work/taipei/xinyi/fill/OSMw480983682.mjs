import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw480983682";
const W = 30, H = 52, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

// Late-1990s/2000s Xinyi office-tower massing: 6-storey base ring, 7-storey crown, 8-storey core (roof ~40).
const topOf = (x, z) => {
  if (x >= 8 && x <= 21 && z >= 6 && z <= 14) return 40;
  if (x >= 3 && x <= 26 && z >= 3 && z <= 17) return 35;
  return 30;
};

const FACES = [["N", 0, -1], ["S", 0, 1], ["E", 1, 0], ["W", -1, 0]];
const INWARD = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };

// Faces of (x,z) whose neighbour is missing or lower than height y (so the wall is exposed).
const exposed = (x, y, z) =>
  FACES.filter(([, dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return !has(nx, nz) || y > topOf(nx, nz);
  }).map(([f]) => f);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

function facade(x, y, z, F, gr0) {
  const face = F[0];
  const corner = F.length > 1;
  const t = face === "N" || face === "S" ? x : z;
  const s = Math.floor(y / 5);
  const r = y % 5;

  if (y === gr0) return { b: "polished_granite" };

  // Ground-floor entrance on the south face (lobby with centre door, lintel above)
  if (s === 0 && face === "S" && t >= 12 && t <= 16 && y <= gr0 + 3) {
    if (y === gr0 + 3) return { b: "smooth_quartz" };
    if (t === 14) {
      const half = y === gr0 + 1 ? "lower" : "upper";
      return { b: "dark_oak_door", p: { facing: "south", half, hinge: "left", open: "false", powered: "false" } };
    }
    return { b: "light_blue_stained_glass" };
  }

  if (r === 0 || r === 4) return { b: "white_concrete" }; // spandrels / floor lines
  if (corner || t % 3 === 0) return { b: "light_gray_concrete" }; // piers and mullions
  return { b: "light_blue_stained_glass", glazing: true };
}

const g = new Voxels([W, H, D]);

for (const [x, z, gr0] of cells) {
  const T = topOf(x, z);

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr0; y++) put(x, y, z, "stone_bricks");

  // Storeys
  for (let y = gr0; y < T; y++) {
    const F = exposed(x, y, z);
    if (!F.length) {
      // Interior: floor slabs only, air between (no interiors)
      if (y === gr0 || y % 5 === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }
    const f = facade(x, y, z, F, gr0);
    if (f.p) put(x, y, z, f.b, f.p);
    else put(x, y, z, f.b);

    // Warm light: glowstone on the inside of some glazed bays
    if (f.glazing && y % 5 === 2) {
      const t = F[0] === "N" || F[0] === "S" ? x : z;
      const s = Math.floor(y / 5);
      if ((t + s) % 5 === 0 && F.length === 1) {
        const [dx, dz] = INWARD[F[0]];
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && exposed(ix, y, iz).length === 0 && y < topOf(ix, iz)) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Roof cap / cornice
  put(x, T, z, "smooth_quartz");

  // Parapet on the outer edge
  const edge = FACES.some(([, dx, dz]) => !has(x + dx, z + dz));
  if (edge) {
    put(x, T + 1, z, "white_concrete");
    put(x, T + 2, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  }
}

// Roof plant on the core
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (topOf(x, z) !== 40) continue;
  if (x === 15 && z === 10) continue;
  if (x % 4 === 1 && z % 3 === 1) {
    put(x, 41, z, "light_gray_concrete");
    put(x, 42, z, "light_gray_concrete");
  }
}

// Antenna mast on the core
if (has(15, 10) && topOf(15, 10) === 40) {
  for (let y = 41; y <= 49; y++) put(15, y, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
