// A 1920s brick commercial block on Mt Eden's flank: a shopfront at street level, storeys of brick piers and
// sash windows on 4-block lines, a stone cornice, and a 4-storey tower on its high (lidar 15) corner.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_827744432.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_827744432.nbt";

// Lidar roof heights snapped to storey lines (2, 3 and 4 storeys of 4 blocks): the tiers read as flat massing.
const tierOf = (roof) => (roof <= 10 ? 8 : roof <= 14 ? 12 : 16);

const foot = new Map();                                   // "x,z" -> { g: ground, T: roof tier }
for (const [x, z, g, roof] of cells) foot.set(`${x},${z}`, { g, T: tierOf(roof) });
const inFoot = (x, z) => foot.has(`${x},${z}`);

const B = new Map();                                      // "x,y,z" -> [block, state]
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, [block, state]);

const exposed = (x, z) => ({ n: !inFoot(x, z - 1), s: !inFoot(x, z + 1), w: !inFoot(x - 1, z), e: !inFoot(x + 1, z) });

// the entrance: the north face of the ground-floor run at x 1..3, z 1 (the cell at x 2)
const DOOR = [2, 1];

for (const [k, { g, T }] of foot) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  const per = ex.n || ex.s || ex.w || ex.e;
  const corner = (ex.n || ex.s) && (ex.w || ex.e);
  const along = ex.n || ex.s ? x : z;                     // which bay along the face this column is
  const win = per && !corner && along % 2 === 1;          // glass bays alternate with brick piers
  const door = x === DOOR[0] && z === DOOR[1];
  // the room behind a window (inward, one cell): air, with a glowstone in some upper windows
  const inward = ex.n ? [x, z + 1] : ex.s ? [x, z - 1] : ex.w ? [x + 1, z] : ex.e ? [x - 1, z] : null;

  for (let y = 0; y < g; y++) put(x, y, z, "cobblestone");  // foundation: nothing floats on a slope

  for (let y = g; y < T; y++) {
    if (!per) {
      // interior: a floor slab per storey (and the roof) with air between: no interior, just the gaps behind glass
      if (y === g || y === T - 1 || (y % 4 === 0 && y > 0)) put(x, y, z, "smooth_stone");
      continue;
    }
    if (door) {
      if (y === g) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === g + 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (y === 3) put(x, y, z, "dark_oak_slab", { type: "bottom" });    // the door's hood
      else put(x, y, z, "bricks");
      continue;
    }
    if (y === g) put(x, y, z, "stone_bricks");            // base course
    else if (y === T - 1 || (y % 4 === 0)) put(x, y, z, "smooth_stone");   // cornice and storey strings
    else if (y % 4 === 3) put(x, y, z, corner ? "quartz_block" : "bricks"); // lintels
    else if (corner) put(x, y, z, "quartz_block");        // quoins
    else if (win) put(x, y, z, "glass_pane");             // sash glass; states set below
    else put(x, y, z, "bricks");                          // piers
  }
  // a lit room behind every fourth upper window: a glowstone in the air gap one cell in
  if (per && !corner && win && !door && inward && inFoot(...inward)) {
    const [ix, iz] = inward;
    const ie = exposed(ix, iz);
    if (!ie.n && !ie.s && !ie.w && !ie.e && along % 4 === 1) {
      for (let y = Math.max(g, 5); y < T; y += 4) if (y % 4 === 1) put(ix, y, iz, "glowstone");
    }
  }
}

// the roof plant on the tower
for (const [x, z] of [[9, 3], [10, 3], [9, 4], [10, 4]]) {
  put(x, 16, z, "stone_bricks");
  put(x, 17, z, "smooth_stone_slab", { type: "bottom" });
}

// the sash glass joins the wall it sits in: a pane connects to a neighbour that is a pane or a solid block
const solid = (x, y, z) => { const b = B.get(`${x},${y},${z}`); return !!b && b[0] !== "glass_pane"; };
const pane = (x, y, z) => { const b = B.get(`${x},${y},${z}`); return !!b && b[0] === "glass_pane"; };
const conn = (x, y, z) => solid(x, y, z) || pane(x, y, z);
for (const [key, [block]] of [...B]) {
  if (block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  B.set(key, [block, {
    north: String(conn(x, y, z - 1)), south: String(conn(x, y, z + 1)),
    east: String(conn(x + 1, y, z)), west: String(conn(x - 1, y, z)), waterlogged: "false",
  }]);
}

const g = new Voxels([19, 28, 13]);
for (const [key, [block, state]] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const r = g.save(OUT);
console.log(`way_827744432: ${r.blocks} blocks, palette ${r.palette}`);
