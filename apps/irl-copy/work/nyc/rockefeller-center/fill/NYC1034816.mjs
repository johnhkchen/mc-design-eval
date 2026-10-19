// 41 West 54th Street, 1920 mixed residential and commercial building: a 5 x 22 brick lot on a granite base, stepped
// down from a 7-storey street front (high z = the 54th Street frontage, a shopfront at ground level) through a 5-storey
// middle to a 4-storey rear wing (low z), with a penthouse on the roof. Lidar roof medians per row are snapped to three
// flat tiers (15, 18, 22 blocks). Each tier is a wall shell with a calcite string course every storey, a stone cornice
// and parapet, and a tar roof (gravel). Glass sits in the outer wall with air behind it and a floor slab per storey
// (no interiors). Warm glowstone and hanging lanterns sit behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034816.cells.json`, "utf8"));
const X = 5, Y = 34, Z = 22;          // x 0..4 across, z 0..21 along (z 21 = the street front)
const TIERS = [15, 18, 22];           // flat tiers the lidar rows snap to

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);

// Tier height per row: the median lidar roof of the row, snapped to the nearest tier.
const snap = (v) => TIERS.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
const rowH = new Map();
for (let z = 0; z < Z; z++) {
  const rs = cells.filter((c) => c[1] === z).map((c) => c[3]).sort((a, b) => a - b);
  rowH.set(z, snap(rs[rs.length >> 1]));
}
// Runs of equal height are the tiers: each run's first and last rows are its end walls.
const run = new Map();
for (let z = 0, s = 0; z <= Z; z++) {
  if (z === Z || rowH.get(z) !== rowH.get(s)) {
    for (let k = s; k < z; k++) run.set(k, { start: s, end: z - 1, h: rowH.get(s) });
    s = z;
  }
}

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const side = (x) => x === 0 || x === X - 1;
const endWall = (z) => { const r = run.get(z); return z === r.start || z === r.end; };
const wall = (x, z) => side(x) || endWall(z);
const interior = (x, z) => inFoot(x, z) && !wall(x, z);
// A wall cell takes glass only where the cell inside it is interior and the cell outside is open air (the street,
// the rear yard or a side lot line). Side piers every third row keep the brick reading between the windows.
const inward = (x, z) => (x === 0 ? [1, z] : x === X - 1 ? [X - 2, z] : z === 0 ? [x, 1] : z === Z - 1 ? [x, Z - 2] : null);
const glassAt = (x, z) => {
  if (!wall(x, z) || !inward(x, z)) return false;
  const [ix, iz] = inward(x, z);
  if (!interior(ix, iz)) return false;
  return !(side(x) && (z - run.get(z).start) % 3 === 0);
};
const DOOR = [2, 21];                 // lobby door in the middle of the street front
const LIGHTS = [[2, 4, 20], [2, 10, 20], [2, 16, 20], [3, 7, 13], [1, 7, 8], [2, 4, 1]];
const LANTERNS = [[1, 2, 20], [3, 2, 20]];   // hanging from the ground-floor ceiling, behind the shop glass

const panes = [];
for (let z = 0; z < Z; z++) {
  const r = run.get(z);
  for (let x = 0; x < X; x++) {
    if (!inFoot(x, z)) continue;
    const h = r.h;
    // Ground: a solid foundation up to the cell's ground (flat lot here, so nothing below y 0).
    const gr = cell.get(`${x},${z}`).ground;
    for (let y = 0; y < gr; y++) put(x, y, z, "polished_granite");
    for (let y = 0; y < h; y++) {
      if (y === h - 1) put(x, y, z, wall(x, z) ? "polished_diorite" : "gravel");     // parapet / tar roof
      else if (y >= h - 3) put(x, y, z, "polished_diorite");                         // cornice: solid both sides
      else if (y % 3 === 0) put(x, y, z, wall(x, z) ? (y === 0 ? "polished_granite" : "calcite") : "smooth_stone");
      else if (wall(x, z)) {                                                          // storey rows
        if (glassAt(x, z)) { put(x, y, z, "glass_pane"); panes.push([x, y, z]); }
        else put(x, y, z, "bricks");
      }                                                                               // interior storey rows: air
    }
  }
}

// Penthouse on the rear-middle of the roof of the 22-tier, one storey of brick with glass on each face.
const PH = { x0: 1, x1: 3, z0: 8, z1: 10, y0: 22 };
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
  const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
  put(x, PH.y0, z, edge ? "bricks" : "smooth_stone");                                  // floor slab + walls
  if (edge) {                                                                           // glass mid-face, air inside
    const mid = x === 2 || z === 9;
    put(x, PH.y0 + 1, z, mid ? "glass_pane" : "bricks");
    if (mid) panes.push([x, PH.y0 + 1, z]);
  }
  put(x, PH.y0 + 2, z, "stone_bricks");                                                // cap
}
put(2, PH.y0 + 1, 9, "glowstone");

// Lights and lanterns behind the glass.
for (const [x, y, z] of LIGHTS) put(x, y, z, "glowstone");
for (const [x, y, z] of LANTERNS) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });

// Lobby door, two halves, opening onto the street front.
put(DOOR[0], 1, DOOR[1], "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(DOOR[0], 2, DOOR[1], "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// Panes connect to any neighbour block in the four horizontal directions, as in the game.
for (const [x, y, z] of panes) {
  const on = (dx, dz) => (g.get(x + dx, y, z + dz) ? "true" : "false");
  put(x, y, z, "glass_pane", { north: on(0, -1), south: on(0, 1), east: on(1, 0), west: on(-1, 0), waterlogged: "false" });
}

g.save(`${DIR}/NYC1034816.nbt`);
console.log(`NYC1034816: ${g.count()} blocks, palette ${g.palette.length}, tiers ${JSON.stringify([...new Set(rowH.values())])}`);
