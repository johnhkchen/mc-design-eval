import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/TPE111-1688-30F.cells.json`, "utf8"));

const W = 72, H = 23, D = 107;
const FLOOR = 5;   // storey line / upper floor slab
const ROOF = 10;   // top roof course (surface at y=11, matching lidar height)

const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isBoundary = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// North-facing envelope cells (z minimum edge, not corners), sorted by x.
const northRun = [];
for (const [x, z] of cells) {
  if (!has(x, z - 1) && has(x - 1, z) && has(x + 1, z)) northRun.push(x);
}
northRun.sort((a, b) => a - b);
const ENTRANCE_X = northRun.length ? northRun[Math.floor(northRun.length / 2)] : -1;

for (const [x, z, gr] of cells) {
  // Foundation from y=0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  const mN = !has(x, z - 1);
  const mS = !has(x, z + 1);
  const mW = !has(x - 1, z);
  const mE = !has(x + 1, z);
  const boundary = mN || mS || mW || mE;
  const missing = [mN, mS, mW, mE].filter(Boolean).length;

  if (!boundary) {
    // Interior: storey slab, roof slab, open air between
    if (gr <= FLOOR) put(x, FLOOR, z, "smooth_stone");
    if (gr <= ROOF) {
      put(x, ROOF, z, "smooth_quartz");
      // Fewer, larger plant rooms, two courses high
      if (x % 16 >= 4 && x % 16 <= 11 && z % 20 >= 6 && z % 20 <= 13) {
        for (let y = ROOF + 1; y <= ROOF + 2; y++) put(x, y, z, "light_gray_concrete");
      }
    }
    continue;
  }

  // Envelope ring
  const corner = missing >= 2;
  const onNS = mN || mS;
  const u = onNS ? x : z;
  const pier = corner || (u % 4 === 0);
  const pilaster = !corner && u % 8 === 0;
  const northEntrance = mN && !corner && x === ENTRANCE_X;

  for (let y = gr; y <= ROOF; y++) {
    if (y >= H) break;
    if (y === ROOF) {
      put(x, y, z, "quartz_block");
    } else if (y === FLOOR && FLOOR >= gr) {
      // Spandrel band, alternating for rhythm
      put(x, y, z, u % 8 < 4 ? "light_gray_concrete" : "gray_concrete");
    } else if (y === gr) {
      put(x, y, z, "polished_granite");
    } else if (northEntrance && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (northEntrance && y === gr + 3) {
      put(x, y, z, "smooth_stone");
    } else if (pilaster && y > gr && y < ROOF) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else if (pier) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Parapet course on the roof edge
  if (ROOF + 1 < H) put(x, ROOF + 1, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });

  // Hanging lantern inside the entrance lintel
  if (northEntrance && gr + 3 <= ROOF) {
    const iz = z + 1;
    if (has(x, iz) && !isBoundary(x, iz)) {
      put(x, gr + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }

  // Warm light behind selected window bays, only where the inward cell is interior
  if (!pier && !northEntrance && gr <= 7 && u % 8 === 2) {
    let ix = x, iz = z;
    if (mN) iz = z + 1;
    else if (mS) iz = z - 1;
    else if (mW) ix = x + 1;
    else if (mE) ix = x - 1;
    if (has(ix, iz) && !isBoundary(ix, iz)) put(ix, 7, iz, "glowstone");
  }
}

g.save(`${dir}/TPE111-1688-30F.nbt`);
