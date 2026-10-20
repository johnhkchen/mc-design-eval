// Part 2: Corner shell and roof. Plot 1 (THE CORNER MARKET): C1..C4 shells down to the ground, a stone plinth to the
// floor level, brick walls with quoins, the arch and window openings left unplaced for P4, a cornice, the parapet
// ring, two chimney stacks and the stair house. Every write goes into air; the ground stays as layGround set it.
import { groundAt, onFootprint, parapetCap, chimneyStack, stairHouse, cornice, quoins } from "../vocab.mjs";

// wall planes (inclusive). The street faces are the west (Pike Place) of every mass and the south (Pike Street) of
// C3 and C4; the footprint edge is one cell outside the west plane (projection band). Floor = the ground-storey floor.
const MASSES = [
  { name: "C1", x0: 78, x1: 111, z0: 30, z1: 53, floor: 7, arches: [[32, 37], [40, 45], [48, 53]] },
  { name: "C2", x0: 72, x1: 108, z0: 54, z1: 77, floor: 5, arches: [[56, 61], [64, 69], [72, 77]] },
  { name: "C3", x0: 66, x1: 102, z0: 78, z1: 94, floor: 3, arches: [[80, 85], [88, 93]] },
  { name: "C4", x0: 86, x1: 102, z0: 94, z1: 100, floor: 3, arches: [] },
];

// south (Pike Street) arch bays: the wall plane z and its arch spans in x
const SOUTH = [
  { z: 94, floor: 3, spans: [[68, 73], [76, 81]] },
  { z: 100, floor: 3, spans: [[88, 93], [96, 101]] },
];

const ROOF = 32; // deck course
const inSpans = (t, spans) => spans.some(([a, b]) => t >= a && t <= b);
// 2 windows per 6-wide arch bay, over the arch (at a..a+1 and a+4..a+5)
const inWindowSpans = (t, spans) => spans.some(([a, b]) => (t >= a && t <= a + 1) || (t >= a + 4 && t <= b));
const inWindowRows = (y) => (y >= 18 && y <= 22) || (y >= 26 && y <= 30);

// the openings of the street faces: left unplaced here, so P4 can carve the arches and glaze the windows
function opening(x, z, y) {
  for (const m of MASSES) {
    if (x === m.x0) {
      if (y > m.floor && y <= 15 && inSpans(z, m.arches)) return true;
      if (inWindowRows(y) && inWindowSpans(z, m.arches)) return true;
    }
  }
  for (const s of SOUTH) {
    if (z === s.z) {
      if (y > s.floor && y <= 15 && inSpans(x, s.spans)) return true;
      if (inWindowRows(y) && inWindowSpans(x, s.spans)) return true;
    }
  }
  // C1 north and every east (uphill) face: plain upper windows, 2 wide in each 8, kept off the corner quoins (offset 3..4)
  for (const m of MASSES) {
    if (!inWindowRows(y)) continue;
    if (x === m.x1 && z > m.z0 && z < m.z1 && [3, 4].includes((z - m.z0) % 8)) return true;
    if (m.name === "C1" && z === m.z0 && x > m.x0 && x < m.x1 && [3, 4].includes((x - m.x0) % 8)) return true;
  }
  return false;
}

export function build(g) {
  // the plan of the walls: the ring of each mass is wall, the rest interior; walls win where masses meet
  const cells = new Map();
  for (const m of MASSES) {
    for (let x = m.x0; x <= m.x1; x++) {
      for (let z = m.z0; z <= m.z1; z++) {
        const k = `${x},${z}`;
        const prev = cells.get(k);
        const wall = x === m.x0 || x === m.x1 || z === m.z0 || z === m.z1;
        cells.set(k, { x, z, m: prev ? prev.m : m, wall: wall || (prev ? prev.wall : false) });
      }
    }
  }

  let n = 0;
  for (const { x, z, m, wall } of cells.values()) {
    if (!onFootprint(x, z)) continue;
    const h = groundAt(x, z);
    if (h === null || h === undefined) continue;
    for (let y = h + 1; y <= ROOF; y++) {
      if (!wall) {
        // interior: floor courses at 16 and 24, the roof deck at 32; the rest is air (stalls and rooms)
        if (y === 16 || y === 24) { g.set(x, y, z, "stone_bricks"); n++; }
        else if (y === ROOF) { g.set(x, y, z, (x + z) % 2 ? "polished_andesite" : "stone_bricks"); n++; }
        continue;
      }
      if (opening(x, z, y)) continue;
      let b;
      if (y <= Math.max(h + 2, m.floor)) b = (x + z + y) % 11 === 0 ? "mossy_stone_bricks" : "stone_bricks";
      else if (y === 16 || y === 24) b = "smooth_sandstone";
      else b = "bricks";
      g.set(x, y, z, b); n++;
    }
  }
  console.log(`corner shell: ${n} blocks`);

  // quoins at every corner of every mass
  for (const m of MASSES) {
    for (const [x, z] of [[m.x0, m.z0], [m.x1, m.z0], [m.x0, m.z1], [m.x1, m.z1]]) {
      const h = groundAt(x, z);
      if (h === null || h === undefined) continue;
      quoins(g, [x, z], h + 1, ROOF);
    }
  }

  // cornice at y 31 (stairs) with dentils at 30, one proud of the wall in the edge band
  for (const m of MASSES) {
    if (m.name === "C1") {
      cornice(g, { x0: m.x0 - 1, x1: m.x1, z0: m.z0, z1: m.z1, y: 31, face: "west" });
      cornice(g, { x0: m.x0, x1: m.x1 + 1, z0: m.z0, z1: m.z1, y: 31, face: "east" });
      cornice(g, { x0: m.x0, x1: m.x1, z0: m.z0 - 1, z1: m.z1, y: 31, face: "north" });
    } else if (m.name === "C2") {
      cornice(g, { x0: m.x0 - 1, x1: m.x1, z0: m.z0, z1: m.z1, y: 31, face: "west" });
      cornice(g, { x0: m.x0, x1: m.x1 + 1, z0: m.z0, z1: m.z1, y: 31, face: "east" });
    } else if (m.name === "C3") {
      cornice(g, { x0: m.x0 - 1, x1: m.x1, z0: m.z0, z1: m.z1, y: 31, face: "west" });
      cornice(g, { x0: m.x0, x1: m.x1 + 1, z0: m.z0, z1: m.z1, y: 31, face: "east" });
      cornice(g, { x0: 66, x1: 85, z0: m.z0, z1: m.z1 + 1, y: 31, face: "south" });
    } else {
      cornice(g, { x0: m.x0, x1: m.x1 + 1, z0: m.z0, z1: m.z1, y: 31, face: "east" });
      cornice(g, { x0: m.x0, x1: m.x1, z0: m.z0, z1: m.z1 + 1, y: 31, face: "south" });
    }
  }

  // parapet: brick at 33, smooth sandstone slab coping at 34 round each roof edge
  for (const m of MASSES) parapetCap(g, { box: [m.x0, m.z0, m.x1, m.z1], y0: 33, y1: 34, coping: "smooth_sandstone_slab" });

  // roof furniture: two chimney stacks and the stair house
  chimneyStack(g, { at: [80, 40], y0: 33, y1: 38 });
  chimneyStack(g, { at: [98, 86], y0: 33, y1: 38 });
  stairHouse(g, { box: [92, 33, 60, 97, 37, 65] });
}
