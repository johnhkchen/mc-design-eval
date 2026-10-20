// Part 3: facades. The office bay grid on every exposed wing face (12-storey wings, central block, 3-storey podia),
// ground-storey glazing, tower faces with slot windows, joints and quoins, lit windows, the courtyard doors, the podium
// and east entries, and the spur pavilions. Writes only into air, so the shell's core and earlier parts are never cut.
// Exposure: a face bay is dressed for a storey only where the cell outside it is open (no mass at or above that storey).
import {
  SIZE, STOREY_FLOORS, rng, officeBay, groundBay, stringCourse, towerFace, quoin, litWindow, spurPavilion, litEntry,
  doubleDoor,
} from "../vocab.mjs";

// the same mass table as shell.mjs: [id, x0, x1, z0, z1, top]
const M = [
  ["M2", 81, 125, 27, 35, 17], ["M3", 45, 105, 36, 54, 64], ["T1", 27, 44, 36, 62, 69], ["T2", 106, 125, 36, 54, 69],
  ["M4", 36, 55, 63, 116, 64], ["M4a", 36, 44, 55, 62, 69], ["M5", 106, 125, 55, 116, 64], ["M6", 45, 179, 117, 134, 64],
  ["T3", 27, 44, 117, 152, 69], ["T3a", 18, 26, 126, 134, 64], ["T4", 180, 197, 117, 152, 69], ["M7", 63, 134, 135, 242, 69],
  ["M8", 18, 62, 162, 215, 64], ["M9", 135, 179, 162, 215, 64], ["T5", 180, 197, 162, 215, 69], ["M10", 45, 179, 233, 251, 64],
  ["T6", 27, 44, 225, 251, 69], ["T6a", 18, 26, 243, 251, 64], ["T7", 180, 197, 225, 251, 69], ["T7a", 198, 202, 243, 251, 64],
  ["M11", 36, 55, 252, 314, 64], ["M12", 106, 125, 252, 314, 64], ["M13", 45, 105, 315, 332, 64], ["T8", 27, 44, 315, 332, 69],
  ["T9", 106, 125, 315, 332, 69], ["M14a", 72, 125, 333, 341, 17], ["M14b", 81, 125, 342, 350, 17],
];
const SPURS = [["M1", 81, 89, 0, 26, 12], ["M15", 81, 89, 351, 374, 12]];
// openings the shell leaves empty (plan OPENINGS): [x0,y0,z0,x1,y1,z1]; the facade skips its bays there
const OPEN = [
  [49, 2, 84, 61, 4, 85], [100, 2, 84, 112, 4, 85], [49, 2, 282, 61, 4, 283], [100, 2, 282, 112, 4, 283],
  [187, 2, 186, 197, 5, 191], [100, 2, 346, 105, 5, 350], [100, 2, 27, 105, 5, 31],
];
const inOpen = (x, y, z) => OPEN.some(([a, b, c, d, e, f]) => x >= a && x <= d && y >= b && y <= e && z >= c && z <= f);
// the west front's entrance hall and portico are the portico part's: no facade bays across z 170..207 at the hall height
const inHall = (x, z, fl) => x === 18 && z >= 170 && z <= 207 && fl <= 12;

const PODIUM_FLOORS = [7];
const GROUND_FLOOR = 2;

export function build(g) {
  const W = SIZE[0], D = SIZE[2];
  const H = Array.from({ length: W }, () => new Int16Array(D));
  for (const [, x0, x1, z0, z1, top] of [...M, ...SPURS]) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (top > H[x][z]) H[x][z] = top;
  }
  const top = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : H[x][z]);
  const rnd = rng(31);
  const stats = { bays: 0, lit: 0, ground: 0, towers: 0, podia: 0 };

  // the openings first, so the facade bays and tower faces skip them (air-only writes)
  litEntry(g, [197, 2, 186, 197, 5, 191], "east", { canopy: true });
  litEntry(g, [100, 2, 350, 105, 5, 350], "south");
  litEntry(g, [100, 2, 27, 105, 5, 27], "north");
  doubleDoor(g, [55, 2, 84], "west");
  doubleDoor(g, [106, 2, 84], "east");
  doubleDoor(g, [55, 2, 282], "west");
  doubleDoor(g, [106, 2, 282], "east");

  // the faces of a box: plane = the wall plane coordinate, [from, to] along it, out = the outward step
  const faces = (x0, x1, z0, z1) => [
    { face: "north", plane: z0, from: x0, to: x1, out: [0, -1], along: "x" },
    { face: "south", plane: z1, from: x0, to: x1, out: [0, 1], along: "x" },
    { face: "west", plane: x0, from: z0, to: z1, out: [-1, 0], along: "z" },
    { face: "east", plane: x1, from: z0, to: z1, out: [1, 0], along: "z" },
  ];
  // the cell at (along a, depth d, y) of a face; depth 0 is the wall plane, d > 0 goes inward
  const at = (f, a, d, y) => {
    const inward = -(f.out[0] + f.out[1]);
    return f.along === "x" ? [a, y, f.plane + inward * d] : [f.plane + inward * d, y, a];
  };
  // the origin argument of officeBay / groundBay: [x, z] of the pier on the wall plane
  const origin = (f, a) => at(f, a, 0, 0).filter((_, i) => i !== 1);
  const outOpen = (f, a, fl) => {
    for (let k = 0; k < 3; k++) {
      const [x, , z] = at(f, a + k, 0, 0);
      if (top(x + f.out[0], z + f.out[1]) >= fl + 2) return false;
    }
    return true;
  };

  // towers: slot faces on each exposed run of the tower's face, quoins at its corners
  for (const [id, x0, x1, z0, z1, ht] of M) {
    if (ht !== 69 || id === "M7") continue;
    for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) quoin(g, [px, pz], 2, 67);
    for (const f of faces(x0, x1, z0, z1)) {
      const exposed = [];
      for (let a = f.from; a <= f.to; a++) {
        const [x, , z] = at(f, a, 0, 0);
        exposed.push(top(x + f.out[0], z + f.out[1]) < 20);
      }
      let run = null;
      const flush = (end) => {
        if (run && end - run.from + 1 >= 5) {
          const [a0, a1] = [run.from, end];
          const inward = -(f.out[0] + f.out[1]);
          // the box spans the run along the face and the 3 cells inward (depth 0..2), in the box's own axis order
          const box = f.along === "x"
            ? [a0, 2, f.plane, a1, 67, f.plane + 2 * inward]
            : [f.plane, 2, a0, f.plane + 2 * inward, 67, a1];
          const norm = [Math.min(box[0], box[3]), 2, Math.min(box[2], box[5]), Math.max(box[0], box[3]), 67, Math.max(box[2], box[5])];
          stats.towers += towerFace(g, f.face, norm);
        }
        run = null;
      };
      exposed.forEach((ok, i) => {
        const a = f.from + i;
        if (ok) { if (!run) run = { from: a }; } else flush(a - 1);
      });
      flush(f.to);
    }
  }

  // wings and podia: the office bay grid, the lit windows and the ground-storey glazing
  for (const [id, x0, x1, z0, z1, ht] of M) {
    const podium = ht === 17;
    const wing = !podium && (ht === 64 || id === "M7");
    if (!podium && !wing) continue;
    const floors = podium ? PODIUM_FLOORS : STOREY_FLOORS;
    for (const f of faces(x0, x1, z0, z1)) {
      const street = f.face === "west" && id === "M8";
      // ground storey: glazing where the face is open at ground level and no door or entry is cut
      for (let a = f.from; a + 5 <= f.to; a += 6) {
        if (!outOpen(f, a, GROUND_FLOOR + 2)) continue;
        let blocked = false;
        for (let k = 0; k <= 5 && !blocked; k++) for (let y = 2; y <= 5; y++) {
          const [x, , z] = at(f, a + k, 0, y);
          if (inOpen(x, y, z) || (street && inHall(x, z, y))) blocked = true;
        }
        if (blocked) continue;
        stats.ground += groundBay(g, f.face, origin(f, a)).placed;
      }
      // office storeys
      for (let a = f.from; a + 2 <= f.to; a += 3) {
        for (const fl of floors) {
          if (!outOpen(f, a, fl)) continue;
          let blocked = false;
          for (let k = 0; k < 3; k++) for (let y = fl; y <= fl + 4; y++) {
            const [x, , z] = at(f, a + k, 0, y);
            if (inOpen(x, y, z) || (street && inHall(x, z, y))) blocked = true;
          }
          if (blocked) continue;
          stats.bays += officeBay(g, f.face, origin(f, a), fl).placed;
          // about one bay in six lit, most on the south and east faces, in pairs of windows along the storey
          const p = f.face === "south" || f.face === "east" ? 0.25 : 1 / 6;
          if (rnd() < p) {
            const kind = rnd() < 2 / 3 ? "shroomlight" : "sea_lantern";
            for (const k of [1, 2]) for (const y of [fl + 2, fl + 3]) stats.lit += litWindow(g, at(f, a + k, 2, y), kind);
          }
        }
      }
      // the string course at y 7 along the whole face (air-only: it sits proud in the open)
      stringCourse(g, f.face, f.plane, [f.from, f.to], 7);
      // podium walls above the storeys to the roof edge: smooth sandstone where open
      if (podium) {
        for (let a = f.from; a <= f.to; a++) {
          if (!outOpen(f, a, 12)) continue;
          for (let y = 12; y <= 15; y++) {
            const [x, , z] = at(f, a, 0, y);
            if (g.isAir(x, y, z)) g.set(x, y, z, "smooth_sandstone");
          }
        }
        stats.podia++;
      }
    }
  }

  // spurPavilion's skylight is written as the bare id "glass" (not in the palette): a view of the grid maps it to office glass
  const spurGrid = Object.create(g);
  spurGrid.set = (x, y, z, block, ...rest) => g.set(x, y, z, block === "glass" ? "gray_stained_glass" : block, ...rest);
  spurPavilion(spurGrid, [81, 0, 89, 26]);
  spurPavilion(spurGrid, [81, 351, 89, 374]);
  // the spur end doors: lit glass in the pavilion's end wall (the openings the shell left)
  litEntry(g, [84, 1, 0, 86, 3, 0], "north");
  litEntry(g, [84, 1, 374, 86, 3, 374], "south");
  return stats;
}
