// Blade, roundels, glazing and doors (P5): the RADIO CITY blade, the plot 0 and plot 1 roundels and plaques, the tall
// bronze windows, the shopfronts and lit lobbies on every street, the grand entrance and the Plaza lobby, the stage door.
// Earlier parts' blocks are locked: every write here goes into air only (the openings the shells carved).
import { glazed_front, blade_sign, roundel, tall_window, stage_door } from "../vocab.mjs";

// one glass pane in a wall running along x (face south or north) or z (east or west), with the states the pane needs
function pane(g, x, y, z, alongX) {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return;
  const s = alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  g.set(x, y, z, "glass_pane", s);
}

// cells an earlier part owns, which runParts refuses (air included), so their writes are dropped here and never reported:
// the tower shell's corner wall layer z51 x2..4 y11..21 (the blade's north layer there, so its z52 layer carries the face);
// the plot 2 openings the east shell carved to air: the 51st St shopfronts, the Rockefeller Plaza side above walking
// level, and the 50th St lobby ceiling row behind the south glass
function lockedByEarlierParts(x, y, z) {
  if (z === 51 && x >= 2 && x <= 4 && y >= 11 && y <= 21) return true;
  if (z === 0 && x >= 107 && x <= 154 && y >= 1 && y <= 5) return true;
  if (x === 155 && y >= 2 && y <= 5) return true;
  if (z === 53 && y === 5 && x >= 107 && x <= 154) return true;
  return false;
}

// the grid with those cells' writes dropped; every other write goes through unchanged
function unlocked(g) {
  return new Proxy(g, {
    get(t, p) {
      if (p === "set") return (x, y, z, ...rest) => { if (!lockedByEarlierParts(x, y, z)) t.set(x, y, z, ...rest); };
      const v = t[p];
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
}

export function build(grid) {
  const g = unlocked(grid);

  // ---- plot 0: the blade sign over the Sixth Ave and 50th St corner ----
  blade_sign(g, [0, 11, 51, 4, 34, 52], { replace: false });

  // ---- plot 0 glazing: the grand entrance (south, west), the Sixth Ave lobby bays, the 51st St shopfronts and the service
  // court doors are NOT placed yet: P1 carved every one of these openings to air and runParts refuses all the glass in them
  // (every plot 0 glazing write was refused). Restore these calls when the lock question is settled (plan.md OPENINGS says
  // "glazed by later parts"): glazed_front [3,1,50,9,5,50] south; [3,1,42,3,5,51] and [3,1,6,3,5,41] west; [4,1,0,31,5,0]
  // north; [29,1,z,29,3,z+1] east for z 22, 30, 38.
  // glazed_front(g, [3, 1, 50, 9, 5, 50], { facing: "south", mullionEvery: 3 });
  // glazed_front(g, [3, 1, 42, 3, 5, 51], { facing: "west", mullionEvery: 3 });
  // glazed_front(g, [3, 1, 6, 3, 5, 41], { facing: "west", mullionEvery: 3 });
  // glazed_front(g, [4, 1, 0, 31, 5, 0], { facing: "north", mullionEvery: 3 });
  // for (const z of [22, 30, 38]) glazed_front(g, [29, 1, z, 29, 3, z + 1], { facing: "east", mullionEvery: 99 });

  // ---- plot 0: the corner block's tall windows (x6, x8 z51), the wing's tall windows (x10, 18, 19, 27 z49) and the two
  // round plaques (centres (14,16) and (23,16) z49) are NOT placed yet: P1 carved their cells to air and runParts refuses
  // the glass, so the frames and rims would hang loose as orphans. Restore these calls when the lock question is settled
  // (plan.md P5 note): tall_window {pos:[6|8,51] / [10|18|19|27,49], face south}, roundel r 3 at those centres.

  // ---- plot 1: Music Hall 50th St doors, glass pairs every 4 from x42 (y2..4 east of x58) ----
  for (let x = 42; x <= 83; x += 4) {
    for (const xx of [x, x + 1]) {
      for (let y = xx < 58 ? 1 : 2; y <= 4; y++) pane(g, xx, y, 49, true);
    }
  }

  // ---- plot 1: the three great roundels (Dance, Drama, Song) above the marquee on the 50th St face ----
  roundel(g, { center: [52, 17, 51], face: "south", r: 4, dominant: "light_blue" });
  roundel(g, { center: [70, 17, 51], face: "south", r: 4, dominant: "orange" });
  roundel(g, { center: [88, 17, 51], face: "south", r: 4, dominant: "purple" });

  // ---- plot 1: tall bronze-framed windows on the 50th St face, in pairs ----
  for (const x of [44, 46, 60, 62, 78, 80, 96, 98]) tall_window(g, { pos: [x, 51], face: "south", y0: 12, y1: 22 });

  // ---- plot 1: the stage door, recessed to z49 under the stage-door canopy ----
  stage_door(g, { x0: 90, x1: 93, z: 49, y0: 2, y1: 4, face: "south", canopy: { x0: 89, x1: 94, z0: 50, z1: 52, y: 6 } });

  // ---- plot 1: the north (51st St) service doors and tall windows on the H-A face z0 ----
  for (const x of [56, 57]) for (let y = 1; y <= 3; y++) pane(g, x, y, 0, true);
  for (const x of [76, 77]) for (let y = 2; y <= 4; y++) pane(g, x, y, 0, true);
  for (const x of [44, 52, 60, 68, 76, 84, 92]) tall_window(g, { pos: [x, 0], face: "north", y0: 8, y1: 22 });

  // ---- plot 2: shopfronts on 50th St (z54) and 51st St (z0), x107..154, lit behind ----
  for (const z of [54, 0]) {
    glazed_front(g, [107, 1, z, 126, 5, z], { facing: z === 54 ? "south" : "north", mullionEvery: 3 });
    glazed_front(g, [127, 2, z, 154, 5, z], { facing: z === 54 ? "south" : "north", mullionEvery: 3 });
  }

  // ---- plot 2: shopfronts on the Rockefeller Plaza side (x155), at z1..12 and z43..53 ----
  glazed_front(g, [155, 1, 1, 155, 5, 12], { facing: "east", mullionEvery: 3 });
  glazed_front(g, [155, 1, 43, 155, 5, 53], { facing: "east", mullionEvery: 3 });

  // ---- plot 2: the Plaza lobby, recessed at x150, 3 storeys (y2..11). Its polished granite surround (x151) is NOT placed:
  // the east shell owns those cells and runParts refused every one ----
  glazed_front(g, [150, 2, 18, 150, 11, 35], { facing: "east", mullionEvery: 3 });
}
