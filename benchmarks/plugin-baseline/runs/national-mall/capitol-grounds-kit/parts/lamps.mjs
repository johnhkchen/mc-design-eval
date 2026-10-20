// Lamps and lighting (plan.md part 6): lamp posts along the walks and pool coping, hanging lanterns under the terrace
// cornices. Every write goes into air only (lampPost and the lantern checks below), so a cell an earlier part
// fills is skipped, not cut through. The view corridor z44..80 takes only the central walk's posts (plan 13).
import { lampPost } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = /(^|:)(cave_)?air$/;

// The top block's y in a column: the walk, lawn, paving or coping surface the earlier parts laid (never above y 20).
function topY(g, x, z) {
  for (let y = 20; y >= 0; y--) if (!AIR.test(g.blockAt(x, y, z))) return y;
  return 0;
}

// A post at (x, z) on its own ground top; skipped in the corridor unless the caller allows it. A walk's bottom slab
// is not a footing (half a block of air under the post), so a post on a walk steps one or two cells off it, on the
// lawn, staying out of the corridor.
function post(g, x, z, { corridor = false } = {}) {
  const onSlab = (px, pz) => /slab/.test(g.blockAt(px, topY(g, px, pz), pz));
  const ok = (px, pz) => (corridor || pz < 44 || pz > 80) && !onSlab(px, pz);
  for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) {
    if (ok(x + dx, z + dz)) return lampPost(g, x + dx, z + dz, { H: topY(g, x + dx, z + dz) });
  }
}

// Catmull-Rom through the plan points, sampled into a dense polyline of [x, z] points.
function spline(points, steps = 20) {
  const out = [];
  const P = [points[0], ...points, points[points.length - 1]];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

// A post every `every` cells of arc length along a polyline, alternating sides, `offset` cells off the centreline
// (just outside a 3-wide walk).
function postsAlong(g, line, { every = 10, offset = 2 } = {}) {
  let acc = every / 2, side = 1;
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1], [bx, bz] = line[i];
    const len = Math.hypot(bx - ax, bz - az) || 1;
    acc += len;
    if (acc < every) continue;
    acc = 0;
    const nx = -(bz - az) / len, nz = (bx - ax) / len;
    post(g, Math.round(bx + side * offset * nx), Math.round(bz + side * offset * nz));
    side = -side;
  }
}

// A hanging lantern at (x, y, z) under a solid block; refused unless the cell is air and the block above is solid.
function hangLantern(g, x, y, z) {
  if (!AIR.test(g.blockAt(x, y, z)) || AIR.test(g.blockAt(x, y + 1, z))) return false;
  g.set(x, y, z, ...B.lantern(true));
  return true;
}

export function build(g) {
  // 1. Central axial walk: posts on both sides of the walk (z 57 and z 65), alternating every 10 along x 71..155.
  for (let x = 76; x <= 146; x += 10) post(g, x, 57, { corridor: true });
  for (let x = 86; x <= 146; x += 10) post(g, x, 65, { corridor: true });

  // 2. Curving walks: Pennsylvania Avenue (north) and Maryland Avenue (south, mirrored about z 61.5, so z' = 123 - z).
  const north = [[70, 30], [85, 24], [100, 21], [120, 21], [138, 25], [150, 31], [155, 36]];
  const arcs = [spline(north), spline(north.map(([x, z]) => [x, 123 - z]))];
  for (const line of arcs) postsAlong(g, line);

  // 3. Pool walk (x 16..17 and 58..59): posts beside it on the lawn side, outside the corridor.
  for (const z of [14, 24, 34, 94, 104]) { post(g, 15, z); post(g, 60, z); }

  // 4. Plaza cross walk (x 70..72): posts on both sides of it, alternating.
  for (const z of [14, 24, 34, 94, 104]) post(g, 73, z);
  for (const z of [19, 29, 39, 99, 109]) post(g, 69, z);

  // 5. Cross walk at the terrace foot (x 150..155): posts on the lawn side.
  for (const z of [14, 24, 34, 94, 104]) post(g, 148, z);

  // 6. Pool coping (outer row x 18 and x 57), every 12 cells, outside the corridor (z 44..80).
  for (const z of [20, 32, 44, 56, 68, 80, 92, 104]) { post(g, 18, z, { corridor: true }); post(g, 57, z, { corridor: true }); }

  // 7. Lawn grid: thin posts every 10 cells over the two lawns (x 74..144, z 31..92, mirrored about z 61.5), so no
  //    lawn cell is left at light 0. Inside the corridor these are the thin posts plan 19 allows. A post keeps 2.5 cells
  //    clear of the walks (the central walk and the arcs), so no post stands on a walk.
  const walkNear = (x, z) => arcs.some((line) => line.some(([ax, az]) => Math.hypot(ax - x, az - z) < 2.5))
    || (x >= 70 && x <= 156 && z >= 55 && z <= 67);
  // The trunk centres of the Trees table (plan): no lamp within 3 cells of a trunk, so the grove keeps its walk-free ground.
  const TRUNKS = [[78,8],[90,5],[104,9],[117,6],[131,10],[143,6],[152,15],[96,15],[125,16],[140,17],[75,18],
    [78,116],[90,119],[104,115],[117,118],[131,114],[143,118],[152,109],[96,109],[125,108],[140,107],[75,106],
    [110,32],[128,36],[146,42],[86,38],[110,92],[128,88],[146,82],[86,86],[6,4],[12,118],[65,5],[66,119],[8,40],[8,84],[156,10],[156,114]];
  const nearTrunk = (x, z) => TRUNKS.some(([tx, tz]) => Math.max(Math.abs(tx - x), Math.abs(tz - z)) <= 3);
  const free = (x, z) => !walkNear(x, z) && !nearTrunk(x, z);
  for (const z of [31, 41, 51, 72, 82, 92]) for (let x = 74; x <= 144; x += 10) if (free(x, z)) post(g, x, z, { corridor: true });
  // 7b. Grove strips and the west lawn: posts on a 10 grid where the lawn has no light (the north and south groves at
  //     z 4 and z 119, the west lawn at x 4 and x 13), kept off the trunks and walks.
  for (const z of [4, 119]) for (let x = 74; x <= 144; x += 10) if (free(x, z)) post(g, x, z, { corridor: true });
  for (const x of [4, 13]) for (let z = 6; z <= 116; z += 10) if (free(x, z)) post(g, x, z, { corridor: true });
  // 7c. Pool and plaza edges still dark: a row either side of the north and south ends of the pool (z 11 and z 112),
  //     posts on the plaza in the corridor (x 68, between the central walk and the Grant platform), and two edge posts.
  for (const z of [11, 112]) for (const x of [24, 34, 44, 54, 64, 84, 94, 100, 110, 120]) if (free(x, z)) post(g, x, z, { corridor: true });
  for (const z of [5, 118]) for (const x of [20, 30, 40, 50]) if (free(x, z)) post(g, x, z, { corridor: true });
  // The box corners: posts 2 cells in from each corner, where the west lawn's grid is cut by the grove trunks.
  for (const [x, z] of [[10, 2], [2, 10], [10, 121], [2, 113]]) if (free(x, z)) post(g, x, z, { corridor: true });
  for (const z of [57, 67, 87]) post(g, 68, z, { corridor: true });
  post(g, 57, 3, { corridor: true });
  post(g, 62, 2, { corridor: true });

  // 8. Terrace cornices: a hanging lantern under each Tier 1 (x 158) and Tier 2 (x 170) cornice, every 8 cells.
  //    Refused where the cornice is absent (a stair gap, a planting bed, a fountain).
  for (let z = 14; z <= 110; z += 8) hangLantern(g, 158, 8, z);
  for (let z = 30; z <= 94; z += 8) hangLantern(g, 170, 10, z);
  return g;
}
