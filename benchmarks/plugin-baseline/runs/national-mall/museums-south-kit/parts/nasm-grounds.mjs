// NASM grounds (plan.md E7, E11): the granite terraces and forecourts at y 1, the south planter strips, and the terrace
// lamp posts. Everything sits on the plot's own ground: paving only on '#' cells, at y 1 (on g = 0 cells the ground block
// is y 0, so this is one step up; on g = 1 cells it replaces the grass course). Curbs and plants stand at g + 1 of their
// own cell. Writes go through g.set, so runParts refuses any cell an earlier part (the shell, the glass bays) already owns.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { NASM_FOOTPRINT, NASM_GROUND, NASM_TERRACES, lamp_post } from "../vocab.mjs";

const STONE = "polished_granite";
const onSite = (x, z) => z >= 0 && z < NASM_FOOTPRINT.length && x >= 0 && x < NASM_FOOTPRINT[z].length && NASM_FOOTPRINT[z][x] === "#";
const groundAt = (x, z) => Number(NASM_GROUND[z][x]);

// the terraces, forecourts and aprons at y 1; z 3 is the Mall-side strip, except the G2 entry steps (part 2) at x 38..49
function terraces(g) {
  let n = 0;
  const pave = (x, z, y = 1, block = STONE) => {
    if (!onSite(x, z)) return;
    g.set(x, y, z, block);
    n++;
  };
  const slab = (x, z) => {
    if (!onSite(x, z)) return;
    g.set(x, 1, z, ...B.slab(STONE, "bottom"));
    n++;
  };
  for (let x = 0; x <= 87; x++) if (!(x >= 38 && x <= 49)) pave(x, 3);       // north strip (Mall side)
  const [west, ad, east] = NASM_TERRACES;
  for (let x = west.x0; x <= west.x1; x++) for (let z = west.z0; z <= west.z1; z++) pave(x, z);
  for (let x = ad.x0; x <= ad.x1; x++) for (let z = ad.z0; z <= ad.z1; z++) pave(x, z);
  for (let x = east.x0; x <= east.x1; x++) for (let z = east.z0; z <= east.z1; z++) pave(x, z);
  for (let x = east.x0; x <= east.x1; x++) slab(x, 1);                       // forecourt edge: half step to grade
  for (let x = 84; x <= 87; x++) slab(x, 0);
  for (let z = 0; z <= 26; z++) for (const x of [0, 1, 86, 87]) pave(x, z);  // side aprons to the footprint edge
  for (let x = 40; x <= 48; x++) pave(x, 27);                                // G2 south landing (paving, not planter)
  return n;
}

// the south planter strips: a 1-high granite curb round each stub (g + 1 of its own cell), grass inside, an azalea in
// the middle and short grass round it. Stubs run along z 27..29 (x 1..11 also to z 30).
const STUBS = [[1, 11, 30], [14, 23, 29], [26, 36, 29], [52, 62, 29], [65, 75, 29], [77, 87, 29]];
function planters(g) {
  let n = 0;
  for (const [x0, x1, z1] of STUBS) {
    const cx = Math.floor((x0 + x1) / 2), cz = 28;
    // a garden lamp inside each stub, one cell east of the azalea: it lights the stub and its cell is not planted
    const post = { x: cx + 1, z: cz };
    for (let x = x0; x <= x1; x++) for (let z = 27; z <= z1; z++) {
      if (!onSite(x, z)) continue;
      const y = groundAt(x, z) + 1;
      const edge = x === x0 || x === x1 || z === 27 || z === z1;
      if (edge) g.set(x, y, z, STONE);
      else if (x === post.x && z === post.z) n += lamp_post(g, x, y, z);
      else g.set(x, y, z, x === cx && z === cz ? "azalea" : "short_grass");
      n++;
    }
  }
  return n;
}

// the terrace lamp posts (plan E11, RESERVED): granite_wall post with a standing lantern, first cell above the paving
// (1, 20) and (86, 14) light the 1-wide aprons beside the west and east cubes, which would otherwise stay dark
const LAMPS = [[2, 2], [9, 2], [27, 2], [33, 2], [53, 2], [62, 2], [73, 2], [85, 2], [37, 3], [50, 3], [1, 20], [86, 14]];
function lamps(g) {
  let n = 0;
  for (const [x, z] of LAMPS) if (onSite(x, z)) n += lamp_post(g, x, 2, z);
  return n;
}

export function build(g) {
  terraces(g);
  planters(g);
  lamps(g);
}
