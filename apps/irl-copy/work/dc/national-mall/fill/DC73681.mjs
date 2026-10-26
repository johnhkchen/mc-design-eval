import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A late-19th-century church of red brick on a stone base, with a stone cornice, a slate roof behind a parapet, a
// square belfry tower at the south-east (the lidar's 8-block roof) and low wings to the west. The facade faces north
// (z 0), where the door sits in the middle of the street front.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73681.cells.json`, "utf8"));

const W = 18, H = 20, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, gr, roof] of cells) cell.set(key(x, z), { gr, roof });
const has = (x, z) => cell.has(key(x, z));

// Tiers: the lidar roof's median over each cell's 3x3, in whole blocks, so the noise goes and the tiers stay flat.
const tierOf = new Map();
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = cell.get(key(x + dx, z + dz)); if (c) vals.push(c.roof);
  }
  vals.sort((a, b) => a - b);
  tierOf.set(key(x, z), vals[Math.floor(vals.length / 2)]);
}
const top = (x, z) => (has(x, z) ? tierOf.get(key(x, z)) : 0);

const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const zFace = d => d === "n" || d === "s";
// The faces a cell shows: a neighbour that is missing or lower exposes the wall above it.
const exposed = (x, z) => {
  const t = top(x, z), out = {};
  for (const [d, [dx, dz]] of Object.entries(DIRS)) { const nb = top(x + dx, z + dz); if (nb < t) out[d] = nb; }
  return out;
};
const pane = d => zFace(d)
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" };

const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const pockets = [];   // the air (or warm light) behind each window: one cell inside the glass

for (const [x, z, gr] of cells) {
  const t = tierOf.get(key(x, z));
  const ex = exposed(x, z);
  for (let y = 0; y < t; y++) {
    const shows = Object.keys(ex).filter(d => y >= ex[d]);   // faces above the neighbour's roof
    const quoin = shows.some(zFace) && shows.some(d => !zFace(d));
    let b = "bricks", st = null;
    if (y <= gr) b = "stone_bricks";                                  // plinth, down to the ground
    else if (y === t - 1) b = shows.length ? "stone_bricks" : "deepslate_tiles";      // solid parapet or slate deck
    else if (!shows.length) b = "bricks";                             // interior mass
    else if (quoin) b = "stone_bricks";                               // corner quoins
    else {
      const d = shows[0];
      const along = zFace(d) ? x : z;
      const belfry = t >= 8 && y === 6 && (zFace(d) ? x === 12 : z === 15);
      if (y === 1) b = "stone_bricks";                                 // base course
      else if (belfry) b = "iron_bars";                                // louvre of the belfry
      else if (t >= 7 && y === t - 2) b = "smooth_stone";              // cornice
      else if (y === 3 && t >= 5) b = "smooth_stone";                  // string course
      else if ((y === 2 || (y === 4 && t >= 6)) && along % 3 === 1 && !(z === 0 && x >= 11 && x <= 13)) {
        b = "glass_pane"; st = pane(d);
        pockets.push({ x, y, z, dx: DIRS[d][0], dz: DIRS[d][1] });
      }
    }
    put(x, y, z, b, st);
  }
}

// The windows' air gaps: a warm light in some (glowstone), the rest open air.
for (const p of pockets) {
  const px = p.x - p.dx, pz = p.z - p.dz;
  if (!has(px, pz)) continue;
  const warm = (p.x * 7 + p.y * 3 + p.z) % 4 === 0;
  put(px, p.y, pz, warm ? "glowstone" : "air");
}

// The entrance: a dark oak door set in the north wall between stone jambs, with its air behind.
put(12, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(12, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(12, 1, 1, "air"); put(12, 2, 1, "air");
for (const y of [1, 2]) for (const x of [11, 13]) put(x, y, 0, "stone_bricks");

// The belfry's finial: a stone cap and a lantern on the tower's centre.
const tt = tierOf.get(key(12, 15));
put(12, tt, 15, "deepslate_tile_wall");
put(12, tt + 1, 15, "lantern", { hanging: "false", waterlogged: "false" });

const out = `${DIR}/DC73681.nbt`;
const info = g.save(out);
console.log(JSON.stringify({ out, ...info }));
