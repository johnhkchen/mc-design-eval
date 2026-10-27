// P4 Flanks, transept faces and chevet relief (plan.md PARTS): flyers (nave/choir + 6 radial), wall buttresses and
// gargoyles, pier pinnacles, aisle/ambulatory string course + balustrade, clerestory corbel table/cornice/parapet (and
// round the apse), clerestory mullions, transept portals + wimpergs + roses (glass), chevet chapel wimpergs.
// Every helper writes only into air, so the shell (and the roofs) keep their cells.
import {
  flyer, flyerRadial, wallButtress, gargoyle, pinnacle, stringCourse, balustrade, corbelTable, portal, wimperg,
  roseWindow, radialChapel,
} from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const C = [152, 38];
const NAVE_PIERS = [32, 40, 48, 56, 64, 72, 80], CHOIR_PIERS = [112, 120, 128, 136, 144];
const PIERS = [...NAVE_PIERS, ...CHOIR_PIERS];
const BAYS = [24, 32, 40, 48, 56, 64, 72, 104, 112, 120, 128, 136, 144];   // flankBay p (window x p+3..p+6)
const CHEVET = [-90, -54, -18, 18, 54, 90];
const N = (z) => 76 - z;
const rad = (a) => (a * Math.PI) / 180;
const onPier = (x) => PIERS.some((p) => x >= p && x <= p + 1);
// polar cell: radius r, tangent offset t at angle a about C
const polar = (a, r, t = 0) => [Math.round(C[0] + r * Math.cos(rad(a)) - t * Math.sin(rad(a))), Math.round(C[1] + r * Math.sin(rad(a)) + t * Math.cos(rad(a)))];
// nearest axis facing of a direction (dx, dz)
const axisFace = (dx, dz) => (Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? "east" : "west") : (dz > 0 ? "south" : "north"));
const set = (g, x, y, z, ...b) => { if (g.isAir(x, y, z)) g.set(x, y, z, ...b); };
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// a chevet chapel's wimperg: a steep open gablet 1 out from the chapel face (r 30), tangent offsets -2..2, base 18, apex 25
function chapelWimperg(g, a) {
  const r = 30;
  for (const t of [-2, -1, 1, 2]) {
    const [x, z] = polar(a, r, t), top = t * t === 4 ? 20 : 23;
    const [ax, az] = polar(a, r, 0);
    for (let y = top - 2; y < top; y++) set(g, x, y, z, "smooth_sandstone");
    set(g, x, top, z, ...B.stairs("smooth_sandstone", axisFace(ax - x, az - z)));
    if (Math.abs(t) === 1) set(g, x, top + 1, z, ...B.wall("sandstone"));
  }
  const [x, z] = polar(a, r, 0);
  for (let y = 22; y <= 24; y++) set(g, x, y, z, "smooth_sandstone");
  set(g, x, 25, z, "chiseled_sandstone");
}

export function build(g) {
  // ---- nave + choir flyers, wall buttresses, gargoyles, pier pinnacles (both sides) ----
  for (const p of PIERS) {
    for (const side of ["S", "N"]) {
      const Z = side === "N" ? N : (z) => z, face = side === "N" ? "north" : "south";
      flyer(g, { p, side });
      wallButtress(g, { x: p, z: Z(50), face });
      gargoyle(g, { x: p + 1, z: Z(50), face });
      pinnacle(g, { x: p, z: side === "N" ? 9 : 66, y0: 39 });
    }
  }

  // ---- chevet: radial flyers, vertex buttresses at the apse, pinnacles on the radial piers ----
  for (const a of CHEVET) {
    flyerRadial(g, { angle: a });
    const [bx, bz] = polar(a, 12);                                   // the apse vertex buttress receiving the flyer
    for (let y = 37; y <= 46; y++) set(g, bx, y, bz, "smooth_sandstone");
    set(g, bx, 47, bz, "cut_sandstone");
    // a 2x2 pinnacle on the pier top (y 38): the first fully supported 2x2 near r 28
    const [px, pz] = polar(a, 28);
    let done = false;
    for (const [dx, dz] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) {
      const x = px + dx, z = pz + dz;
      if ([[0, 0], [1, 0], [0, 1], [1, 1]].every(([i, k]) => !g.isAir(x + i, 38, z + k) && g.isAir(x + i, 39, z + k))) {
        pinnacle(g, { x, z, y0: 39 }); done = true; break;
      }
    }
    if (!done) pinnacle(g, { x: px, z: pz, y0: 39, size: 1, h: 8 });
  }

  // ---- transept front buttress pinnacles (y 55..60) ----
  for (const x of [86, 102]) {
    pinnacle(g, { x, z: 68, y0: 55, size: 1, h: 5 });
    pinnacle(g, { x, z: 8, y0: 55, size: 1, h: 5 });
  }

  // ---- outer aisle walls: wall-top course y 19, string course y 19 (1 proud), balustrade y 20 ----
  const aisleX = [...range(23, 84), ...range(104, 151)];
  for (const side of ["S", "N"]) {
    const Z = side === "N" ? N : (z) => z, face = side === "N" ? "north" : "south";
    for (const x of aisleX) for (const z of [Z(65), Z(66)]) set(g, x, 19, z, "cut_sandstone");
    stringCourse(g, { cells: aisleX.filter((x) => !onPier(x)).map((x) => [x, Z(67)]), y: 19, face });
    balustrade(g, { cells: aisleX.filter((x) => !onPier(x)).map((x) => [x, Z(66)]), y: 20 });
  }
  // ambulatory ring (r 24.6..26.5): top course y 19, string course 1 out, balustrade on the outer ring at y 20
  const ambTop = [], ambOut = [], ambBal = [];
  for (let x = 152; x <= 180; x++) for (let z = 8; z <= 68; z++) {
    const r = Math.hypot(x - C[0], z - C[1]);
    if (r >= 24.6 && r <= 26.5) ambTop.push([x, z]);
    if (r > 25.5 && r <= 26.5) ambBal.push([x, z]);
    if (r > 26.5 && r <= 27.5) ambOut.push([x, z, axisFace(x - C[0], z - C[1])]);
  }
  for (const [x, z] of ambTop) if (!g.isAir(x, 18, z)) set(g, x, 19, z, "cut_sandstone");
  const D = { east: [-1, 0], west: [1, 0], south: [0, -1], north: [0, 1] };
  stringCourse(g, { cells: ambOut.filter(([x, z, f]) => !g.isAir(x + D[f][0], 18, z + D[f][1])), y: 19 });
  balustrade(g, { cells: ambBal.filter(([x, z]) => !g.isAir(x, 19, z)), y: 20 });

  // ---- clerestory: corbel table y 46, cornice 47, pierced parapet 48; mullions x p+4..p+5 y 38..43 ----
  const clerX = [...range(23, 84), ...range(104, 151)];
  for (const side of ["S", "N"]) {
    const Z = side === "N" ? N : (z) => z, face = side === "N" ? "north" : "south";
    corbelTable(g, { cells: clerX.filter((x) => !onPier(x)).map((x) => [x, Z(50)]), y: 46, face });
    balustrade(g, { cells: clerX.map((x) => [x, Z(50)]), y: 48 });
    for (const p of BAYS) for (const x of [p + 4, p + 5]) for (let y = 38; y <= 43; y++) set(g, x, y, Z(49), ...B.wall("sandstone"));
  }
  // round the apse: the cells 1 out from the polygon wall (x >= 152)
  const apseCells = [];
  for (let x = 152; x <= 165; x++) for (let z = 24; z <= 52; z++) {
    if (!g.isAir(x, 45, z) || Math.hypot(x - C[0], z - C[1]) < 9) continue;
    for (const [dx, dz] of [[-1, 0], [0, -1], [0, 1]]) {
      if (x === 152 && dx === 0) continue;
      if (!g.isAir(x + dx, 45, z + dz) && Math.hypot(x + dx - C[0], z + dz - C[1]) < Math.hypot(x - C[0], z - C[1])) {
        apseCells.push([x, z, axisFace(-dx, -dz)]); break;
      }
    }
  }
  const DD = { east: [-1, 0], west: [1, 0], south: [0, -1], north: [0, 1] };
  apseCells.splice(0, apseCells.length, ...apseCells.filter(([x, z, f]) => x < 163 && !g.isAir(x + DD[f][0], 46, z + DD[f][1])));
  corbelTable(g, { cells: apseCells, y: 46 });
  balustrade(g, { cells: apseCells.map(([x, z]) => [x, z]).filter(([x, z]) => !g.isAir(x, 47, z)), y: 48 });

  // ---- transept faces: portals with doors, wimpergs, roses (glass in the plane 1 behind the face), gable roses ----
  portal(g, { at: [94, 3, 66], face: "south", w: 3, h: 9, archTop: 17, rings: 2, step: 2 });
  portal(g, { at: [94, 3, 10], face: "north", w: 3, h: 9, archTop: 17, rings: 2, step: 2 });
  wimperg(g, { centre: [94, 67], face: "south", w: 9, yBase: 18, yApex: 26 });
  wimperg(g, { centre: [94, 9], face: "north", w: 9, yBase: 18, yApex: 26 });
  roseWindow(g, { center: [94, 40, 66], plane: "z", r: 6 });
  roseWindow(g, { center: [94, 40, 10], plane: "z", r: 6 });
  roseWindow(g, { center: [94, 52, 66], plane: "z", r: 1 });
  roseWindow(g, { center: [94, 52, 10], plane: "z", r: 1 });

  // ---- chevet chapels: wimpergs over the windows, corner pinnacles ----
  for (const a of [0, 36, -36, 72, -72]) {
    chapelWimperg(g, a);
    radialChapel(g, { angle: a, walls: false, roof: false, pinnacles: true });
  }
  // the corner pinnacles' footing on the chapel wall top (y 20; under P2's chapel roof it is already filled)
  for (let x = 150; x <= 185; x++) for (let z = 5; z <= 71; z++) {
    if (g.blockAt(x, 21, z)?.replace("minecraft:", "") === "sandstone_wall" && g.isAir(x, 20, z)) g.set(x, 20, z, "cut_sandstone");
  }
}
