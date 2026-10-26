// Part: spire. The octagonal lead spire over the crossing (plan.md: THE SPIRE, x95 z37). Base socle y 52..60, lower
// open stage y 61..76 (eight lancets with louvres, eight corner pinnacles to y 80), the needle y 77..132 built from
// spireStage rows with crockets, the cross and rooster to the lightning-rod tip at y 137, and the twelve apostles on
// the ridges. Writes only into air.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { spireStage, statue, SPIRE_CENTRE, SPIRE_TIP } from "../vocab.mjs";

const [CX, CZ] = SPIRE_CENTRE;
const AIR = new Set(["air", "minecraft:air", undefined, null]);

// octagon cells of half-width h with corner cut c (the same outline octagonRing draws)
const inOct = (dx, dz, h, c) => Math.abs(dx) <= h && Math.abs(dz) <= h && Math.abs(dx) + Math.abs(dz) <= 2 * h - c;
const onRing = (dx, dz, h, c) => inOct(dx, dz, h, c) && (Math.abs(dx) === h || Math.abs(dz) === h || Math.abs(dx) + Math.abs(dz) === 2 * h - c);
const isVertex = (dx, dz, h, c) => (Math.abs(dx) === h || Math.abs(dz) === h) && Math.abs(dx) + Math.abs(dz) === 2 * h - c;

// write only into air: an earlier part's block is never replaced
function put(g, x, y, z, [block, state]) {
  if (!AIR.has(g.blockAt(x, y, z))) return false;
  g.set(x, y, z, block, state);
  return true;
}

// one course of the octagon of half-width h: lead ring (or solid), dark oak frame lines at the vertices
function course(g, y, h, c, mat, { solid = false, skip = () => false } = {}) {
  for (let dx = -h; dx <= h; dx++) for (let dz = -h; dz <= h; dz++) {
    const ring = solid ? inOct(dx, dz, h, c) : onRing(dx, dz, h, c);
    if (!ring || skip(dx, dz)) continue;
    put(g, CX + dx, y, CZ + dz, isVertex(dx, dz, h, c) && !solid ? B.log("dark_oak", "y") : mat);
  }
}

// the eight face centres of the lower open stage (four axis faces, four diagonal faces of the w 9 octagon)
const FACES = [[0, 4], [3, 3], [4, 0], [3, -3], [0, -4], [-3, -3], [-4, 0], [-3, 3]];
const isFace = (dx, dz) => FACES.some(([fx, fz]) => fx === dx && fz === dz);
// the outward compass name of a face cell (the way the lancet looks out)
const outward = (dx, dz) => (Math.abs(dz) >= Math.abs(dx) ? (dz > 0 ? "south" : "north") : (dx > 0 ? "east" : "west"));

export function build(g) {
  const lead = B.block("deepslate_tiles");
  const panel = B.block("polished_deepslate");

  // socle: solid lead base in the crossing roof (w 11, corners cut 3)
  for (let y = 52; y <= 60; y++) course(g, y, 5, 3, lead, { solid: true });

  // lower open stage: w 9, corners cut 2. Floor band 61..62, lancet ring 63..72 with the eight openings, top band 73..76
  for (let y = 61; y <= 62; y++) course(g, y, 4, 2, panel, { solid: true });
  for (let y = 63; y <= 72; y++) course(g, y, 4, 2, panel, { skip: isFace });
  for (let y = 73; y <= 76; y++) course(g, y, 4, 2, panel);
  // louvres: open dark oak trapdoors lying in each lancet's plane, every other row
  for (const [fx, fz] of FACES) {
    for (const y of [64, 66, 68, 70]) put(g, CX + fx, y, CZ + fz, B.trapdoor("dark_oak", outward(fx, fz), "bottom", true));
  }
  // eight slim corner pinnacles on the octagon's vertices, to y 80
  for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
    if (!onRing(dx, dz, 4, 2) || !isVertex(dx, dz, 4, 2)) continue;
    for (let y = 77; y <= 80; y++) put(g, CX + dx, y, CZ + dz, B.wall("polished_deepslate"));
  }

  // needle: spireStage rows from the plan table, each a ring with its crocket course
  spireStage(g, CX, CZ, 77, 90, 7, { cut: 1, crockets: [84] });
  spireStage(g, CX, CZ, 91, 106, 5, { cut: 1, crockets: [98] });
  spireStage(g, CX, CZ, 107, 122, 3, { cut: 0, crockets: [112] });
  spireStage(g, CX, CZ, 123, 132, 1, { crockets: [124] });

  // cross and rooster: wall shaft, iron arms, chain, gold rooster, lightning-rod tip at y 137
  const [tx, ty, tz] = SPIRE_TIP;
  put(g, CX, 133, CZ, B.wall("polished_deepslate"));
  put(g, CX, 134, CZ, B.wall("polished_deepslate"));
  put(g, CX - 1, 134, CZ, B.block("iron_bars"));
  put(g, CX + 1, 134, CZ, B.block("iron_bars"));
  put(g, CX, 135, CZ, B.chain("y", false));
  put(g, CX, 136, CZ, B.block("gold_block"));
  put(g, tx, ty, tz, B.block("lightning_rod"));

  // twelve apostles: three per arm, standing on the ridges (west and east at ridge y 59, north and south at y 57)
  for (const x of [88, 86, 84]) statue(g, x, 60, CZ, "west");
  for (const x of [102, 104, 106]) statue(g, x, 60, CZ, "east");
  for (const z of [30, 28, 26]) statue(g, CX, 58, z, "north");
  for (const z of [44, 46, 48]) statue(g, CX, 58, z, "south");
}
