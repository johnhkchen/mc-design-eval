// Way 170798694, Auckland: a four-storey 1970s concrete office block on the volcanic slope below Mt Eden (Eden Terrace / Newton edge).
// Pale concrete piers and storey lines, blue tinted ribbon glazing, a stone plinth, a grey roof behind a white coping,
// a lift overrun and two plant boxes on the roof. The lidar roof is flat at 17 blocks above y 0 (16 to 17 over the footprint,
// the 16 trough is noise), so there is one tier and no setbacks. Storey lines sit on absolute levels (slabs at 0, 4, 8, 12,
// roof at 16) so they line up across the slope: the uphill side is buried in its foundation, the downhill side shows the extra storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170798694.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_170798694.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 40, Y = 30, Z = 43;
const ROOF = 16;             // the top solid block (lidar roof 17 above y 0)
const SLABS = [4, 8, 12];    // floor slabs above the ground slab at y 0

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFoot = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const openSides = (x, z) => Object.keys(DIRS).filter((d) => !inFoot(x + DIRS[d][0], z + DIRS[d][1]));
const isPerim = (x, z) => openSides(x, z).length > 0;
const isCorner = (x, z) => {
  const s = openSides(x, z);
  return s.some((d) => d === "north" || d === "south") && s.some((d) => d === "east" || d === "west");
};
// a fin of concrete every third cell along each open face (x on a north or south face, z on east or west); a cell open on
// two faces (a corner, or a step of a diagonal edge) takes the fin of either. Keying to the axis, not to x+z, keeps the
// rhythm on a stepped diagonal instead of turning a whole run of steps into solid concrete.
const pier = (x, z) => {
  const s = openSides(x, z);
  if (!s.length) return false;
  return s.some((d) => (d === "north" || d === "south" ? x : z) % 3 === 0);
};
const inner = (x, z) => inFoot(x, z) && !isPerim(x, z);

// the entrance: a plain street-level (ground 0) wall cell nearest the middle of the ground-0 run
const low = cells.filter(([x, z, g]) => g === 0 && openSides(x, z).length === 1 && !pier(x, z));
const lowCx = low.reduce((s, c) => s + c[0], 0) / low.length, lowCz = low.reduce((s, c) => s + c[1], 0) / low.length;
const door = low.reduce((best, c) => (!best || (c[0] - lowCx) ** 2 + (c[1] - lowCz) ** 2 < (best[0] - lowCx) ** 2 + (best[1] - lowCz) ** 2 ? c : best), null);
const doorFacing = door ? openSides(door[0], door[1])[0] : null;
const isDoor = (x, z) => door && door[0] === x && door[1] === z;

// a window pane in a wall that runs east-west (outward north or south) joins its neighbours east and west, and the reverse
const pane = (side) => {
  const ns = side === "north" || side === "south";
  return { north: String(!ns), south: String(!ns), east: String(ns), west: String(ns), waterlogged: "false" };
};

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// the wall ring at height y of a perimeter cell: plinth, shopfront, fascia; then ribbon windows between concrete fins
const ring = (x, y, z, side) => {
  const p = pier(x, z);
  if (y === 1) return { b: "stone_bricks" };
  if (y === 2) return p ? { b: "white_concrete" } : { b: "light_blue_stained_glass_pane", s: pane(side) };
  if (y === 3) return { b: "smooth_stone" };   // fascia
  const s = SLABS.filter((f) => y > f).pop();   // the storey this row belongs to
  if (p) return { b: "white_concrete" };
  if (y === s + 1) return { b: "light_gray_concrete" };   // sill
  return { b: "light_blue_stained_glass_pane", s: pane(side) };
};

for (const [x, z, gr] of cells) {
  const sides = openSides(x, z), perim = sides.length > 0, side = sides[0];
  for (let y = 0; y <= ROOF; y++) {
    if (y < gr) { put(x, y, z, perim ? "cobblestone" : "stone"); continue; }   // foundation: nothing floats on the slope
    if (y === ROOF) { put(x, y, z, perim ? "white_concrete" : "gray_concrete"); continue; }   // coping and roof
    if (y === 0 || SLABS.includes(y)) { put(x, y, z, !perim ? "smooth_stone" : y === 0 ? "stone_bricks" : "white_concrete"); continue; }   // floor slabs and storey lines
    if (!perim) continue;   // interior air
    if (isDoor(x, z) && y <= 2) { put(x, y, z, "iron_door", { facing: doorFacing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (isDoor(x, z) && y === 3) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    const r = ring(x, y, z, side);
    put(x, y, z, r.b, r.s);
  }
}

// warm light behind some windows: a glowstone on the floor inside, or a lantern hung from the slab above; the interior is air
for (const [x, z] of cells) {
  const sides = openSides(x, z);
  if (sides.length !== 1 || pier(x, z) || isDoor(x, z)) continue;
  const [dx, dz] = DIRS[sides[0]];
  const ix = x - dx, iz = z - dz;   // one step in, behind the glass
  if (!inner(ix, iz)) continue;
  const igr = groundAt(ix, iz);
  const rows = [{ y: 3, kind: "lantern" }];   // the ground storey
  for (const s of SLABS) rows.push({ y: s + 1, kind: "glow" }, { y: s + 3, kind: "lantern" });
  for (const row of rows) {
    if (row.y < igr) continue;   // inside the foundation
    if ((x * 7 + z * 13 + row.y) % 4 !== 0) continue;   // about one window in four
    if (row.kind === "glow") put(ix, row.y, iz, (x + z + row.y) % 3 === 0 ? "shroomlight" : "glowstone");
    else put(ix, row.y, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// roof: a lift overrun and two plant boxes, placed on the interior roof near the middle and either side of it
const fits = (x0, z0, w, d) => {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) if (!inner(x, z) || groundAt(x, z) > ROOF) return false;
  return true;
};
const spot = (w, d, near) => {
  let best = null;
  for (const [x, z] of cells) {
    if (!fits(x, z, w, d)) continue;
    const dd = (x - near[0]) ** 2 + (z - near[1]) ** 2;
    if (!best || dd < best.dd) best = { x, z, dd };
  }
  return best;
};
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length, cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
const lift = spot(2, 2, [cx, cz]);
if (lift) for (let x = lift.x; x < lift.x + 2; x++) for (let z = lift.z; z < lift.z + 2; z++) for (let y = ROOF + 1; y <= ROOF + 2; y++) put(x, y, z, "light_gray_concrete");
for (const near of [[cx - 9, cz], [cx + 9, cz]]) {
  const box = spot(3, 2, near);
  if (box) for (let x = box.x; x < box.x + 3; x++) for (let z = box.z; z < box.z + 2; z++) put(x, ROOF + 1, z, "stone_bricks");
}

console.log(g.save(OUT));
