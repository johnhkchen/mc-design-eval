// Palace of Fine Arts helpers (plan.md VOCABULARY): archCut, corinthianCol, cornice, statuePier, coffers,
// planterBox, niche, shedRoof. Block ids are plan.md's PALETTE literals; states come from the build library.
// Every helper takes its position as arguments and writes only into air inside the footprint it is given,
// unless an option says otherwise (over: true, or carve: true for archCut and niche). Each returns how many
// blocks it placed (archCut returns the opening cell count; niche returns its carved cells too).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const SQRT2 = Math.SQRT2;
// coffer bands, as lower limits of the normalized radius: outer shell (domeShell), middle (back), inner (coffer grid)
const MIDDLE = 0.914, INNER = 0.871, OUTER = 0.957;

// writer(g, box, over): w(x, y, z, block, state) places one block when the cell is inside box and is air.
function writer(g, box, over = false) {
  return (x, y, z, block, state) => {
    if (x < box[0] || y < box[1] || z < box[2] || x > box[3] || y > box[4] || z > box[5]) return 0;
    if (!g.inBounds(x, y, z) || (!over && !g.isAir(x, y, z))) return 0;
    g.set(x, y, z, block, state);
    return 1;
  };
}

// Tangential coordinate t of cell (x, z) on a rotunda face (plan.md ROTUNDA table), centre [cx, cz].
function tangent(face, x, z, [cx, cz]) {
  const dx = x - cx, dz = z - cz;
  switch (face) {
    case "N": case "S": return dx;
    case "E": case "W": return dz;
    case "NE": case "SW": return (dx + dz) / SQRT2;
    case "NW": case "SE": return (dx - dz) / SQRT2;
    default: throw new Error(`unknown rotunda face ${face}`);
  }
}

/** A round-headed opening: |t| ≤ 6 up to the springline y 19, then t² + (y−19)² ≤ 6.5² up to the crown (y 25). */
export function isArchOpening(t, y) {
  if (y < 1 || y > 25) return false;
  if (y <= 19) return Math.abs(t) <= 6;
  return t * t + (y - 19) ** 2 <= 6.5 ** 2;
}

/**
 * Arch openings on one rotunda face inside box [x0, y0, z0, x1, y1, z1]. Carving is by not placing, so by default
 * this writes nothing and returns the number of opening cells; { carve: true } clears those cells to air.
 */
export function archCut(g, box, face, { centre = [31.5, 31.5], carve = false } = {}) {
  let n = 0;
  for (let x = box[0]; x <= box[3]; x++) for (let y = box[1]; y <= box[4]; y++) for (let z = box[2]; z <= box[5]; z++) {
    if (!isArchOpening(tangent(face, x, z, centre), y)) continue;
    n++;
    if (carve && g.inBounds(x, y, z)) g.set(x, y, z, "minecraft:air");
  }
  return n;
}

/**
 * A giant Corinthian column on the 2×2 shaft whose centre is [cx, cz] (half-integers, e.g. 39.5: cells 39..40).
 * Base 4×4 sandstone at y 1 and smooth_sandstone at y 2; shaft granite to y 27, or white_terracotta to y 18 for the
 * peristyle; capital 4×4 chiseled_sandstone one above the shaft, abacus 4×4 smooth_sandstone above that.
 */
export function corinthianCol(g, cx, cz, shaft = "granite", { top = shaft === "granite" ? 27 : 18, over = false } = {}) {
  const x0 = Math.floor(cx - 0.5), z0 = Math.floor(cz - 0.5);
  const w = writer(g, [x0 - 1, 1, z0 - 1, x0 + 2, top + 2, z0 + 2], over);
  let n = 0;
  for (let x = x0 - 1; x <= x0 + 2; x++) for (let z = z0 - 1; z <= z0 + 2; z++) {
    n += w(x, 1, z, "sandstone") + w(x, 2, z, "smooth_sandstone");
    n += w(x, top + 1, z, "chiseled_sandstone") + w(x, top + 2, z, "smooth_sandstone");
  }
  for (let x = x0; x <= x0 + 1; x++) for (let z = z0; z <= z0 + 1; z++) for (let y = 3; y <= top; y++) n += w(x, y, z, shaft);
  return n;
}

/**
 * A cornice course on row box[1]. Cells of the box outside shape(x, z) that touch the shape get an upside-down
 * smooth_sandstone stair facing the shape; shape cells get infill (smooth_sandstone, or false). ledge (true = shape
 * cells, or a predicate (x, z)) gets a bottom smooth_sandstone_slab one row up. Default shape: the box inset by one.
 */
export function cornice(g, box, {
  shape = (x, z) => x > box[0] && x < box[3] && z > box[2] && z < box[5],
  infill = "smooth_sandstone", ledge = null, over = false,
} = {}) {
  const [x0, y0, z0, x1, , z1] = box;
  const w = writer(g, [x0, y0, z0, x1, y0 + 1, z1], over);
  const toward = [[0, 1, "south"], [0, -1, "north"], [1, 0, "east"], [-1, 0, "west"]];
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const inside = shape(x, z);
    if (inside) { if (infill) n += w(x, y0, z, infill); }
    else {
      const dir = toward.find(([dx, dz]) => shape(x + dx, z + dz));
      if (dir) n += w(x, y0, z, ...B.stairs("smooth_sandstone", dir[2], "top"));
    }
    if (ledge && (ledge === true ? inside : ledge(x, z))) n += w(x, y0 + 1, z, ...B.slab("smooth_sandstone", "bottom"));
  }
  return n;
}

/**
 * Attic corner statue pier: a 2×2 cut_sandstone strip from vertex {x, z} (its min corner) over y0..y1, with a
 * white_terracotta body (statueY..statueY+3) and calcite head (statueY+4) on the diagonal corner cell that
 * faces outward: ox, oz = -1 or 1.
 */
export function statuePier(g, { x, z, ox, oz }, { y0 = 34, y1 = 45, statueY = 37, over = false } = {}) {
  const sx = ox < 0 ? x - 1 : x + 2, sz = oz < 0 ? z - 1 : z + 2;
  const w = writer(g, [Math.min(x, sx), y0, Math.min(z, sz), Math.max(x + 1, sx), y1, Math.max(z + 1, sz)], over);
  let n = 0;
  for (let i = x; i <= x + 1; i++) for (let k = z; k <= z + 1; k++) for (let y = y0; y <= y1; y++) n += w(i, y, k, "cut_sandstone");
  for (let y = statueY; y < statueY + 4; y++) n += w(sx, y, sz, "white_terracotta");
  n += w(sx, statueY + 4, sz, "calcite");
  return n;
}

/**
 * Coffered underside of a dome centred at [cx, cy, cz] (cell coordinates; dome rises from cy). Middle band: brown_terracotta
 * coffer backs with a glowstone at each coffer centre. Inner band: smooth_sandstone ribs on the sector lines and every
 * `every` courses; the rest stays air (the coffers). Outer shell is domeShell's job.
 */
export function coffers(g, [cx, cy, cz], { rx = 23.5, ry = 22, sectors = 32, every = 3, over = false } = {}) {
  const box = [Math.floor(cx - rx), cy, Math.floor(cz - rx), Math.ceil(cx + rx), cy + ry, Math.ceil(cz + rx)];
  const w = writer(g, box, over);
  const alpha = (2 * Math.PI) / sectors;
  let n = 0;
  for (let x = box[0]; x <= box[3]; x++) for (let y = cy; y <= box[4]; y++) for (let z = box[2]; z <= box[5]; z++) {
    const dx = x - cx, dy = y - cy, dz = z - cz;
    const nr = Math.sqrt((dx * dx + dz * dz) / (rx * rx) + (dy * dy) / (ry * ry));
    const middle = nr < OUTER && nr >= MIDDLE, inner = nr < MIDDLE && nr >= INNER;
    if (!middle && !inner) continue;
    const r = Math.hypot(dx, dz);
    const u = Math.atan2(dz, dx) / alpha;                        // sector coordinate: integers are the ribs
    const arcToRib = Math.abs(u - Math.round(u)) * alpha * r;    // in cells along the arc
    const arcToCentre = Math.abs(u - (Math.floor(u) + 0.5)) * alpha * r;
    const course = (y - cy) % every;                              // 0 = rib course, 1 = first course of a coffer
    if (inner) {
      if (arcToRib <= 0.5 || course === 0) n += w(x, y, z, "smooth_sandstone");
    } else {
      const glow = course === 1 && arcToCentre <= 0.5;
      n += w(x, y, z, glow ? "glowstone" : "brown_terracotta");
    }
  }
  return n;
}

/**
 * Hollow planter box on the outer cells x0..x1, z0..z1 (walls 1 thick), floor y, rim y+6. Walls: cut_sandstone base
 * band and rim, smooth_sandstone between, a 6-cell sandstone recess on each face at y+2..y+4. Soil dirt y..y+4 inside.
 * Leaves heap over the inner 8×8 at y+5..y+7 (persistent), spill over the rim corners at y+7, vines down the outside
 * faces y+1..y+6.
 */
export function planterBox(g, x0, x1, z0, z1, { y = 25, over = false } = {}) {
  const top = y + 6;
  const w = writer(g, [x0 - 1, y, z0 - 1, x1 + 1, y + 7, z1 + 1], over);
  const cxI = (x0 + x1) / 2, czI = (z0 + z1) / 2;
  const leaves = (x, z) => ((x + z) % 4 === 0 ? "flowering_azalea_leaves" : "oak_leaves");
  let n = 0;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const ring = x === x0 || x === x1 || z === z0 || z === z1;
    const inner = !ring && x > x0 && x < x1 && z > z0 && z < z1;
    if (ring) {
      for (let yy = y; yy <= top; yy++) {
        if (yy === y || yy === top) { n += w(x, yy, z, "cut_sandstone"); continue; }
        const onNS = z === z0 || z === z1, onEW = x === x0 || x === x1;
        const panel = yy >= y + 2 && yy <= y + 4 && ((onNS && !onEW && x >= x0 + 2 && x <= x1 - 2) || (onEW && !onNS && z >= z0 + 2 && z <= z1 - 2));
        n += w(x, yy, z, panel ? "sandstone" : "smooth_sandstone");
      }
      if ((x === x0 || x === x1) && (z === z0 || z === z1)) n += w(x, top + 1, z, leaves(x, z), { persistent: "true" });
    } else if (inner) {
      for (let yy = y; yy < y + 5; yy++) n += w(x, yy, z, "dirt");
      // heap: a ragged base at y+5, mounded to y+6 and y+7 at the middle
      const r = Math.hypot(x - cxI, z - czI);
      const ragged = (x * 7 + z * 3) % 3 === 0 ? -0.4 : 0;
      if (r <= 4.6 + ragged) n += w(x, y + 5, z, leaves(x, z), { persistent: "true" });
      if (r <= 3.0) n += w(x, y + 6, z, leaves(x, z), { persistent: "true" });
      if (r <= 1.5) n += w(x, y + 7, z, leaves(x, z), { persistent: "true" });
    }
  }
  const vine = (north, east, south, west) => ({ north: String(north), east: String(east), south: String(south), west: String(west), up: "false" });
  for (let yy = y + 1; yy <= top; yy++) {
    for (let x = x0 + 1; x <= x1 - 1; x++) {
      n += w(x, yy, z0 - 1, "vine", vine(false, false, true, false));
      n += w(x, yy, z1 + 1, "vine", vine(true, false, false, false));
    }
    for (let z = z0 + 1; z <= z1 - 1; z++) {
      n += w(x0 - 1, yy, z, "vine", vine(false, true, false, false));
      n += w(x1 + 1, yy, z, "vine", vine(false, false, false, true));
    }
  }
  return n;
}

/**
 * A niche carved into a pier: box = [x0, y0, z0, x1, y1, z1], opening on the `face` side (north = min z, south = max z,
 * east = max x, west = min x). The bottom row y0 is a chiseled sill; the rows above are carved (air) except the head:
 * the top row y1 keeps only its centre cells. A lantern stands on the sill at the opening. Returns { carved, placed }:
 * carved lists the air cells so the pier body can skip them; carve: true clears them.
 */
export function niche(g, face, box, { carve = false, lantern = true, over = false } = {}) {
  const [x0, y0, z0, x1, y1, z1] = box;
  const w = writer(g, box, over);
  const across = face === "north" || face === "south";
  const cX = Math.floor((x0 + x1) / 2), cZ = Math.floor((z0 + z1) / 2);
  const carved = [];
  let placed = 0;
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    if (y === y0) { placed += w(x, y, z, "chiseled_sandstone"); continue; }
    const centre = across ? x === cX : z === cZ;
    if (y === y1 && !centre) continue;
    carved.push([x, y, z]);
    if (carve && g.inBounds(x, y, z)) g.set(x, y, z, "minecraft:air");
  }
  if (lantern) {
    const [lx, lz] = { north: [cX, z0], south: [cX, z1], east: [x1, cZ], west: [x0, cZ] }[face];
    placed += w(lx, y0 + 1, lz, ...B.lantern(false));
  }
  return { carved, placed };
}

/**
 * The hall's shed roof over x0..x1, rows z0..z1 (z1 is the eave row), high edge at yHigh. Rows by parity of (z − z0):
 * even → granite_stairs facing north at the surface course; odd → granite_slab one course down. The eave row z1 is
 * granite_stairs facing north one course below the last slope row. Returns the placed count.
 */
export function shedRoof(g, [x0, z0, x1, z1], yHigh = 24, { material = "granite", over = false } = {}) {
  const eaveY = yHigh - Math.floor((z1 - 1 - z0) / 2) - 1;
  const w = writer(g, [x0, eaveY, z0, x1, yHigh, z1], over);
  const stair = B.stairs(material, "north", "bottom"), slab = B.slab(material, "bottom");
  let n = 0;
  for (let z = z0; z < z1; z++) {
    const yS = yHigh - Math.floor((z - z0) / 2);
    for (let x = x0; x <= x1; x++) n += (z - z0) % 2 === 0 ? w(x, yS, z, ...stair) : w(x, yS - 1, z, ...slab);
  }
  for (let x = x0; x <= x1; x++) n += w(x, eaveY, z1, ...stair);
  return n;
}
