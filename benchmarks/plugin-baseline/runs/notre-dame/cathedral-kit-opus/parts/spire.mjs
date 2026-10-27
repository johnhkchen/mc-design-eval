// P5 Spire and apostles (plan.md PARTS 5, M22/M23, R9): the octagonal lead drum at the crossing (x 90..98, z 34..42,
// base y 48..49, drum 50..70 with eight glazed lancets, arris ribs and gablets), the needle in stages 7 / 5 / 3 / 1
// wide with crockets every 3 courses, the tip (cross arms y 131, end_rod mast, lightning_rod at exactly (94, 137, 38)),
// and the 12 copper apostles stepping down the four roof arms.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { octagonRing, glazeLancet, crocket, spireTip, apostle } from "../vocab.mjs";

const CX = 94, CZ = 38;
const TILE = "deepslate_tiles", POL = "polished_deepslate";

// The octagon w 9, cut 2 (as octagonRing): |dx|,|dz| <= 4 and |dx| + |dz| <= 6.
const inDrum = (dx, dz) => Math.abs(dx) <= 4 && Math.abs(dz) <= 4 && Math.abs(dx) + Math.abs(dz) <= 6;
// Roof surface height round the crossing (R1 ridge 59 along z 38, R2 ridge 57 along x 94, both 1:1).
const roofY = (x, z) => Math.max(59 - Math.abs(z - CZ), 57 - Math.abs(x - CX));

function put(g, x, y, z, block, state) { if (g.blockAt(x, y, z) === "minecraft:air") g.set(x, y, z, block, state); }

export function build(g) {
  // ---- base (y 48..49): a solid octagon closing the crossing; the cut corners of the box filled up to the roof
  // surface so the R1/R2 valleys close against the drum.
  for (const y of [48, 49]) octagonRing(g, { cx: CX, cz: CZ, y, w: 9, cut: 2, block: TILE, hollow: false });
  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
    if (inDrum(dx, dz)) continue;
    const x = CX + dx, z = CZ + dz, top = Math.min(roofY(x, z), 57);
    for (let y = 48; y <= top; y++) put(g, x, y, z, y === top ? POL : TILE);
  }

  // ---- drum (y 50..70): polished_deepslate ring, deepslate_tiles band every 5 courses, solid deck at 70.
  // Lancets 1 wide on each of the 8 faces' centre cells, y 58..65 glass, a cap at 66 (the ring stays solid there).
  const lancetCols = [[-4, 0], [4, 0], [0, -4], [0, 4], [-3, -3], [-3, 3], [3, -3], [3, 3]].map(([a, b]) => [CX + a, CZ + b]);
  const isLancet = (x, y, z) => y >= 58 && y <= 65 && lancetCols.some(([lx, lz]) => lx === x && lz === z);
  for (let y = 50; y <= 70; y++) {
    const block = y % 5 === 0 ? TILE : POL;
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
      if (!inDrum(dx, dz)) continue;
      const edge = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]].some(([a, b]) => !inDrum(dx + a, dz + b));
      if (!edge && y !== 70) continue;
      const x = CX + dx, z = CZ + dz;
      if (isLancet(x, y, z)) continue;
      put(g, x, y, z, block);
    }
  }
  const glass = [];
  for (const [x, z] of lancetCols) for (let y = 58; y <= 65; y++) glass.push([x, y, z]);
  glazeLancet(g, { cells: glass });

  // Ribs: deepslate_tile_wall in the notch cells at each arris (|dx| + |dz| = 7), from just above the roof to 69.
  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
    if (Math.abs(dx) + Math.abs(dz) !== 7) continue;
    const x = CX + dx, z = CZ + dz;
    for (let y = Math.min(roofY(x, z), 57) + 1; y <= 69; y++) put(g, x, y, z, ...B.wall("deepslate_tile"));
  }

  // Gablets over the four axial lancets, 1 proud of the face (y 67..69 + finial 70): rakes of stairs facing in.
  for (const [ox, oz, along] of [[-5, 0, "z"], [5, 0, "z"], [0, -5, "x"], [0, 5, "x"]]) {
    const at = (t, y, ...b) => put(g, CX + ox + (along === "x" ? t : 0), y, CZ + oz + (along === "z" ? t : 0), ...b);
    const lowSide = along === "x" ? "west" : "north", highSide = along === "x" ? "east" : "south";
    at(-2, 67, ...B.stairs("deepslate_tile", highSide)); at(2, 67, ...B.stairs("deepslate_tile", lowSide));
    for (const t of [-1, 0, 1]) at(t, 67, TILE);
    at(-1, 68, ...B.stairs("deepslate_tile", highSide)); at(1, 68, ...B.stairs("deepslate_tile", lowSide));
    at(0, 68, TILE);
    at(0, 69, ...B.slab("deepslate_tile"));
  }

  // ---- needle: hollow stages, courses alternating tiles / polished; each stage's top course solid (the next stands on it).
  const stages = [[71, 85, 7, 2], [86, 105, 5, 1], [106, 124, 3, 1]];
  for (const [y0, y1, w, cut] of stages) {
    for (let y = y0; y <= y1; y++) {
      octagonRing(g, { cx: CX, cz: CZ, y, w, cut, block: (y - y0) % 2 ? POL : TILE, hollow: y !== y1 });
      if ((y - y0) % 3 === 1 && y < y1) crocket(g, { cx: CX, cz: CZ, y, w, cut });
    }
  }
  // Ribs on the 7-wide stage's arrises: deepslate_tile_wall in the notch cells (|dx| + |dz| = 5).
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    if (Math.abs(dx) + Math.abs(dz) !== 5) continue;
    for (let y = 71; y <= 84; y++) put(g, CX + dx, y, CZ + dz, ...B.wall("deepslate_tile"));
  }
  // Weatherings where each stage steps in: a ring of slabs on the step.
  for (const [y, w, cut] of [[86, 7, 2], [106, 5, 1]]) {
    const half = (w - 1) / 2;
    for (let dx = -half; dx <= half; dx++) for (let dz = -half; dz <= half; dz++) {
      if (Math.abs(dx) + Math.abs(dz) > 2 * half - cut) continue;
      put(g, CX + dx, y, CZ + dz, ...B.slab("deepslate_tile"));
    }
  }

  // ---- tip: wall 125..133, cross arms 131, end_rod mast 134..136, lightning_rod at (94, 137, 38).
  spireTip(g, { x: CX, z: CZ, y0: 125 });

  // ---- apostles: four groups of three stepping down the roof arms from the drum (stand on the roof's stairs).
  const groups = [
    ...[[100, 55, 43], [100, 54, 44], [100, 53, 45]].map(([x, y, z]) => ({ x, y, z, facing: "south" })),
    ...[[88, 55, 43], [88, 54, 44], [88, 53, 45]].map(([x, y, z]) => ({ x, y, z, facing: "south" })),
    ...[[99, 53, 48], [100, 52, 48], [101, 51, 48]].map(([x, y, z]) => ({ x, y, z, facing: "east" })),
    ...[[89, 53, 28], [88, 52, 28], [87, 51, 28]].map(([x, y, z]) => ({ x, y, z, facing: "west" })),
  ];
  for (const a of groups) apostle(g, { ...a, replaceBelow: false });
}
