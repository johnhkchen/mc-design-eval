import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC70884.cells.json`, "utf8"));

// 1200 L St NW: early-20th-century brick office block with limestone base, sill
// courses and cornice. Three storeys, one main roof tier, lower wings where lidar
// shows them, central entrance on the south (z=0) face.
const W = 20, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const cm = new Map();
for (const [x, z, gr, rf] of cells) cm.set(`${x},${z}`, { gr: Math.round(gr), rf: Math.round(rf) });
const has = (x, z) => cm.has(`${x},${z}`);
const info = (x, z) => cm.get(`${x},${z}`);

// Roof tiers: lidar noise is smoothed to one main parapet height; cells well below
// it are treated as lower wings at their own (rounded) height.
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const MAIN = roofs[Math.floor(roofs.length / 2)];

function face(x, z) {
  const ew = !has(x + 1, z) || !has(x - 1, z);
  const ns = !has(x, z + 1) || !has(x, z - 1);
  return { ew, ns, corner: ew && ns };
}
function isPerim(x, z) {
  const f = face(x, z);
  return f.ew || f.ns;
}
function tops(x, z) {
  const c = info(x, z);
  const B = c.gr;
  const T = c.rf >= MAIN - 2 ? MAIN : Math.max(c.rf, B + 7);
  return { B, T };
}
// Window test for a perimeter, non-corner, non-pier wall cell at height y.
function isWin(x, z, y) {
  if (!has(x, z) || !isPerim(x, z)) return false;
  const f = face(x, z);
  if (f.corner) return false;
  const { B, T } = tops(x, z);
  const rel = y - B;
  if (rel < 1 || y > T - 3) return false;
  if (rel % 3 === 0) return false; // storey / sill course
  const along = f.ew && !f.ns ? z : x;
  if (along % 3 === 0) return false; // stone pilaster every third cell
  return true;
}
// Interior neighbour of a perimeter cell, if inside the footprint.
function inward(x, z) {
  const f = face(x, z);
  if (f.ew && !f.ns) {
    const ix = !has(x + 1, z) ? x - 1 : x + 1;
    return has(ix, z) ? [ix, z] : null;
  }
  const iz = !has(x, z + 1) ? z - 1 : z + 1;
  return has(x, iz) ? [x, iz] : null;
}

// Pass 1: foundation, walls, floors, cornice, roof.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { B, T } = tops(x, z);
  const per = isPerim(x, z);

  for (let y = 0; y < B; y++) g.set(x, y, z, "stone");

  for (let y = B; y <= T - 1; y++) {
    if (!per) {
      // interior: floor slabs and roof only; air between (no interiors)
      if (y === T - 1 || (y - B) % 3 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const f = face(x, z);
    // corners and cornice/parapet
    if (y >= T - 2) { g.set(x, y, z, "stone_bricks"); continue; }
    if (f.corner) { g.set(x, y, z, "stone_bricks"); continue; }
    // base course and storey sill courses
    if (y === B) { g.set(x, y, z, "stone_bricks"); continue; }
    if ((y - B) % 3 === 0) { g.set(x, y, z, "smooth_stone"); continue; }
    // stone pilasters on every third bay
    const along = f.ew && !f.ns ? z : x;
    if (along % 3 === 0) { g.set(x, y, z, "stone_bricks"); continue; }
    if (isWin(x, z, y)) {
      let props;
      if (f.ew && !f.ns) {
        props = {
          north: isWin(x, z - 1, y) ? "true" : "false",
          south: isWin(x, z + 1, y) ? "true" : "false",
          east: "false", west: "false", waterlogged: "false",
        };
      } else {
        props = {
          north: "false", south: "false",
          east: isWin(x + 1, z, y) ? "true" : "false",
          west: isWin(x - 1, z, y) ? "true" : "false",
          waterlogged: "false",
        };
      }
      g.set(x, y, z, "glass_pane", props);
    } else {
      // window head row under the sill course: brick spandrel
      g.set(x, y, z, "bricks");
    }
  }
}

// Pass 2: entrance on the south face (z=0), centred on x=10.
{
  const dx = 10, dz = 0;
  if (has(dx, dz) && isPerim(dx, dz)) {
    const { B } = tops(dx, dz);
    // stone surround either side of the door
    for (const px of [dx - 1, dx + 1]) {
      if (has(px, dz)) {
        g.set(px, B + 1, dz, "stone_bricks");
        g.set(px, B + 2, dz, "stone_bricks");
      }
    }
    // double-height door: lower and upper halves facing outward (north)
    g.set(dx, B + 1, dz, "oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(dx, B + 2, dz, "oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // lantern-lit transom glass above the door, inside the storey course line
    if (has(dx, dz + 1)) g.set(dx, B + 3, dz + 1, "glowstone");
  }
}

// Pass 3: warm lights in the air gap behind some windows, two storeys.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (!isPerim(x, z)) continue;
  const f = face(x, z);
  if (f.corner) continue;
  const along = f.ew && !f.ns ? z : x;
  const { B } = tops(x, z);
  const inn = inward(x, z);
  if (!inn) continue;
  const [ix, iz] = inn;
  if (isPerim(ix, iz)) continue;
  for (const rel of [1, 4]) {
    const y = B + rel;
    if (!isWin(x, z, y)) continue;
    if ((along + (rel === 4 ? 3 : 0)) % 6 !== 1) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Pass 4: rooftop mechanical penthouse, set back on interior cells, solid box with cap.
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (isPerim(x, z)) continue;
  if (x < 6 || x > 13 || z < 8 || z > 14) continue;
  const { T } = tops(x, z);
  g.set(x, T, z, "bricks");
  g.set(x, T + 1, z, "bricks");
  g.set(x, T + 2, z, "stone_bricks");
}

g.save(`${DIR}/DC70884.nbt`);
