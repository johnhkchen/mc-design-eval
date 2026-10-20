// NMNH shell (plan.md plot 0): masses as one voxel set, courses by exposure, openings left air, paved courts.
import { ashlarBay, octagonDrum } from "../vocab.mjs";

const COURTS = [[32, 47, 12, 32], [67, 82, 12, 32]];
const inCourt = (x, z) => COURTS.some(([a, b, c, d]) => x >= a && x <= b && z >= c && z <= d);

export function build(g) {
  const solid = new Map(); // "x,y,z" -> kind
  const box = (x0, x1, z0, z1, y0, y1, kind = "body") => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) solid.set(`${x},${y},${z}`, kind);
  };
  const open = (x0, x1, z0, z1, y0, y1) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) solid.delete(`${x},${y},${z}`);
  };
  const bays = (x0, x1) => { const r = []; for (let x = x0; x <= x1; x += 4) r.push(x); return r; };

  // 1910 block
  box(22, 92, 33, 41, 1, 11);                 // south range
  box(22, 31, 8, 42, 1, 11); box(83, 92, 8, 42, 1, 11);   // end pavilions
  box(22, 31, 8, 42, 12, 13, "attic"); box(83, 92, 8, 42, 12, 13, "attic");
  box(25, 88, 3, 11, 1, 11);                  // north range
  box(48, 66, 12, 32, 1, 11);                 // central range
  box(47, 67, 33, 39, 1, 11);                 // south pavilion
  box(47, 67, 37, 40, 12, 15, "attic");       // pavilion attic (drum takes z33..36)
  box(47, 67, 40, 42, 1, 4);                  // portico platform
  // north porch: piers and a lintel beam over the steps
  box(49, 52, 0, 2, 1, 4); box(61, 64, 0, 2, 1, 4); box(53, 60, 0, 2, 4, 4);
  // 1960s wings and annex
  box(0, 21, 8, 29, 1, 9, "wing"); box(0, 21, 8, 29, 10, 10, "deck");
  box(93, 114, 8, 28, 1, 9, "wing"); box(93, 114, 8, 28, 10, 10, "deck");
  box(97, 113, 6, 7, 1, 5, "wing"); box(97, 113, 6, 7, 6, 6, "deck");
  // the light courts stay open: the end pavilions' and ranges' boxes never enter them (x32..47 / 67..82, z12..32)

  // openings left air (windows 1 recessed; the facade part glazes them)
  const south = [...bays(33, 41), ...bays(69, 77)]; // ashlarBay starts: window at +2
  for (const x of south) { solid.delete(`${x},0,0`); for (let dx = 0; dx < 4; dx++) open(x + dx, x + dx, 41, 41, 1, 11); open(x + 2, x + 2, 40, 40, 2, 9); }
  for (const x of [24, 25, 28, 29, 85, 86, 89, 90]) open(x, x, 41, 42, 5, 9);
  open(56, 58, 39, 39, 5, 8); open(51, 52, 39, 39, 5, 7); open(62, 63, 39, 39, 5, 7);
  open(55, 59, 3, 4, 2, 4);
  for (let x = 27; x <= 87; x += 4) open(x, x, 3, 4, 5, 9);
  for (let x = 2; x <= 20; x += 3) { open(x, x, 28, 29, 5, 9); open(x, x, 8, 9, 5, 9); }
  for (let z = 10; z <= 27; z += 3) open(0, 1, z, z, 5, 9);
  for (let x = 96; x <= 111; x += 3) open(x, x, 27, 28, 5, 9);
  for (let z = 10; z <= 26; z += 3) open(113, 114, z, z, 5, 9);

  // lay the set: courses by exposure
  const has = (x, y, z) => solid.has(`${x},${y},${z}`);
  for (const [k, kind] of solid) {
    const [x, y, z] = k.split(",").map(Number);
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => !has(x + a, y, z + b));
    const exposed = nb.length > 0;
    const court = nb.length > 0 && nb.every(([a, b]) => inCourt(x + a, z + b));
    let m = "calcite";
    if (kind === "attic") m = "smooth_quartz";
    else if (kind === "deck") m = "smooth_stone";
    else if (exposed && !court && y <= 4) {
      if (y === 1) m = "polished_diorite";
      else if (y <= 3) m = kind === "wing" ? "calcite" : "stone_bricks";
      else m = "smooth_quartz";
    }
    g.set(x, y, z, m);
  }
  // string course proud at the pavilions' fronts
  for (const [a, b] of [[22, 31], [83, 92]]) for (let x = a; x <= b; x++) g.set(x, 4, 43, "smooth_quartz");

  // south range bays: ashlar courses into the air left at z41
  for (const x of south) ashlarBay(g, x, 41, "south");
  // plain wall at the remaining south-range cells beside the bays (x32, 45..46, 68, 81..82 reached above as solid)

  // rotunda drum, centre (57, 12, 27)
  octagonDrum(g, [57, 12, 27], 9);

  // paved light courts (top of the ground)
  for (const [a, b, c, d] of COURTS) for (let x = a; x <= b; x++) for (let z = c; z <= d; z++) {
    const top = x >= 47 && x <= 67 ? 1 : 0;
    g.set(x, top, z, "smooth_stone");
  }
}
