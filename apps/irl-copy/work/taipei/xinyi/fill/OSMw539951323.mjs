import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539951323";
const W = 26, H = 23, D = 15;

// Footprint: [x, z, ground] per cell
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) => {
  if (Array.isArray(c)) return { x: c[0], z: c[1], g: Math.max(0, Math.round(c[2] ?? 0)) };
  return { x: c.x, z: c.z, g: Math.max(0, Math.round(c.ground ?? c.g ?? 0)) };
});

const ground = new Map();
for (const c of cells) ground.set(`${c.x},${c.z}`, c.g);
const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const out = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) out.set(x, y, z, id, props);
  else out.set(x, y, z, id);
};

const minZ = Math.min(...cells.map((c) => c.z));
const xsAtMinZ = cells.filter((c) => c.z === minZ).map((c) => c.x);
const midX = xsAtMinZ.length
  ? xsAtMinZ.reduce((a, b) => a + b, 0) / xsAtMinZ.length
  : Math.floor(W / 2);
const doorX = xsAtMinZ.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), xsAtMinZ[0]);

// Pass 1: foundation, floor slabs, base course
for (const { x, z, g } of cells) {
  const N = !inside(x, z - 1), S = !inside(x, z + 1), E = !inside(x + 1, z), Wd = !inside(x - 1, z);
  const edge = N || S || E || Wd;
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  put(x, g, z, edge ? "polished_granite" : "light_gray_concrete");
  put(x, g + 5, z, "light_gray_concrete");
  put(x, g + 10, z, edge ? "smooth_quartz" : "light_gray_concrete");
}

// Pass 2: perimeter walls, windows, door, parapet, lights
for (const { x, z, g } of cells) {
  const N = !inside(x, z - 1), S = !inside(x, z + 1), E = !inside(x + 1, z), Wd = !inside(x - 1, z);
  const edge = N || S || E || Wd;
  if (!edge) continue;

  const corner = (N || S) && (E || Wd);
  const onZFace = N || S;
  const idx = onZFace ? x : z;
  const pillar = corner || idx % 3 === 0;

  // Inward offset for interior lights
  let ix = 0, iz = 0;
  if (N) iz = 1; else if (S) iz = -1;
  else if (Wd) ix = 1; else if (E) ix = -1;

  // Ground storey (g+1..g+4): shopfront
  for (let y = g + 1; y <= g + 4; y++) {
    let id = "white_concrete";
    if (pillar) id = "smooth_quartz";
    else if (y <= g + 3) id = "light_blue_stained_glass";
    else id = "smooth_quartz"; // lintel band
    put(x, y, z, id);
  }
  // Ground storey lights: hanging lantern from g+5 slab behind a window
  if (!corner && !pillar && idx % 4 === 2 && !(N && x === doorX)) {
    const lx = x + ix, lz = z + iz;
    if (inside(lx, lz)) put(lx, g + 4, lz, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Upper storey (g+6..g+9): offices / residential windows
  for (let y = g + 6; y <= g + 9; y++) {
    let id;
    if (pillar) id = "smooth_quartz";
    else if (y === g + 6 || y === g + 9) id = "white_concrete"; // spandrels
    else id = "light_blue_stained_glass";
    put(x, y, z, id);
  }
  if (!corner && !pillar && idx % 6 === 2) {
    const lx = x + ix, lz = z + iz;
    if (inside(lx, lz)) put(lx, g + 9, lz, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Parapet: wall at g+10 handled in pass 1, cap slab at g+11
  put(x, g + 11, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Entrance on the north (minZ) face, centre cell
  if (N && x === doorX) {
    put(x, g + 1, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, g + 2, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, g + 3, z, "smooth_quartz");
    put(x, g + 4, z, "smooth_quartz");
  }
}

// Pass 3: roof equipment on the interior of the roof deck
for (const { x, z, g } of cells) {
  const inner = inside(x + 1, z) && inside(x - 1, z) && inside(x, z + 1) && inside(x, z - 1);
  if (inner && x % 7 === 3 && z % 5 === 2) {
    put(x, g + 11, z, "gray_concrete");
    put(x + 1, g + 11, z, "gray_concrete");
  }
}

out.save(`${DIR}/${ID}.nbt`);
