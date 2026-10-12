// Part: Dressings (parts/dressings.mjs). The mason's work on the shell: corner quoins, the water table, the y10 string
// course, the y16 cornice, the portico columns and entablature, the tower bands, the clock faces, the belfry arches and
// the bell. Everything lands in the air the shell left open for it (its y10/y16 rings, quoin and clock cells); a cell the
// shell built is never replaced, so a refused write here means the shell's wall is in the way.
import {
  quoinColumn, waterTable, stringCourse, porticoColumn, entablatureBand, towerBand, clockFace, belfryOpening, bellHang,
} from "../vocab.mjs";

// The main body's roof-line cornice (y16): the front wall at z10 (the recessed ranges) and z9 (the pavilions), the rear
// wall at z26, and the side walls at x4 / x36. Air-only, like every dressing here.
function cornice(g, y = 16) {
  const cells = [];
  for (let x = 4; x <= 36; x++) {
    const front = x <= 10 || x >= 30 ? 9 : 10;
    cells.push([x, y, front], [x, y, 10], [x, y, 26]);
  }
  for (let z = 10; z <= 26; z++) cells.push([4, y, z], [36, y, z]);
  for (const [x, , z] of cells) if (g.isAir(x, y, z)) g.set(x, y, z, "quartz_block");
}

export function build(g) {
  // ---- quoins: the corner columns of the pavilions, the rear corners and the tower's four corners ----
  quoinColumn(g, 4, 9, "east", 4, 15);
  quoinColumn(g, 10, 9, "west", 4, 15);
  quoinColumn(g, 30, 9, "east", 4, 15);
  quoinColumn(g, 36, 9, "west", 4, 15);
  quoinColumn(g, 4, 26, "east", 4, 15);
  quoinColumn(g, 36, 26, "west", 4, 15);
  quoinColumn(g, 18, 10, "east", 17, 34);
  quoinColumn(g, 22, 10, "west", 17, 34);
  quoinColumn(g, 18, 14, "east", 17, 34);
  quoinColumn(g, 22, 14, "west", 17, 34);

  // ---- water table: the stone_bricks ring is the shell's; the upside-down stairs stand proud on the north and sides ----
  waterTable(g, { x0: 4, x1: 36, z0: 10, z1: 26, y: 3 });

  // ---- string course at y10: flush on the body and the rear, the proud quartz slab on the recessed front ranges ----
  stringCourse(g, "north", 10, 4, 36, 10, { proud: false });
  stringCourse(g, "north", 9, 4, 10, 10, { proud: false });
  stringCourse(g, "north", 9, 30, 36, 10, { proud: false });
  stringCourse(g, "north", 10, 11, 29, 10, { proud: true });
  stringCourse(g, "west", 4, 10, 26, 10, { proud: false });
  stringCourse(g, "east", 36, 10, 26, 10, { proud: false });
  stringCourse(g, "south", 26, 4, 36, 10, { proud: false });

  // ---- cornice at y16 (the roof's dentil lip is the roof part's) ----
  cornice(g, 16);

  // ---- portico: four quartz columns on chiseled bases, then the entablature over them ----
  for (const x of [15, 18, 22, 25]) porticoColumn(g, x, 6);
  entablatureBand(g, { x0: 14, x1: 26, z0: 6, z1: 9, y: 15 });

  // ---- clock tower: quartz bands at y27 and y31, the cornice lip at y35 ----
  const shaft = { x0: 18, x1: 22, z0: 10, z1: 14 };
  towerBand(g, { ...shaft, y: 27 });
  towerBand(g, { ...shaft, y: 31 });
  towerBand(g, { ...shaft, y: 35, proud: true });

  // ---- clock faces, one per tower side (3x3 at y28..30) ----
  clockFace(g, "north", 10, 20, 28);
  clockFace(g, "south", 14, 20, 28);
  clockFace(g, "west", 18, 12, 28);
  clockFace(g, "east", 22, 12, 28);

  // ---- belfry: a 3-wide arched opening on each face (y32..34), the bell hung under its beam ----
  belfryOpening(g, "north", 10, 19, 21, 32);
  belfryOpening(g, "south", 14, 19, 21, 32);
  belfryOpening(g, "west", 18, 11, 13, 32);
  belfryOpening(g, "east", 22, 11, 13, 32);
  bellHang(g, { x: 20, y: 34, z: 12, axis: "x", facing: "north" });
}
