// City Gardens Apartments (way 140409780): a late-20th-century apartment block on the fringe of the CBD. The lidar roof
// snaps to flat tiers: a two-storey podium (8) with a grassed roof garden, brick-clad wings (20, 32, 36), a concrete
// tower (72) stepping to 88 and 92 (a one-storey setback), and a crown (108) with a penthouse box and roof plant.
// Every column stands on a stone foundation from y 0 to its ground. Exposed walls are a band of spandrels every 4
// blocks, a head band under each storey, concrete piers every third column and blue glass between; the interior is
// air with a floor slab per storey, and a few windows show a lantern or glowstone on the floor just inside the glass.
// The entrance is on the southern face: a dark oak door under a canopy in a recessed porch.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_140409780.cells.json", "utf8"));

const W = 70, H = 122, D = 58;
const DIRS = [
  { dx: 1, dz: 0, axis: "x" }, { dx: -1, dz: 0, axis: "x" },   // +x, -x
  { dx: 0, dz: 1, axis: "z" }, { dx: 0, dz: -1, axis: "z" },   // +z (south), -z (north)
];
const key = (x, z) => `${x},${z}`;

const MAT = {
  podium: { body: "stone_bricks", band: "stone_bricks", head: "stone_bricks", glass: "glass", cap: "grass_block", parapet: "stone_bricks" },
  brick: { body: "bricks", band: "stone_bricks", head: "bricks", glass: "light_blue_stained_glass", cap: "smooth_stone", parapet: "bricks" },
  tower: { body: "white_concrete", band: "light_gray_concrete", head: "white_concrete", glass: "light_blue_stained_glass", cap: "light_gray_concrete", parapet: "white_concrete" },
};

// 1. Tiers: the lidar roof snapped to flat levels (multiples of 4 = storeys), at least one storey above its own ground.
function tierOf(R) {
  if (R < 12) return { T: 8, kind: "podium" };
  if (R < 24) return { T: 20, kind: "brick" };
  if (R < 34) return { T: 32, kind: "brick" };
  if (R < 60) return { T: 36, kind: "brick" };
  if (R < 84) return { T: 72, kind: "tower" };
  if (R < 91) return { T: 88, kind: "tower" };
  if (R < 100) return { T: 92, kind: "tower" };
  return { T: 108, kind: "tower" };
}
const C = new Map();
for (const [x, z, G, R] of cells) {
  const { T, kind } = tierOf(R);
  C.set(key(x, z), { x, z, G, T: Math.max(T, Math.ceil((G + 4) / 4) * 4), kind });
}
const cellAt = (x, z) => C.get(key(x, z));

// Which faces of a cell are open air at height y: outside the footprint, or over a neighbour whose roof is lower.
function sidesAt(c, y) {
  return DIRS.filter((d) => { const n = cellAt(c.x + d.dx, c.z + d.dz); return n ? y >= n.T : y >= c.G; });
}

const grid = new Voxels([W, H, D]);

// 2. Foundation: solid from y 0 up to each cell's ground, so nothing floats on the slope.
for (const c of C.values()) for (let y = 0; y < c.G; y++) grid.set(c.x, y, c.z, "stone_bricks");

// 3. Facade for an exposed wall cell at height y.
const glazed = [];
function facade(c, y, sides) {
  const m = MAT[c.kind];
  if (y === c.G) return "polished_granite";                                             // base course
  if (sides.some((s) => s.axis === "x") && sides.some((s) => s.axis === "z")) return m.body; // corner piers
  if (y % 4 === 0) return m.band;                                                       // storey line
  if (y % 4 === 3) return m.head;                                                       // head band
  const s = sides[0].axis === "x" ? c.z : c.x;                                          // along the wall
  if (s % 3 === 0) return m.body;                                                       // mullion
  glazed.push({ x: c.x, y, z: c.z, d: sides[0] });
  return m.glass;
}

// 4. Walls, the air interior with a floor slab per storey, and each roof cap; then the parapet on the exposed edge.
for (const c of C.values()) {
  for (let y = c.G; y < c.T - 1; y++) {
    const sides = sidesAt(c, y);
    if (!sides.length) { if (y > c.G && y % 4 === 0) grid.set(c.x, y, c.z, "light_gray_concrete"); continue; }
    grid.set(c.x, y, c.z, facade(c, y, sides));
  }
  grid.set(c.x, c.T - 1, c.z, MAT[c.kind].cap);
  if (sidesAt(c, c.T - 1).length) grid.set(c.x, c.T, c.z, MAT[c.kind].parapet);
}

// 5. Warm light: a lantern or glowstone on the floor just inside some windows (on a slab, never hanging).
for (const g of glazed) {
  const h = (g.x * 7 + g.y * 3 + g.z * 11) % 10;
  if (g.y % 4 !== 1 || (h !== 0 && h !== 5)) continue;
  const ix = g.x - g.d.dx, iz = g.z - g.d.dz;
  const inner = cellAt(ix, iz);
  if (!inner || sidesAt(inner, g.y).length || grid.val(ix, g.y, iz) !== 0 || grid.val(ix, g.y - 1, iz) === 0) continue;
  if (h === 0) grid.set(ix, g.y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else grid.set(ix, g.y, iz, "glowstone");
}

// 6. Entrance: the southernmost ground-level face, near the middle; a recessed porch with a dark oak door and a canopy.
const southFace = [...C.values()].filter((c) => !cellAt(c.x, c.z + 1));
southFace.sort((a, b) => (b.z - a.z) || (Math.abs(a.x - 35) - Math.abs(b.x - 35)));
const door = southFace[0];
const { x: dxp, z: dzp, G: dG } = door;
const bodyMat = MAT[door.kind].body;
grid.set(dxp, dG, dzp, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
grid.set(dxp, dG + 1, dzp, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let dx = -1; dx <= 1; dx++) {
  grid.set(dxp + dx, dG + 2, dzp, bodyMat);                                             // lintel over the door
  for (const zz of [dzp, dzp - 1]) grid.set(dxp + dx, dG + 3, zz, "smooth_stone");        // canopy over the porch
}

// 7. Roof plant: a penthouse on the crown, roof units on the tower's setbacks, a few plant boxes on the wings,
// a garden on the podium's roof (grass, with flowering azaleas).
const crown = [...C.values()].filter((c) => c.T === 108);
if (crown.length) {
  const cx = Math.round(crown.reduce((s, c) => s + c.x, 0) / crown.length);
  const cz = Math.round(crown.reduce((s, c) => s + c.z, 0) / crown.length);
  for (let x = cx - 2; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) {
    const c = cellAt(x, z); if (!c || c.T !== 108) continue;
    grid.set(x, 108, z, "white_concrete"); grid.set(x, 109, z, "white_concrete");
    grid.set(x, 110, z, "light_gray_concrete");
  }
}
for (const c of C.values()) {
  if (c.kind === "podium") {
    if ((c.x + c.z) % 4 === 1) grid.set(c.x, c.T, c.z, "flowering_azalea");
    continue;
  }
  if (c.T >= 88 && c.x % 8 === 4 && c.z % 6 === 2 && c.T !== 108) grid.set(c.x, c.T, c.z, "iron_block");
  if (c.T < 88 && c.x % 9 === 4 && c.z % 9 === 4) grid.set(c.x, c.T, c.z, "iron_block");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_140409780.nbt";
const r = grid.save(out);
console.log(`door ${dxp},${dG},${dzp}; ${r.blocks} blocks, palette ${r.palette}; glazed ${glazed.length}`);
