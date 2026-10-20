// Plot 0 Nan Shan tower shell: lobby base y4..18, shaft y19..352 (fins, glass, floor lines, chamfers, reveals), doors.
// Shaft hollow; roof slab y352 and the crown above belong to the crown part (fins/glass here reach y352).
import { finFace, floorLine, chamferCorner, revealSlot, lobbyGlass, doorBay } from "../vocab.mjs";

const SH = { x0: 166, x1: 229, z0: 12, z1: 75 };
const Y0 = 19, Y1 = 352;

export function build(g) {
  // ---- shaft faces: each face in two spans either side of the 6-wide reveal slot, chamfer ends trimmed (6 in)
  const spans = {
    north: [[172, 193], [202, 223]], south: [[172, 193], [202, 223]],
    west: [[18, 39], [48, 69]], east: [[18, 39], [48, 69]],
  };
  const slot = { north: [195, 200], south: [195, 200], west: [41, 46], east: [41, 46] };
  const boxFor = (face, [a, b]) => (face === "north" || face === "south"
    ? { ...SH, x0: a, x1: b, y0: Y0, y1: Y1 } : { ...SH, z0: a, z1: b, y0: Y0, y1: Y1 });
  for (const face of Object.keys(spans)) {
    for (const sp of spans[face]) {
      const box = boxFor(face, sp);
      for (let y = Y0; y <= 345; y += 7) floorLine(g, face, y, box);
      finFace(g, face, box);
    }
    revealSlot(g, face, { ...SH, y0: Y0, y1: Y1 }, { from: slot[face][0], to: slot[face][1], depth: 3, y0: Y0, y1: Y1 });
  }
  // ---- chamfered corners, with the dx+dz=7 diagonal glazed so the 45 degree face has no see-through gaps
  for (const c of [{ x: 166, z: 12, sx: 1, sz: 1 }, { x: 229, z: 12, sx: -1, sz: 1 },
                   { x: 166, z: 75, sx: 1, sz: -1 }, { x: 229, z: 75, sx: -1, sz: -1 }]) {
    chamferCorner(g, c, Y0, Y1);
    for (let y = Y0; y <= Y1; y++) {
      const glass = (y - Y0) % 28 < 7 ? "black_stained_glass" : "gray_stained_glass";
      for (let i = 0; i <= 7; i++) if (g.isAir(c.x + c.sx * i, y, c.z + c.sz * (7 - i)))
        g.set(c.x + c.sx * i, y, c.z + c.sz * (7 - i), glass);
    }
  }

  // ---- lobby base y4..17 glass between quartz piers; gaps left for the door bays
  const P = "quartz_pillar", L = { y0: 4, y1: 17 };
  const lg = (x0, x1, z0, z1, faces) => lobbyGlass(g, { x0, x1, z0, z1, ...L }, 6, P, { faces });
  for (const f of ["north", "south"]) { lg(156, 189, 6, 77, [f]); lg(206, 239, 6, 77, [f]); }
  lg(156, 239, 6, 77, ["west"]);
  lg(156, 239, 6, 23, ["east"]); lg(156, 239, 60, 77, ["east"]);
  lg(240, 245, 24, 59, ["north", "south"]);
  lg(240, 245, 24, 37, ["east"]); lg(240, 245, 46, 59, ["east"]);
  // door bays: S z77 / N z6 (glass plane one in), E x245; glass above the transoms to y17
  for (let x = 191; x <= 203; x += 4) {
    doorBay(g, [x, 4, 76], "south", 2, 3);
    doorBay(g, [x, 4, 7], "north", 2, 3);
  }
  for (let x = 190; x <= 205; x++) for (let y = 8; y <= 17; y++) { g.set(x, y, 76, "glass"); g.set(x, y, 7, "glass"); }
  for (const z of [39, 43]) doorBay(g, [244, 4, z], "east", 2, 3);
  for (let z = 38; z <= 45; z++) for (let y = 8; y <= 17; y++) g.set(244, y, z, "glass");

  // ---- lobby roof terrace y18 (deck-light cells every 6 left for the lights part) and a glass rail y19
  const inLobby = (x, z) => (x >= 156 && x <= 239 && z >= 6 && z <= 77) || (x >= 240 && x <= 245 && z >= 24 && z <= 59);
  for (let z = 6; z <= 77; z++) for (let x = 156; x <= 245; x++) {
    if (!inLobby(x, z)) continue;
    if ((x - 156) % 6 === 3 && (z - 6) % 6 === 3) continue;
    g.set(x, 18, z, "smooth_stone");
    const edge = !inLobby(x - 1, z) || !inLobby(x + 1, z) || !inLobby(x, z - 1) || !inLobby(x, z + 1);
    if (edge) g.set(x, 19, z, "glass_pane");
  }
}
