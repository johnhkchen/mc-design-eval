// DC62193, 400 7th St SW: a Commercial-Office-Large ring of the 1960s-70s. Precast concrete piers and spandrels, blue-tinted
// glass between them, a granite base. The lidar roof snaps to four flat tiers: the lobby pavilions across the courtyard
// ends (4), the outer wing (15), the inner ring stepping up (17), and four corner knots (18). Storey lines every 3 blocks
// from a ground floor of 3; the floors are slabs across the footprint, with air behind the glass and open between them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62193.cells.json", "utf8"));

// Lidar roof heights (above y 0) snapped to the massing's tiers; the odd 1, 8, 12 and 16 are noise at a tier's edge.
const TIER = { 1: 4, 3: 4, 4: 4, 8: 4, 12: 15, 15: 15, 16: 17, 17: 17, 18: 18 };
const LINES = [4, 7, 10, 13];           // storey floor lines: spandrels on the facade, slabs inside
const ENTRY_X = 31;                     // the lobby doors, on the north and south faces
const GLASS = "light_blue_stained_glass";

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(x + "," + z, { x, z, ground, R: TIER[roof] ?? roof });
const at = (x, z) => cell.get(x + "," + z);

// Exposed sides: a neighbour outside the footprint, or one at a lower tier, leaves this cell's wall on view.
for (const c of cell.values()) {
  c.exp = [];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = at(c.x + dx, c.z + dz);
    if (!n || n.R < c.R) c.exp.push([dx, dz]);
  }
  c.facade = c.exp.length > 0;
  const onX = c.exp.some(([dx]) => dx !== 0), onZ = c.exp.some(([, dz]) => dz !== 0);
  c.corner = onX && onZ;
  // Piers every third block on the wall's own run (corners always); spandrels and windows fill between them.
  c.pier = c.corner || (onZ ? c.x % 3 === 0 : onX ? c.z % 3 === 0 : false);
}

const isEntry = (c) => (c.z === 0 || c.z === 60) && c.exp.some(([, dz]) => dz !== 0) && Math.abs(c.x - ENTRY_X) <= 1;

function doorState(c, y) {
  return { facing: c.z === 0 ? "south" : "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
}

// The wall of a facade cell at height y: base, piers, spandrel lines, glass, cornice; the lobby door on its face.
function facade(c, y) {
  const { R, x } = c;
  if (y === 0) return ["granite"];
  if (isEntry(c)) {
    if (x === ENTRY_X && y <= 2) return ["iron_door", doorState(c, y)];
    if (y === 3) return ["smooth_stone"];                           // the lintel over the entrance
  }
  if (y === R - 1) return ["smooth_stone"];                         // cornice or parapet
  if (c.pier) return ["white_concrete"];
  if (y === 1 && R >= 5) return ["granite"];                        // the sill course over the shopfronts
  if (LINES.includes(y) || y === R - 2) return ["light_gray_concrete"];
  return y <= 3 ? ["glass"] : [GLASS];
}

// Inside the footprint: a slab at every storey line and under the roof, air between them.
function interior(c, y) {
  if (y === 0) return ["granite"];
  if (y === c.R - 1) return ["gray_concrete"];                      // roof membrane
  if (LINES.includes(y) || y === c.R - 2) return ["light_gray_concrete"];
  return null;
}

const g = new Voxels([61, 30, 61]);
for (const c of cell.values()) {
  for (let y = 0; y < c.R; y++) {
    const b = c.facade ? facade(c, y) : interior(c, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
}

// Warm light: the bottom window row of some bays on the upper storeys (and the pavilion glazing), a glowstone just inside
// the glass, standing on the slab under it. Only where the room behind is air and the block below is solid.
let glows = 0;
for (const c of cell.values()) {
  if (!c.facade || c.corner || c.pier || isEntry(c)) continue;
  const [dx, dz] = c.exp[0];
  const inner = at(c.x - dx, c.z - dz);
  if (!inner || inner.facade) continue;
  for (let y = 1; y < c.R - 2; y++) {
    const bottomRow = y === 1 ? c.R === 4 : LINES.includes(y - 1);
    if (!bottomRow || LINES.includes(y) || y === c.R - 1) continue;
    if (interior(inner, y) !== null || interior(inner, y - 1) === null) continue;
    if ((c.x * 5 + c.z * 3 + y) % 7 !== 0) continue;
    g.set(inner.x, y, inner.z, "glowstone"); glows++;
  }
}

// Roof plant on the inner ring: 2x2 boxes of louvred plant, spaced apart, with a grille on top.
const plant = [];
for (const c of cell.values()) {
  if (c.R !== 17 || c.facade) continue;
  const block = [0, 1].flatMap((i) => [0, 1].map((k) => at(c.x + i, c.z + k)));
  if (!block.every((n) => n && n.R === 17 && !n.facade)) continue;
  if (plant.some((p) => Math.abs(p.x - c.x) < 5 && Math.abs(p.z - c.z) < 5)) continue;
  if ((c.x * 3 + c.z * 7) % 11 !== 0) continue;
  plant.push(c);
  if (plant.length === 4) break;
}
for (const p of plant) {
  for (const i of [0, 1]) for (const k of [0, 1]) g.set(p.x + i, 17, p.z + k, "light_gray_concrete");
  g.set(p.x, 18, p.z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
}

// Lanterns on the crown of the corner knots: the warm top of the tower.
let lanterns = 0;
for (const c of cell.values()) {
  if (c.R !== 18 || c.facade) continue;
  if (c.x % 3 !== 1 || c.z % 3 !== 1) continue;
  g.set(c.x, 18, c.z, "lantern", { hanging: "false", waterlogged: "false" }); lanterns++;
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC62193.nbt";
const { blocks, palette } = g.save(out);
console.log(`DC62193: ${cell.size} cells, ${blocks} blocks, ${palette} palette entries, ${glows} glowstone, ${plant.length} plant boxes, ${lanterns} lanterns -> ${out}`);
