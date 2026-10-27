// A 1990s concrete-framed office tower on a stone plinth, Auckland CBD fringe: the lidar's roof (about 61 blocks, 51 m)
// reads as a 14-storey core (roof at 59) over a 13-storey wing (55) and lower shoulders (35, 43, 51), each roof snapped to
// the nearest storey line. Storeys are 4 blocks from a datum at y 3 (the highest ground under the footprint); the plinth
// fills 0-2 under every cell so nothing floats. Each storey: a light-grey spandrel band, two rows of tinted glass between
// white precast piers every 3 blocks, and a head band. The ground storey is a glazed lobby with an iron door in a recess.
// Walls are the building's outer skin: a cell's face is exterior where its neighbour is outside the footprint or lower.
// Interiors are air except a floor slab per storey, a roof slab, and a few glowstone lamps just behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861452.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 39, H = 73, D = 28;
const g = new Voxels([W, H, D]);

const DATUM = 3;                                  // ground-floor line; storey n starts at 3 + 4n
const TOPS = [35, 43, 51, 55, 59];                // the storey lines the lidar roofs snap to
const snap = (r) => {                             // nearest storey line; a tie goes up
  let best = TOPS[0], bd = Infinity;
  for (const t of TOPS) { const d = Math.abs(t - r); if (d < bd || (d === bd && t > best)) { best = t; bd = d; } }
  return best;
};

const T = new Map();                              // "x,z" -> top y (exclusive) of that cell's massing
for (const [x, z, , r] of cells) T.set(`${x},${z}`, snap(r));
const inFp = (x, z) => T.has(`${x},${z}`);
const topOf = (x, z) => T.get(`${x},${z}`) ?? 0;
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const INWARD = { N: "south", S: "north", E: "west", W: "east" };

// exterior faces of cell (x, z) at height y: the neighbour is outside the footprint or has no volume at y
const exteriorAt = (x, z, y) => Object.keys(DIRS).filter((d) => {
  const [dx, dz] = DIRS[d]; const nx = x + dx, nz = z + dz;
  return !inFp(nx, nz) || topOf(nx, nz) <= y;
});

// the entrance: on the outward south face (the side the viewer sees), the cell nearest the middle of the run with the tallest roof
const southEdge = [...T.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => !inFp(x, z + 1));
const meanX = southEdge.reduce((s, [x]) => s + x, 0) / southEdge.length;
const door = southEdge.reduce((best, c) => {
  if (!best) return c;
  const score = (p) => topOf(p[0], p[1]) * 10 - Math.abs(p[0] - meanX);
  return score(c) > score(best) ? c : best;
}, null);
const doorKey = door ? `${door[0]},${door[1]}` : null;
const DOOR_FACING = "north";                      // inward from the south face

const GLASS = (x, z, F) => ((Math.floor(x / 3) + Math.floor(z / 3) + F / 4) % 5 === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");

// 1. foundation: solid stone from y 0 to the datum under every footprint cell
for (const key of T.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < DATUM; y++) g.set(x, y, z, y === DATUM - 1 ? "polished_andesite" : "stone_bricks");
}

// 2. storeys: facade where a face is exterior, slabs and roof where it is not
for (const key of T.keys()) {
  const [x, z] = key.split(",").map(Number), t = topOf(x, z);
  for (let y = DATUM; y < t; y++) {
    const F = DATUM + 4 * Math.floor((y - DATUM) / 4), o = y - F, ground = F === DATUM;
    const ext = exteriorAt(x, z, y);
    if (!ext.length) {                            // interior: a floor slab per storey, a roof slab on top
      if (o === 0) g.set(x, y, z, "smooth_stone");
      else if (y === t - 1) g.set(x, y, z, "gray_concrete");
      continue;
    }
    const ns = ext.includes("N") || ext.includes("S"), ew = ext.includes("E") || ext.includes("W");
    // piers on the 3-block mullion grid only: the stair-stepped edge is all corners, and a corner rule would white it out
    const pier = (ns && x % 3 === 0) || (ew && z % 3 === 0);
    if (ground) {                                 // the lobby: stone plinth band, glazed shopfront, dark fascia
      if (o === 0) { g.set(x, y, z, "polished_andesite"); continue; }
      if (o === 3) { g.set(x, y, z, "stone_bricks"); continue; }
      if (key === doorKey && ext.includes("S")) {
        const half = o === 1 ? "lower" : "upper";
        g.set(x, y, z, "iron_door", { facing: DOOR_FACING, half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      g.set(x, y, z, pier ? "stone_bricks" : "cyan_stained_glass");
      continue;
    }
    if (o === 0 || o === 3) g.set(x, y, z, pier ? "white_concrete" : "light_gray_concrete");   // spandrel and head bands
    else g.set(x, y, z, pier ? "white_concrete" : GLASS(x, z, F));                              // glazing between piers
  }
  // a stone coping on every exposed top edge
  if (exteriorAt(x, z, t - 1).length) g.set(x, t, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 3. glowstone lamps one block inside some lit windows: warm light through the glass, no fit-out. Only the first row of
// glazing (o = 1) of an outward face, and only where the cell inside is interior air over its floor slab.
for (const key of T.keys()) {
  const [x, z] = key.split(",").map(Number), t = topOf(x, z);
  for (let y = DATUM + 1; y < t; y++) {
    if ((y - DATUM) % 4 !== 1) continue;
    const ext = exteriorAt(x, z, y);
    if (!ext.length || (y === DATUM + 1)) continue;   // the lobby stays unlit inside
    const [dx, dz] = DIRS[ext[0]];
    const ix = x - dx, iz = z - dz;                   // the cell just inside this face
    if (!inFp(ix, iz) || exteriorAt(ix, iz, y).length) continue;
    if ((x * 7 + z * 3 + y) % 5 !== 0) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// 4. the plant room: a solid 3-high equipment box with louvred walls, set on the tower roof (top 59), 7 cells in from its edge
const core = new Set();
for (const key of T.keys()) {
  const [x, z] = key.split(",").map(Number);
  let ok = true;
  for (let dx = -3; dx <= 3 && ok; dx++) for (let dz = -3; dz <= 3 && ok; dz++) if (!inFp(x + dx, z + dz) || topOf(x + dx, z + dz) !== 59) ok = false;
  if (ok) core.add(key);
}
for (const key of core) {
  const [x, z] = key.split(",").map(Number);
  const ring = !core.has(`${x + 1},${z}`) || !core.has(`${x - 1},${z}`) || !core.has(`${x},${z + 1}`) || !core.has(`${x},${z - 1}`);
  for (let y = 59; y <= 61; y++) {
    if (ring && y === 60) g.set(x, y, z, (x + z) % 2 ? "iron_bars" : "white_concrete");   // louvres
    else g.set(x, y, z, "light_gray_concrete");
  }
  g.set(x, 62, z, "smooth_stone");
}

g.save(`${DIR}/way_292861452.nbt`);
