// Way 1089409214, Mt Eden side of the CBD: a 1980s-style office tower on a glazed-curtain-wall grid. The lidar roof
// gives a 16-storey core (y 70), a 14-15 storey shoulder, 5-11 storey setbacks, and a 1-storey shopfront wing to the
// east (the street-level entrance). Build is on the footprint only: a solid foundation to the common floor datum
// (F = the highest lidar ground), 4-block storeys with a floor slab each, perimeter cells as the envelope (white
// spandrels, mullions on a 3-block grid, glass between), interior air behind the glass with a few warm lamps, and roof
// parapets, a roof plant room, and AC units on the setback roofs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1089409214.cells.json", "utf8"));
const X = 28, Y = 84, Z = 34, STOREY = 4, MAX_STOREYS = 16;
const F = Math.max(...cells.map((c) => c[2]));                     // common floor datum: the highest ground under the footprint
const key = (x, z) => `${x},${z}`;
const inFp = (x, z) => byKey.has(key(x, z));
const byKey = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof, n: 0 }]));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// storeys from the lidar roof: round to whole storeys above the datum, at least one
for (const c of byKey.values()) c.n = Math.min(MAX_STOREYS, Math.max(1, Math.round((c.roof - F) / STOREY)));

// smooth lidar noise: a cell whose height matches none of its footprint neighbours takes their most common height
for (const c of byKey.values()) {
  const nb = DIRS.map(([dx, dz]) => byKey.get(key(c.x + dx, c.z + dz))).filter(Boolean);
  if (nb.length < 2 || nb.some((o) => o.n === c.n)) continue;
  const counts = new Map(); for (const o of nb) counts.set(o.n, (counts.get(o.n) || 0) + 1);
  c.n = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
}

// the outward faces of a cell at storey s: off the footprint, or against a neighbour that stops below this storey
const exposed = (x, z, s) => DIRS.filter(([dx, dz]) => { const o = byKey.get(key(x + dx, z + dz)); return !o || o.n <= s; });
const outside = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));

// the entrance: the east shopfront wing (ground 5, one storey) faces the street; double doors on its east face
const DOOR = new Map([[key(25, 15), "right"], [key(25, 16), "left"]]);
const CANOPY = [14, 15, 16];

const g = new Voxels([X, Y, Z]);
const glassFor = (s) => (s % 2 ? "gray_stained_glass" : "light_blue_stained_glass");

for (const c of byKey.values()) {
  const { x, z, n } = c;
  // foundation: solid from y 0 up to the datum (the cell's own ground is inside it), a stone base course at the top
  const out = outside(x, z).length > 0;
  for (let y = 0; y < F; y++) {
    const block = !out ? "stone" : y === F - 1 ? "polished_andesite" : "stone_bricks";
    g.set(x, y, z, block);
  }

  // storeys: a floor slab at each storey line (on the cell below, all the way down), the envelope on exposed faces
  for (let s = 0; s < n; s++) {
    const yb = F + STOREY * s;
    const ex = exposed(x, z, s);
    g.set(x, yb, z, ex.length ? "white_concrete" : "light_gray_concrete");
    if (!ex.length) continue;

    // mullions sit on a 3-block grid along the wall: an x-facing wall's columns step with z, a z-facing wall's with x
    const xFace = ex.some(([dx]) => dx !== 0), zFace = ex.some(([, dz]) => dz !== 0);
    const pillar = (xFace && zFace) || (xFace ? z % 3 === 0 : x % 3 === 0);
    const door = s === 0 && DOOR.has(key(x, z));
    if (door) {
      g.set(x, yb + 1, z, "iron_door", { facing: "east", half: "lower", hinge: DOOR.get(key(x, z)), open: "false", powered: "false" });
      g.set(x, yb + 2, z, "iron_door", { facing: "east", half: "upper", hinge: DOOR.get(key(x, z)), open: "false", powered: "false" });
    } else {
      for (let y = yb + 1; y <= yb + 2; y++) g.set(x, y, z, pillar ? "white_concrete" : s === 0 ? "glass" : glassFor(s));
    }
    // transom or canopy band over the storey's glass
    g.set(x, yb + 3, z, s === 0 && CANOPY.includes(z) && x === 25 ? "gray_concrete" : "white_concrete");

    // warm light behind some glazing: a lamp in the room just inside (air behind the glass)
    const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
    const inner = byKey.get(key(ix, iz));
    if (!door && !pillar && inner && inner.n > s && !exposed(ix, iz, s).length && ((x * 5 + z * 3 + s * 7) % 9 === 0)) {
      g.set(ix, yb + 2, iz, (x + z + s) % 2 ? "glowstone" : "shroomlight");
    }
  }

  // roof: a slab at the top of the storeys, a parapet on the outward edges, plant and AC units on the setbacks
  const T = F + STOREY * n;
  g.set(x, T, z, "light_gray_concrete");
  if (out) g.set(x, T + 1, z, "white_concrete");
  if (!out && c.roof >= 71 && n === MAX_STOREYS) g.set(x, T + 1, z, "gray_concrete");
  else if (!out && n >= 5 && (x % 5 === 2) && (z % 6 === 3)) g.set(x, T + 1, z, "iron_block");
}

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1089409214.nbt");
const storeyCounts = {}; for (const c of byKey.values()) storeyCounts[c.n] = (storeyCounts[c.n] || 0) + 1;
console.log(JSON.stringify({ cells: byKey.size, F, blocks, palette, storeyCounts }));
