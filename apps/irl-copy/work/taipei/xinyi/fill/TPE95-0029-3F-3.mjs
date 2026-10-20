import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0029-3F-3";
const W = 11, H = 71, D = 19;
const STOREY = 5;     // blocks per storey
const TIER_A = 50;    // relative height where the setback tier begins
const ROOF = 59;      // relative roof surface height (from lowest ground)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));

const G = Math.min(...ground.values());          // lowest ground: storey lines are absolute from here
const inF = (x, z) => ground.has(`${x},${z}`);
const inB = (x, z) => inF(x, z) && [-1, 0, 1].every(dx => [-1, 0, 1].every(dz => inF(x + dx, z + dz)));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };

const ringFoot = (x, z) => Object.values(DIRS).some(([dx, dz]) => !inF(x + dx, z + dz));

// Exposed faces at height y: below the setback use the footprint, above it use the upper tier.
function exposed(x, z, y) {
  const upper = y >= G + TIER_A;
  if (upper && !inB(x, z)) return [];
  const inside = upper ? inB : inF;
  return Object.keys(DIRS).filter(d => !inside(x + DIRS[d][0], z + DIRS[d][1]));
}

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

const paneProps = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Facade block for a wall cell at (x, y, z) on exposed face `face`.
function facade(x, z, y, face, g0) {
  const rel = (((y - G) % STOREY) + STOREY) % STOREY;
  const ground = y - G < STOREY;
  if (y === g0) return ["polished_granite"];                 // base course on the ground line
  if (rel === 0 || rel === 4) return ["smooth_quartz"];       // storey spandrel bands
  const alongX = face === "N" || face === "S";
  const i = alongX ? x : z;
  const max = alongX ? W - 1 : D - 1;
  const pier = i % 3 === 0 || i === 0 || i === max;
  if (pier) return [ground ? "polished_granite" : "white_concrete"];
  return ["light_blue_stained_glass_pane", paneProps(alongX)];
}

const g = new Voxels([W, H, D]);

// 1. Foundations, body, floors and caps for every footprint cell.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const g0 = gr;

  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  // Tier A body (ground line up to the setback).
  for (let y = g0; y < G + TIER_A; y++) {
    const ex = exposed(x, z, y);
    if (ex.length) {
      const [id, p] = facade(x, z, y, ex[0], g0);
      put(x, y, z, id, p);
    } else if (((y - G) % STOREY) === 0 && y > G) {
      put(x, y, z, "smooth_quartz");                          // interior floor slab per storey
    }
  }

  if (!inB(x, z)) {
    // Tier A roof: parapet slab on the ring, membrane inside.
    if (ringFoot(x, z)) put(x, G + TIER_A, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    else put(x, G + TIER_A, z, "light_gray_concrete");
    continue;
  }

  // Tier B setback body (G+50 .. G+58).
  for (let y = G + TIER_A; y < G + ROOF; y++) {
    const ex = exposed(x, z, y);
    if (ex.length) {
      const [id, p] = facade(x, z, y, ex[0], g0);
      put(x, y, z, id, p);
    } else if (((y - G) % STOREY) === 0) {
      put(x, y, z, "smooth_quartz");                          // interior floor slab
    }
  }

  // Tier B roof: coping on the ring, membrane inside.
  const ringB = exposed(x, z, G + ROOF - 1).length > 0;
  if (ringB) put(x, G + ROOF, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  else put(x, G + ROOF, z, "light_gray_concrete");
}

// 2. Warm light behind some ground-to-tower panes (glowstone just inside the glass).
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (ringFoot(x, z) === false) continue;
  for (let y = gr; y < G + TIER_A; y++) {
    if ((((y - G) % STOREY) + STOREY) % STOREY !== 2) continue;
    if (y - G < STOREY) continue;
    if ((x * 7 + z * 5 + y * 3) % 9 !== 0) continue;
    const ex = exposed(x, z, y);
    if (!ex.length) continue;
    const [dx, dz] = DIRS[OPP[ex[0]]];
    const ix = x + dx, iz = z + dz;
    if (inF(ix, iz) && !ringFoot(ix, iz)) put(ix, y, iz, "glowstone");
  }
}

// 3. Entrance on the south face: doors, canopy, hanging lanterns.
let ez = -1;
for (const key of ground.keys()) ez = Math.max(ez, Number(key.split(",")[1]));
const southX = [...ground.keys()].map(k => k.split(",").map(Number)).filter(([, z]) => z === ez).map(([x]) => x);
const ex = southX.reduce((best, x) => Math.abs(x - 5) < Math.abs(best - 5) ? x : best, southX[0]);
const eg = ground.get(`${ex},${ez}`);
put(ex, eg + 1, ez, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, eg + 2, ez, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [ex - 1, ex, ex + 1]) {
  if (inF(x, ez)) put(x, eg + 3, ez, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}
for (const x of [ex - 1, ex + 1]) {
  if (inF(x, ez)) put(x, eg + 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

// 4. Rooftop plant and spire on the setback.
for (let x = 3; x <= 5; x++) for (let z = 6; z <= 8; z++) {
  if (!inB(x, z)) continue;
  for (let y = G + ROOF + 1; y <= G + ROOF + 3; y++) put(x, y, z, "light_gray_concrete");
}
if (inB(5, 10)) {
  for (let y = G + ROOF + 1; y <= G + ROOF + 4; y++) {
    put(5, y, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
