// P1 KOMO shells. Both plots are described as masses; a cell is owned by the first mass that covers it (curtain drums and
// bows first), a wall is an owned cell with an unowned 4-neighbour at the same y, floors fill the interior at storey ys.
import { WHITE_CONCRETE, LIGHT_GRAY_CONCRETE, GRAY_CONCRETE, GRAY_STAINED_GLASS_PANE, CYAN_STAINED_GLASS, GLASS, POLISHED_DIORITE } from "../vocab.mjs";

const F = [0, 7, 12, 17, 22, 27, 32];
const F37 = [...F, 37];
const RINGS = new Set([7, 12, 17, 22, 27, 32, 37, 41]);
const disk = (cx, cz, r) => (x, z) => (x - cx) ** 2 + (z - cz) ** 2 <= r * r + r;
const rect = (x0, x1, z0, z1) => (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1;

function komoE() {
  const full = (x, z) => rect(25, 103, 4, 47)(x, z) || rect(4, 24, 32, 47)(x, z);
  const bow = (x, z) => z <= 3 && (x - 61.5) ** 2 + (z - 26.5) ** 2 <= 702.25;
  return [
    { id: "drum", curtain: true, top: 41, roof: false, floors: F37, has: disk(13, 20, 11) },
    { id: "nbow", curtain: true, top: 37, roof: true, floors: F, has: bow },
    { id: "north", top: 37, roof: true, floors: F,
      has: (x, z, y) => full(x, z) && (y > 6 || (x <= 101 && (z >= 6 || (x >= 48 && x <= 75))))},
    { id: "wing", top: 32, roof: true, floors: F, noFloor: (x, z, y) => y === 7 && rect(60, 99, 60, 100)(x, z),
      has: (x, z, y) => rect(56, 103, 48, 115)(x, z) && (y > 6 || x <= 101) },
    { id: "podium", top: 12, roof: true, floors: [0, 7], has: rect(44, 55, 48, 59) },
    { id: "tail", top: 17, roof: true, floors: [0, 7, 12], has: rect(72, 103, 116, 123) },
  ];
}
function komoW() {
  return [
    { id: "wbow", curtain: true, top: 41, roof: false, floors: F37, has: (x, z) => z <= 14 && disk(127, 14, 13)(x, z) },
    { id: "wbody", top: 37, roof: true, floors: F, has: (x, z, y) => rect(109, 144, 12, 51)(x, z) && (y > 6 || x <= 142) },
    { id: "wpodium", top: 12, roof: true, floors: [0, 7], has: rect(105, 151, 52, 61) },
  ];
}

// door cells (air, y 1..2): [x0,x1,z0,z1]
const DOORS = [[12, 13, 9, 9], [61, 62, 0, 0], [101, 101, 30, 31], [101, 101, 80, 81], [56, 56, 90, 91], [126, 127, 1, 1], [142, 142, 30, 31]];
const isDoor = (x, y, z) => y <= 2 && DOORS.some(([a, b, c, d]) => x >= a && x <= b && z >= c && z <= d);

const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

function buildMasses(g, masses, box) {
  const owner = (x, y, z) => { for (const m of masses) if (y <= m.top && y >= 0 && m.has(x, z, y)) return m; return null; };
  const exp = (x, y, z) => DIRS.filter(([, dx, dz]) => !owner(x + dx, y, z + dz)).map((d) => d[0]);
  const sameWall = (x, y, z, m, d) => { const o = owner(x, y, z); if (o !== m) return false; const e = exp(x, y, z); return e.length === 1 && e[0] === d; };
  const [bx0, bx1, bz0, bz1, by1] = box;
  for (let y = 0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) for (let z = bz0; z <= bz1; z++) {
    const m = owner(x, y, z); if (!m) continue;
    const e = exp(x, y, z);
    if (y === 0) { if (!e.length) g.set(x, 0, z, POLISHED_DIORITE); continue; }
    if (y === m.top) { if (m.roof) g.set(x, y, z, WHITE_CONCRETE); continue; }
    if (!e.length) {
      if (m.floors.includes(y) && !(m.noFloor && m.noFloor(x, z, y))) g.set(x, y, z, POLISHED_DIORITE);
      continue;
    }
    if (isDoor(x, y, z)) continue;
    if (m.curtain) {
      g.set(x, y, z, y <= 6 ? GLASS : RINGS.has(y) ? WHITE_CONCRETE : CYAN_STAINED_GLASS);
      continue;
    }
    if (y <= 6) { g.set(x, y, z, y === 6 ? GRAY_CONCRETE : GLASS); continue; }
    const s = [...F].reverse().find((f) => f <= y), r = y - s;
    if (r === 0 || r >= 4 || e.length > 1) { g.set(x, y, z, WHITE_CONCRETE); continue; }
    const d = e[0], alongX = d === "north" || d === "south", [ax, az] = alongX ? [1, 0] : [0, 1];
    let ok = true;
    for (const k of [-2, -1, 1, 2]) if (!sameWall(x + ax * k, y, z + az * k, m, d)) ok = false;
    if (!ok) { g.set(x, y, z, WHITE_CONCRETE); continue; }
    let k = 0; while (k < 400 && sameWall(x - ax * (k + 1), y, z - az * (k + 1), m, d)) k++;
    if ((k - 2) % 7 === 6) g.set(x, y, z, LIGHT_GRAY_CONCRETE);
    else g.set(x, y, z, GRAY_STAINED_GLASS_PANE, alongX ? { east: "true", west: "true" } : { north: "true", south: "true" });
  }
}

export function build(g) {
  buildMasses(g, komoE(), [0, 104, 0, 123, 41]);
  buildMasses(g, komoW(), [105, 151, 0, 61, 41]);
}
