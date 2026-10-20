import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167426";
const W = 14, H = 38, D = 15;
const ROOF = 26;      // roof slab height (about 26 blocks above lowest ground)
const PARAPET = 27;   // parapet course on the roof edge
const PENT_Y0 = 27, PENT_Y1 = 29;
const BANDS = [1, 6, 11, 16, 21]; // storey lines, 5 blocks per storey

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? Object.values(raw));
const foot = new Map();
for (const c of list) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  foot.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 2, Math.round(gr ?? 0))));
}
const has = (x, z) => foot.has(`${x},${z}`);

const DIRS = {
  north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0],
};
const edgeDirs = (x, z) =>
  Object.keys(DIRS).filter(k => !has(x + DIRS[k][0], z + DIRS[k][1]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Choose entrance: non-corner edge cell on ground storey, facing north preferred, nearest centre.
const CX = Math.floor(W / 2);
let doorCell = null;
{
  let best = Infinity;
  for (const [key, gr] of foot) {
    const [x, z] = key.split(",").map(Number);
    const e = edgeDirs(x, z);
    if (e.length !== 1 || gr > 1) continue;
    const dir = e[0];
    const t = dir === "north" || dir === "south" ? x : z;
    const score = (dir === "north" ? 0 : 100) + Math.abs(t - (dir === "north" || dir === "south" ? CX : Math.floor(D / 2)));
    if (score < best) { best = score; doorCell = { x, z, dir }; }
  }
}

// Pier / window / spandrel logic for a wall cell at height y.
function facade(x, z, y, dir, gr) {
  if (y === ROOF) return ["white_concrete"];
  if (y < 1) return ["stone_bricks"];
  const b = 1 + 5 * Math.floor((y - 1) / 5);
  const r = y - b;
  if (r === 0) return ["smooth_stone"];
  if (r === 4) return ["light_gray_concrete"];
  const alongNS = dir === "north" || dir === "south";
  const t = alongNS ? x : z;
  const pier = t % 3 === 0;
  if (pier) return ["white_concrete"];
  // Entrance doors on the ground storey.
  if (b === 1 && doorCell && doorCell.x === x && doorCell.z === z && (r === 1 || r === 2)) {
    const hingeProps = { facing: dir, hinge: "left", open: "false", powered: "false" };
    return [r === 1 ? "iron_door" : "iron_door", {
      ...hingeProps, half: r === 1 ? "lower" : "upper",
    }];
  }
  // Glass pane window, connected along the wall to neighbouring wall cells.
  const pn = (dx, dz) => (has(x + dx, z + dz) ? "true" : "false");
  const props = alongNS
    ? { north: "false", south: "false", east: pn(1, 0), west: pn(-1, 0), waterlogged: "false" }
    : { north: pn(0, -1), south: pn(0, 1), east: "false", west: "false", waterlogged: "false" };
  return ["light_blue_stained_glass_pane", props];
}

for (const [key, gr] of foot) {
  const [x, z] = key.split(",").map(Number);
  const edge = edgeDirs(x, z);
  const isEdge = edge.length > 0;

  // Foundation / plinth fill up to this cell's ground (and a basement slab at y 0).
  for (let y = 0; y < Math.max(gr, 1); y++) put(x, y, z, "stone_bricks");

  if (isEdge) {
    const corner = edge.length >= 2;
    const dir = edge[0];
    for (let y = gr; y <= ROOF; y++) {
      if (y < 1) { put(x, y, z, "stone_bricks"); continue; }
      if (corner && y !== ROOF && y % 5 !== 1 && y % 5 !== 0) {
        put(x, y, z, "white_concrete");
        continue;
      }
      const [id, p] = corner && y !== ROOF
        ? ["white_concrete", undefined]
        : facade(x, z, y, dir, gr);
      put(x, y, z, id, p);

      // Warm light behind some windows, in the interior cell just inside the glass.
      if (!corner && y !== ROOF && id === "light_blue_stained_glass_pane") {
        const b = 1 + 5 * Math.floor((y - 1) / 5);
        const r = y - b;
        const alongNS = dir === "north" || dir === "south";
        const t = alongNS ? x : z;
        if (r === 2 && ((t + b) % 4 === 0)) {
          const [dx, dz] = DIRS[dir];
          const ix = x - dx, iz = z - dz;
          if (has(ix, iz) && edgeDirs(ix, iz).length === 0) {
            put(ix, y, iz, "glowstone");
          }
        }
      }
    }
    // Parapet course on the roof edge.
    put(x, PARAPET, z, "white_concrete");
  } else {
    // Interior: floor slabs at each storey line, roof slab at the top.
    for (const b of BANDS) {
      if (gr <= b) put(x, b, z, "smooth_stone");
    }
    if (gr <= ROOF) put(x, ROOF, z, "light_gray_concrete");

    // Roof plant room, a solid box on the roof.
    if (x >= 4 && x <= 9 && z >= 4 && z <= 9) {
      for (let y = PENT_Y0; y < PENT_Y1; y++) put(x, y, z, "light_gray_concrete");
      put(x, PENT_Y1, z, "smooth_stone");
    }
  }
}

// Antenna mast on the plant room.
if (has(6, 7) && edgeDirs(6, 7).length === 0) {
  for (let y = 30; y <= 35; y++) {
    put(6, y, 7, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
  put(6, 36, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
