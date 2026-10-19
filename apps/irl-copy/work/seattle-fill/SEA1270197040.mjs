// SEA1270197040: Seattle Center long low civic exhibition/events hall (1961). Footprint from the manifest, box [165,102]..
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const ID = "SEA1270197040", BOX = [165, 102, 227, 119], H = 22;
const man = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/out/seattle/space-needle/manifest.json", "utf8"));
const b = man.buildings.find((q) => q.id === ID);
const [x0, z0] = [BOX[0], BOX[1]], W = BOX[2] - BOX[0] + 1, D = BOX[3] - BOX[1] + 1;
const F = new Set(b.footprint.map(([x, z]) => `${x - x0},${z - z0}`));
const inF = (x, z) => F.has(`${x},${z}`);
const ring = (x, z) => inF(x, z) && (!inF(x, z - 1) || !inF(x, z + 1) || !inF(x - 1, z) || !inF(x + 1, z));
const expN = (x, z) => !inF(x, z - 1) || !inF(x, z + 1);   // exposed to north/south
const expEW = (x, z) => !inF(x - 1, z) || !inF(x + 1, z);  // exposed to east/west
// pilasters every 5 blocks along each run; mullions every 4 blocks inside the window bands
const isPilaster = (x, z) => {
  const ns = expN(x, z), ew = expEW(x, z);
  if (ns && ew) return true;
  if (ns) return x % 5 === 0;
  return z % 5 === 0;
};
const isMullion = (x, z) => (expN(x, z) && !expEW(x, z) ? x % 4 === 0 : z % 4 === 0);

// entrances: [cells, facing, canopy cells]
const DOORS = [
  { cells: [[17, 0], [18, 0]], facing: "north", canopy: [[15, 0], [16, 0], [17, 0], [18, 0], [19, 0], [20, 0], [15, 1], [16, 1], [17, 1], [18, 1], [19, 1], [20, 1]] },
  { cells: [[12, 17], [13, 17]], facing: "south", canopy: [[10, 17], [11, 17], [12, 17], [13, 17], [14, 17], [15, 17], [10, 16], [11, 16], [12, 16], [13, 16], [14, 16], [15, 16]] },
  { cells: [[61, 8], [61, 9]], facing: "east", canopy: [[61, 7], [61, 8], [61, 9], [61, 10], [60, 7], [60, 8], [60, 9], [60, 10], [59, 7], [59, 8], [59, 9], [59, 10]] },
  { cells: [[1, 8], [1, 9]], facing: "west", canopy: [[1, 7], [1, 8], [1, 9], [1, 10], [2, 7], [2, 8], [2, 9], [2, 10], [3, 7], [3, 8], [3, 9], [3, 10]] },
];
const doorKeys = new Set(DOORS.flatMap((d) => d.cells.map(([x, z]) => `${x},${z}`)));
const canopyKeys = new Set(DOORS.flatMap((d) => d.canopy.map(([x, z]) => `${x},${z}`)));

const Hmax = H + 6;
const g = new Voxels([W, Hmax, D]);
const sets = {};
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); };

// 1. foundation and interior ground floor
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  put(x, 0, z, "stone_bricks"); put(x, 1, z, "stone_bricks");
  if (!ring(x, z)) put(x, 2, z, "smooth_stone");
}

// 2. walls, storey by storey
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!ring(x, z)) continue;
  const pil = isPilaster(x, z), mul = isMullion(x, z);
  for (let y = 2; y <= 20; y++) {
    let blk;
    if (y <= 4) blk = "stone_bricks";                                   // lower plinth
    else if (y <= 6) blk = pil ? "light_gray_concrete" : "white_concrete";
    else if (y === 7) blk = pil ? "light_gray_concrete" : "smooth_stone"; // sill ledge
    else if (y <= 11) blk = pil ? "light_gray_concrete" : mul ? "gray_concrete" : "glass_pane";  // ground glazing
    else if (y === 12) blk = pil ? "light_gray_concrete" : "gray_concrete"; // steel transom
    else if (y <= 14) blk = pil ? "light_gray_concrete" : "white_concrete";
    else if (y <= 19) blk = pil ? "light_gray_concrete" : mul ? "gray_concrete" : "gray_stained_glass_pane"; // clerestory
    else blk = "light_gray_concrete";                                    // cornice
    if (blk === "glass_pane" || blk === "gray_stained_glass_pane") { put(x, y, z, blk, {north: "false", south: "false", east: "false", west: "false", waterlogged: "false"}); }
    else put(x, y, z, blk);
  }
}

// 3. mezzanine deck inside and the roof deck over everything
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  if (!ring(x, z)) put(x, 12, z, "smooth_stone");
  put(x, 21, z, "light_gray_concrete");
}

// 4. skylight strips in the roof (glass), kept off the ring
for (const zs of [[3, 4], [8, 9], [13, 14]]) for (let x = 5; x < W - 5; x++) for (const z of zs) {
  if (inF(x, z) && !ring(x, z)) put(x, 21, z, "glass");
}

// 5. rooftop HVAC boxes: gray_concrete body, iron_block cap
for (const [bx, bz] of [[8, 6], [22, 6], [36, 6], [50, 6], [14, 11], [30, 11], [44, 11]]) {
  for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 4; dx++) {
    const x = bx + dx, z = bz + dz;
    if (!inF(x, z) || ring(x, z)) continue;
    put(x, 22, z, "gray_concrete"); put(x, 23, z, "iron_block");
  }
}

// 6. entrances: dark oak doors, slab canopy over them
for (const d of DOORS) {
  const hinges = d.cells.length === 2 ? ["left", "right"] : ["left"];
  d.cells.forEach(([x, z], i) => {
    for (const [y, half] of [[5, "lower"], [6, "upper"]]) {
      put(x, y, z, "dark_oak_door", { facing: d.facing, half, hinge: hinges[i], open: "false", powered: "false" });
    }
  });
  for (const [x, z] of d.canopy) if (inF(x, z)) put(x, 7, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// 7. connect panes to their neighbours (full blocks and other panes), so the bands read as glazing not posts
const PANE = new Set(["glass_pane", "gray_stained_glass_pane"]);
const SOLID = new Set(["white_concrete", "light_gray_concrete", "gray_concrete", "stone_bricks", "smooth_stone", "iron_block"]);
const bare = (name) => String(name).replace("minecraft:", "");
const connects = (x, y, z) => { const c = g.get(x, y, z); if (!c) return false; const n = bare(c.block); return PANE.has(n) || SOLID.has(n); };
const fixPanes = (kind) => {
  for (let y = 0; y < Hmax; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    const c = g.get(x, y, z); if (!c || bare(c.block) !== kind) continue;
    g.set(x, y, z, kind, { north: String(connects(x, y, z - 1)), south: String(connects(x, y, z + 1)), east: String(connects(x + 1, y, z)), west: String(connects(x - 1, y, z)), waterlogged: "false" });
  }
};
fixPanes("glass_pane"); fixPanes("gray_stained_glass_pane");

g.save(`/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/${ID}.nbt`);
console.log(JSON.stringify({ id: ID, size: [W, Hmax, D], heightBlocks: H, blocks: g.count(), palette: g.palette.length, footprint: F.size }));
