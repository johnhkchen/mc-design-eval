// Pier shed shell and roof: the long birch walls on the two diagonal bands (shedBay), the hand-built stepped roof
// (shedRoofSlice), skylights on both slopes, the two gable ends, the promenade doors and the NW loading opening.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { shedBay, skylight, shedRoofSlice, PAVILION } from "../vocab.mjs";

// bays on the east (mural) wall that keep their windows out: the mural bays s 140..155 and 196..211 (plus the bays they touch)
const MURAL_BAYS = new Set([136, 144, 152, 192, 200, 208]);
// double doors on the east promenade wall: first cell of s, two cells of s each
const DOOR_S = [120, 176, 224];

const inPavilion = (x, z) => x >= PAVILION.x0 && x <= PAVILION.x1 && z >= PAVILION.z0 && z <= PAVILION.z1;

// the east wall's band cell at s (d = -14 on even s, -15 on odd s), as shedBay has it
const eastCell = (s) => { const d = s % 2 === 0 ? -14 : -15; return [(s + d) / 2, (s - d) / 2]; };

// fill a gable plane (s 100..101 or 242..243) between the walls and the roof underside: one cell per d
// (the cell with the parity of d), from y4 up to the roof underside 24 - ceil(e/2), e = |d + 27|
function gable(g, sPair, { skip = () => false, fill = () => ["birch_planks"] } = {}) {
  for (let d = -40; d <= -14; d++) {
    for (const s of sPair) {
      if ((s + d) % 2) continue;
      const x = (s + d) / 2, z = (s - d) / 2;
      if (skip(x, z)) continue;
      const e = Math.abs(d + 27);
      const top = 24 - Math.ceil(e / 2);
      for (let y = 4; y <= top; y++) {
        const f = fill(d, y);
        if (f === null) continue;
        if (g.isAir(x, y, z)) g.set(x, y, z, ...f);
      }
    }
  }
}

export function build(g) {
  // 1. long walls: plinth, birch body, posts, head plate, mid rail, windows (one bay of 8 at a time)
  for (let s0 = 96; s0 <= 240; s0 += 8) {
    shedBay(g, "west", s0);
    shedBay(g, "east", s0, { windows: !MURAL_BAYS.has(s0) });
  }

  // 2. skylights go in before the roof, so the roof leaves their cells (both slopes, every 12 steps from s 112)
  for (let s0 = 112; s0 <= 220; s0 += 12) {
    skylight(g, s0, 1);
    skylight(g, s0, -1);
  }

  // 3. the stepped roof: one slice per s, the verge slices (99, 244) are the barge course
  for (let s = 99; s <= 244; s++) shedRoofSlice(g, s);

  // 4. NW gable (bay end): birch gable up to the roof, a glazed 2-storey loading opening, and a gable window
  gable(g, [100, 101], {
    fill: (d, y) => {
      const inOpen = d >= -30 && d <= -24 && y >= 5 && y <= 12;
      if (inOpen) {
        if (d === -30 || d === -24 || y === 12) return ["dark_oak_planks"];   // timber frame
        return ["glass"];
      }
      if (d >= -28 && d <= -26 && y >= 19 && y <= 22) return ["glass"];      // gable window
      return ["birch_planks"];
    },
  });

  // 5. SE end gable (above the pavilion): the cells inside the pavilion box stay to the pavilion part
  gable(g, [242, 243], { skip: (x, z) => inPavilion(x, z) });

  // 6. promenade double doors on the east wall, y5..6 (two leaves, each lower and upper half)
  for (const s0 of DOOR_S) {
    const [x1, z1] = eastCell(s0), [x2, z2] = eastCell(s0 + 1);
    for (const y of [5, 6]) {
      g.set(x1, y, z1, ...B.door("spruce", "east", y === 5 ? "lower" : "upper", "left"));
      g.set(x2, y, z2, ...B.door("spruce", "east", y === 5 ? "lower" : "upper", "right"));
    }
  }
}
