// Roofs (P2): the four pieces of plan.md ROOF PIECES, built in the order R3, R1, R2, R5. Each is one roof() call on the
// cottage preset with the dark-slate palette. R5 goes through vocab.roofPiece. R3, R1 and R2 are local, because:
//  - their 3-wide dormers are dropped on these shallow half pitches, so R3 and R1 use 1-wide dormers;
//  - the stock spruce fascia and soffit become dark oak (black accents), to keep the roof dark;
//  - the cottage texture adds cracked_deepslate_tiles, which is not in palette.json, so R1 and R3 take the plain material;
//  - the roof's eaves are protected from every shell opening (reserved cell), so no write is refused by the shell.
//  - R3 has no west eave: its overhang would reach x=-1, off the grid, and roof() then shifts every cell one block east.
// Every call dry-runs first.
import { roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { roofPiece, isReserved, ROOF_PALETTE, SMOOTH_SANDSTONE, SMOOTH_QUARTZ, GLASS_PANE, IRON_BARS } from "../vocab.mjs";

const DARK_EDGES = { fascia: "dark_oak", soffit: "dark_oak" };
const LOCAL = {
  R3: { footprint: [[0, 6, 12, 19]], o: { style: "gable", ridgeAxis: "x", pitch: "half", overhang: { north: 1, west: 0, south: 1, east: 0 }, maxHeight: 4, gable: SMOOTH_SANDSTONE, edges: DARK_EDGES, texture: false, dormers: { face: "north", count: 2, style: "gable", width: 1, height: 2, window: GLASS_PANE } } },
  R1: { footprint: [[12, 8, 33, 23], [33, 12, 43, 27]], o: { style: "hip", pitch: "half", overhang: { north: 0, west: 0, south: 1, east: 1 }, eave: "plain", ridge: "slab", maxHeight: 4, edges: DARK_EDGES, texture: false, dormers: { face: "south", count: 2, style: "gable", width: 1, height: 2 }, keep: [{ from: [37, 1, 10], to: [39, 14, 12] }] } },
  R2: { footprint: [[18, 4, 27, 14]], o: { style: "gable", ridgeAxis: "z", pitch: 45, eave: "cornice", trim: SMOOTH_QUARTZ, verge: SMOOTH_QUARTZ, gable: SMOOTH_QUARTZ, ridge: "none", maxHeight: 5 } },
};

// every cell the shell reserved as an opening or void, plus the four shell-unset cells at the roof line (the garage/centre
// wall at z20..21 and the front wall at (17,8,8)) that the eaves would otherwise write into: the roof must not write there
const SHELL_UNSET = [[12, 8, 20], [12, 9, 20], [12, 9, 21], [17, 8, 8]];
function openings() {
  const set = new Set(SHELL_UNSET.map((c) => c.join(",")));
  for (let x = 0; x <= 43; x++) for (let y = 8; y <= 14; y++) for (let z = 0; z <= 31; z++) if (isReserved(x, y, z)) set.add(`${x},${y},${z}`);
  return set;
}

function localPiece(g, id) {
  const { footprint, o } = LOCAL[id];
  const opts = { y: 10, material: ROOF_PALETTE, chimneys: [], protect: openings(), ...o };
  roof(g, footprint, "cottage", { ...opts, dryRun: true });   // dry run: facts and warnings only, writes nothing
  return roof(g, footprint, "cottage", opts);
}

export function build(g) {
  localPiece(g, "R3");
  localPiece(g, "R1");
  localPiece(g, "R2");
  // R2's attic window (plan E: x22..23 y11 z4), in an iron-bar frame, as vocab.roofPiece does for R2
  for (const [x, y, z] of [[21, 11, 4], [24, 11, 4], [22, 12, 4], [23, 12, 4]]) g.set(x, y, z, IRON_BARS, {});
  for (const x of [22, 23]) g.set(x, 11, 4, GLASS_PANE, {});
  roofPiece(g, "R5", { dryRun: true });
  roofPiece(g, "R5");
}
