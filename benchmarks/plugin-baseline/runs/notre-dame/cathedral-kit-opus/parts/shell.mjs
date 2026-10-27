// P1 Masonry shell (plan.md PARTS): masses M1..M21 except the spire, piers with set-offs, every opening as air.
// Every helper runs on a view of the grid that reports "not air" outside the FOOTPRINT and in the HOLES (openings and
// RESERVED cells), so air-only helpers leave them untouched: recess by exclusion, never a stored air cell.
import {
  inFootprint, plinthCourse, ashlarWall, flankBay, setoffPier, radialPier, stoneGable, polygonWall, polarWall,
  radialChapel, octagonRing, lancet, belfryLancet, portal, roseWindow,
} from "../vocab.mjs";
import { groundAt } from "../vocab/h1.mjs";

const C = [152, 38];
const N = (z) => 76 - z;
const holes = [];
const hole = (f) => holes.push(f);
const inBox = (x, y, z, [x0, y0, z0, x1, y1, z1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1 && z >= z0 && z <= z1;
const holeBox = (b) => hole((x, y, z) => inBox(x, y, z, b));

function view(g) {
  return new Proxy(g, {
    get(t, k) {
      if (k === "isAir") return (x, y, z) => inFootprint(x, z) && !holes.some((f) => f(x, y, z)) && t.isAir(x, y, z);
      const v = t[k];
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
}
const box = (x0, y0, z0, x1, y1, z1) => [[x0, y0, z0], [x1, y1, z1]];
// a hollow rectangle of walls `t` thick, x0..x1 / z0..z1, y0..y1
function hollow(v, x0, z0, x1, z1, y0, y1, t = 1) {
  ashlarWall(v, box(x0, y0, z0, x1, y1, z0 + t - 1));
  ashlarWall(v, box(x0, y0, z1 - t + 1, x1, y1, z1));
  ashlarWall(v, box(x0, y0, z0, x0 + t - 1, y1, z1));
  ashlarWall(v, box(x1 - t + 1, y0, z0, x1, y1, z1));
}

const NAVE_PIERS = [32, 40, 48, 56, 64, 72, 80], CHOIR_PIERS = [112, 120, 128, 136, 144];

export function build(g) {
  const v = view(g);

  // ---- RESERVED cells and openings (holes) ----
  for (const p of [...NAVE_PIERS, ...CHOIR_PIERS]) {
    holeBox([p, 33, 51, p, 46, 64]); holeBox([p, 33, 12, p, 46, 25]);          // flyer zones
    holeBox([p, 39, 65, p + 1, 47, 69]); holeBox([p, 39, 7, p + 1, 47, 11]);    // pier pinnacles
    holeBox([p, 37, 50, p + 1, 47, 52]); holeBox([p, 37, 24, p + 1, 47, 26]);   // wall buttress + gargoyle
  }
  holeBox([90, 48, 34, 98, 137, 42]);                                            // spire
  holeBox([2, 23, 12, 2, 27, 64]);                                               // kings: front plane
  hole((x, y, z) => x === 3 && y >= 23 && y <= 26 && z >= 12 && z <= 64 && z % 2 === 0);
  holeBox([2, 47, 10, 3, 57, 66]);                                               // Grand Gallery + cornices
  hole((x, y, z) => x >= 2 && x <= 4 && Math.hypot(y - 39, z - 38) <= 6.5);      // west rose disc
  for (const zf of [66, 67, 10, 9]) hole((x, y, z) => z === zf && Math.hypot(x - 94, y - 40) <= 6.5); // transept roses
  for (const zf of [66, 67, 10, 9]) hole((x, y, z) => z === zf && Math.abs(x - 94) <= 1 && y >= 51 && y <= 53); // gable roses
  // chevet flyer lines r 12..26 (radial, 1 thick) and the apse vertex buttresses
  for (const a of [-90, -54, -18, 18, 54, 90]) {
    const t = (a * Math.PI) / 180;
    hole((x, y, z) => {
      if (y < 33 || y > 46) return false;
      const dx = x - C[0], dz = z - C[1], r = Math.hypot(dx, dz);
      if (r < 11.5 || r > 26.5) return false;
      return Math.abs(-dx * Math.sin(t) + dz * Math.cos(t)) <= 0.5 && dx * Math.cos(t) + dz * Math.sin(t) > 0;
    });
  }
  // portals: west three (door plane x 6), transepts (door plane z 66 / 10)
  const portals = [
    { at: [6, 3, 38], face: "west", w: 7, h: 12, archTop: 20, rings: 5, trumeau: true },
    { at: [6, 3, 21], face: "west", w: 5, h: 10, archTop: 18, rings: 5 },
    { at: [6, 3, 55], face: "west", w: 5, h: 10, archTop: 18, rings: 5 },
    { at: [94, 3, 66], face: "south", w: 3, h: 9, archTop: 17, rings: 2, step: 2 },
    { at: [94, 3, 10], face: "north", w: 3, h: 9, archTop: 17, rings: 2, step: 2 },
  ];
  for (const p of portals) {
    const r = portal(g, { ...p, cellsOnly: true });
    const s = new Set((r.box ?? []).map((c) => c.join(",")));
    hole((x, y, z) => s.has(`${x},${y},${z}`));
  }
  holeBox([122, 3, 10, 123, 8, 11]);                                             // Porte Rouge

  // ---- piers first (their cells win over the walls they abut) ----
  for (const p of [...NAVE_PIERS, ...CHOIR_PIERS]) {
    setoffPier(v, { x: p, z0: 65, z1: 69, setoffs: [[69, 20], [68, 30], [67, 38]], face: "south" });
    setoffPier(v, { x: p, z0: 7, z1: 11, setoffs: [[7, 20], [8, 30], [9, 38]], face: "north" });
  }
  for (const x of [85, 101]) {                                                   // M10 transept front buttresses
    setoffPier(v, { x, z0: 68, z1: 69, setoffs: [[69, 20], [68, 54]], face: "south", width: 3 });
    setoffPier(v, { x, z0: 7, z1: 8, setoffs: [[7, 20], [8, 54]], face: "north", width: 3 });
  }
  for (const a of [-90, -54, -18, 18, 54, 90]) radialPier(v, { angle: a, r1: Math.abs(a) === 90 ? 31 : 33 });
  for (const z of [12, 29, 45, 62]) {                                            // four west buttresses (+2, to x 0)
    for (const [y0, y1] of [[3, 22], [29, 46], [58, 93]]) ashlarWall(v, box(0, y0, z, 1, y1, z + 2));
  }
  for (const x of [136, 145]) setoffPier(v, { x, z0: 108, z1: 109, y0: 1, setoffs: [[109, 8], [108, 14]], face: "south", width: 3 });

  // ---- west towers M1/M2 (belfry frames before the walls) ----
  for (const [zA, zB] of [[10, 30], [46, 66]]) {
    for (const [z0] of [[zA + 4], [zB - 6]]) belfryLancet(v, { box: [2, 62, z0, 3, 86, z0 + 2], face: "west" });
    for (const [z0] of [[zA + 4], [zB - 6]]) belfryLancet(v, { box: [21, 62, z0, 22, 86, z0 + 2], face: "east" });
    for (const x0 of [6, 16]) {
      belfryLancet(v, { box: [x0, 62, zA, x0 + 2, 86, zA + 1], face: "north" });
      belfryLancet(v, { box: [x0, 62, zB - 1, x0 + 2, 86, zB], face: "south" });
    }
    // the head's top row (y 86) is one cell wide: a louvre there has no jambs beside it, so leave it open over the pane
    for (const z0 of [zA + 4, zB - 6]) { g.set(2, 86, z0 + 1, "air"); g.set(22, 86, z0 + 1, "air"); }
    for (const x0 of [6, 16]) { g.set(x0 + 1, 86, zA, "air"); g.set(x0 + 1, 86, zB, "air"); }
    const zc0 = zA === 10 ? 10 : 65, zc1 = zc0 + 1;                               // stepped corner starts at x 5
    hole((x, y, z) => x < 5 && z >= zc0 && z <= zc1);
    // outer ring to 95 (the deck sits inside it at 95), inner ring to 94
    hollow(v, 2, zA, 22, zB, 3, 95, 1);
    hollow(v, 3, zA + 1, 21, zB - 1, 3, 94, 1);
    for (const y of [30, 57, 62]) ashlarWall(v, box(4, y, zA + 2, 20, y, zB - 2));
    // the tower front behind the gallery: the wall at x 4..5 where x 2..3 is the reserved colonnade
    ashlarWall(v, box(4, 47, zA, 5, 57, zB));
  }

  // ---- porch base M5, facade centre M3, west gable M4 ----
  ashlarWall(v, box(2, 3, 12, 8, 22, 64), { face: "west" });
  ashlarWall(v, box(2, 23, 12, 4, 28, 64));
  roseWindow(v, { center: [2, 39, 38], plane: "x", r: 6, glass: false });
  ashlarWall(v, box(2, 29, 31, 4, 46, 45));
  ashlarWall(v, box(4, 47, 31, 5, 57, 45));
  stoneGable(v, { axis: "z", at: 22, from: 27, to: 49, eaveY: 48, peakY: 63, face: "east", thick: 2 });

  // ---- nave + choir flanks (bay rhythm) ----
  const plain = (x0, x1, side) => {
    const Z = side === "N" ? N : (z) => z;
    ashlarWall(v, box(x0, 3, Z(65), x1, 18, Z(66)));
    ashlarWall(v, box(x0, 21, Z(58), x1, 31, Z(59)));
    ashlarWall(v, box(x0, 3, Z(48), x1, 47, Z(49)));
    ashlarWall(v, box(x0, 20, Z(50), x1, 20, Z(57)));
  };
  for (const side of ["S", "N"]) {
    plain(23, 23, side);
    for (const p of [24, 32, 40, 48, 56, 64, 72]) flankBay(v, { p, side });
    plain(80, 84, side);
    for (const p of [104, 112, 120, 128, 136, 144]) flankBay(v, { p, side });
  }

  // ---- transept M9 ----
  for (const x of [88, 90, 92, 96, 98, 100]) {                                  // triforium (odd x 89..99 and the ends)
    lancet(v, { x: x + 1, z: 67, y0: 28, w: 1, h: 4, face: "south" });
    lancet(v, { x: x + 1, z: 9, y0: 28, w: 1, h: 4, face: "north" });
  }
  lancet(v, { x: 88, z: 67, y0: 28, w: 1, h: 4, face: "south" }); lancet(v, { x: 88, z: 9, y0: 28, w: 1, h: 4, face: "north" });
  roseWindow(v, { center: [94, 40, 67], plane: "z", r: 6, glass: false });
  roseWindow(v, { center: [94, 40, 9], plane: "z", r: 6, glass: false });
  roseWindow(v, { center: [94, 52, 67], plane: "z", r: 1, glass: false });
  roseWindow(v, { center: [94, 52, 9], plane: "z", r: 1, glass: false });
  ashlarWall(v, box(85, 3, 66, 103, 47, 67), { face: "south" });
  ashlarWall(v, box(85, 3, 9, 103, 47, 10), { face: "north" });
  for (const x of [85, 102]) for (const [z0, z1] of [[11, 26], [50, 65]]) ashlarWall(v, box(x, 3, z0, x + 1, 47, z1));
  stoneGable(v, { axis: "x", at: 67, from: 85, to: 103, eaveY: 48, peakY: 57, face: "south", thick: 2 });
  stoneGable(v, { axis: "x", at: 9, from: 85, to: 103, eaveY: 48, peakY: 57, face: "north", thick: 2 });

  // ---- apse M14, ambulatory M15/M16, chapels M17 ----
  const verts = [[152, 49], [158, 47], [162, 41], [162, 35], [158, 29], [152, 27]];
  const mids = verts.slice(1).map(([x, z], i) => [(x + verts[i][0]) / 2, (z + verts[i][1]) / 2]);
  polygonWall(v, {
    verts, y0: 3, y1: 47, thick: 2,
    skip: (x, y, z) => y >= 38 && y <= 45 && mids.some(([mx, mz]) => Math.hypot(x - mx, z - mz) <= 1.9),
  });
  const facetAngles = [-72, -36, 0, 36, 72];
  const near = (x, z, r) => facetAngles.some((a) => {
    const t = (a * Math.PI) / 180;
    return Math.abs(-(x - C[0]) * Math.sin(t) + (z - C[1]) * Math.cos(t)) <= 0.5 && (x - C[0]) * Math.cos(t) + (z - C[1]) * Math.sin(t) > r;
  });
  const tribOpen = (x, y, z) => y >= 26 && y <= 28 && near(x, z, 15);
  hole(tribOpen);
  polarWall(v, { r0: 17.6, r1: 19.5, y0: 3, y1: 31 });                           // tribune wall
  holes.pop();
  polarWall(v, { r0: 11.5, r1: 17.5, y0: 20, y1: 20 });                          // tribune floor
  for (const a of [0, 36, -36, 72, -72]) radialChapel(v, { angle: a, roof: false, pinnacles: false });
  hole((x, y, z) => near(x, z, 20) && y >= 3 && y <= 19);                       // chapel mouths stay open
  polarWall(v, { r0: 24.6, r1: 26.5, y0: 3, y1: 18 });                           // outer ambulatory wall
  holes.pop();

  // ---- sacristy M18..M20, stair turret M21 ----
  const wins = (x, y, z) => y >= 6 && y <= 10 && ((z === 107 || z === 99 || z === 79) && x % 4 < 2 || x === 149 && z % 4 < 2);
  hole(wins);
  holeBox([141, 2, 107, 143, 6, 107]);
  hollow(v, 122, 70, 142, 79, 2, 10);
  hollow(v, 115, 80, 134, 99, 2, 11);
  hollow(v, 135, 80, 149, 107, 2, 16);
  holes.pop(); holes.pop();
  for (let y = 2; y <= 50; y++) octagonRing(v, { cx: 106.5, cz: 70.5, y, w: 4, cut: 1, block: "smooth_sandstone" });

  // ---- plinths to the local ground under every column the shell stands on (1 proud) ----
  const cols = new Set();
  const [X, , Z] = [g.size?.[0] ?? 189, 0, g.size?.[2] ?? 111];
  for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
    let hit = false;
    for (let y = 1; y <= 8 && !hit; y++) if (!g.isAir(x, y, z) && y >= groundAt(x, z)) hit = true;
    if (!hit) continue;
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) cols.add(`${x + dx},${z + dz}`);
  }
  for (let x = 23; x <= 152; x++) for (let z = 10; z <= 66; z++) cols.add(`${x},${z}`);   // nave/choir/transept floors
  for (let x = 152; x <= 178; x++) for (let z = 12; z <= 64; z++) if (Math.hypot(x - 152, z - 38) <= 26) cols.add(`${x},${z}`);
  for (const k of cols) {
    const [x, z] = k.split(",").map(Number);
    if (!inFootprint(x, z) || x < 0 || z < 0 || x >= X || z >= Z) continue;
    plinthCourse(v, x, z, x, z, { top: z >= 70 ? 2 : 3 });
  }
}
