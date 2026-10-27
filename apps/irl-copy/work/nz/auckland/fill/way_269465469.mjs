// ECC, Auckland (way 269465469): a 1930s brick-and-plaster commercial block, two tiers (a 3-storey core
// at roof 12 over a 2-storey wing at roof 10), shopfronts on the ground floor, basalt plinth, plaster string
// courses and coping, steel-sash windows in brick piers, a recessed door, and glowing rooms behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465469.cells.json", "utf8"));

const X = 49, Y = 25, Z = 34;
const key = (x, z) => `${x},${z}`;

// the lidar roof (9..12) flattened into two clean tiers: 11-12 is the 3-storey core, 9-10 the 2-storey wings
const F = new Map();
for (const [x, z, g, r] of cells) F.set(key(x, z), { x, z, g, R: r >= 11 ? 12 : 10 });

const DIR = { N: [0, -1, "north"], S: [0, 1, "south"], W: [-1, 0, "west"], E: [1, 0, "east"] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };

// a wall face where the neighbour is outside the footprint or lower (the taller part's exposed side)
for (const c of F.values()) {
  c.exp = Object.keys(DIR).filter((d) => {
    const n = F.get(key(c.x + DIR[d][0], c.z + DIR[d][1]));
    return !n || n.R < c.R;
  });
  c.wall = c.exp.length > 0;
}

// plaster string courses at the storey lines y=4 and y=8, kept strictly between the ground and the coping
const strings = (c) => [4, 8].filter((s) => s > c.g && s < c.R - 1);

// what a wall row is: the plinth, the coping, a string course, a head (lintel) row, or glazing
function rowKind(y, c) {
  if (y === c.g) return "base";
  if (y === c.R - 1) return "coping";
  if (strings(c).includes(y)) return "string";
  let lo = c.g, hi = c.R - 1;
  for (const s of strings(c)) { if (s < y) lo = Math.max(lo, s); else hi = Math.min(hi, s); }
  return y === hi - 1 ? "lintel" : "glass";
}

// the face a wall cell shows: its one exposed side, or the corner (two perpendicular sides)
const isCorner = (c) => c.exp.some((d) => d === "N" || d === "S") && c.exp.some((d) => d === "E" || d === "W");
const faceOf = (c) => c.exp[0];
const along = (c, face) => (face === "N" || face === "S" ? c.x : c.z);   // position along the wall

// the door: on the face with the most exposed wall, on a brick pier column, near the middle of its run
const doorFace = (() => {
  const count = {};
  for (const c of F.values()) if (c.wall && c.exp.length === 1) count[c.exp[0]] = (count[c.exp[0]] || 0) + 1;
  return Object.keys(count).sort((a, b) => count[b] - count[a])[0];
})();
const doorRun = [...F.values()]
  .filter((c) => c.wall && c.exp.length === 1 && c.exp[0] === doorFace && along(c, doorFace) % 3 === 0)
  .sort((a, b) => along(a, doorFace) - along(b, doorFace));
const door = doorRun[Math.floor(doorRun.length / 2)];
const doorKey = door ? key(door.x, door.z) : null;

const g = new Voxels([X, Y, Z]);
const paneState = (face) => (face === "N" || face === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// a pseudo-random but stable choice so that about one window in five is lit
const lit = (x, y, z) => (x * 7 + z * 13 + y * 5) % 5 === 0;

for (const c of F.values()) {
  const { x, z, g: gr, R } = c;
  // foundation under everything, up to the ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_andesite");

  if (!c.wall) {
    // an interior cell: the floor at its ground, slabs at the storey lines, the roof on top; air between
    g.set(x, gr, z, "smooth_stone");
    for (const s of strings(c)) g.set(x, s, z, "smooth_stone");
    g.set(x, R - 1, z, "deepslate_tiles");
    continue;
  }

  // a wall cell: solid from the ground to the top, dressed by row and by bay
  const face = faceOf(c);
  const corner = isCorner(c);
  for (let y = gr; y < R; y++) {
    const kind = rowKind(y, c);
    if (kind === "base") { g.set(x, y, z, "polished_andesite"); continue; }
    if (kind === "coping" || kind === "string") { g.set(x, y, z, "smooth_quartz"); continue; }
    if (corner) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (kind === "lintel") { g.set(x, y, z, "smooth_quartz"); continue; }
    const bay = along(c, face);
    if (bay % 3 === 0) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "glass_pane", paneState(face));
    // a warm room behind the pane: the air cell just inside, never on a floor or string row
    const [dx, dz] = DIR[face];
    const ix = x - dx, iz = z - dz;
    const inner = F.get(key(ix, iz));
    if (inner && !inner.wall && lit(x, y, z)) g.set(ix, y, iz, "glowstone");
  }

  // the door: two rows on the plinth, a head course over it
  if (key(x, z) === doorKey) {
    const hinge = "left";
    g.set(x, gr, z, "dark_oak_door", { facing: DIR[face][2], half: "lower", hinge, open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing: DIR[face][2], half: "upper", hinge, open: "false", powered: "false" });
    g.set(x, gr + 2, z, "smooth_quartz");
  }

  // the roof of a wall cell: its top row is the coping (already set above)
}

// the interior roofs of the wings and core are the deepslate tiles; the wall tops are coping
// rooftop plant: two light-grey boxes on the 3-storey core roof, each on four roof cells of the same tier
const coreRoof = (x, z) => { const c = F.get(key(x, z)); return c && !c.wall && c.R === 12; };
const boxes = [];
for (let x = 0; x < X - 1 && boxes.length < 2; x++) for (let z = 0; z < Z - 1 && boxes.length < 2; z++) {
  if (![[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => coreRoof(a, b))) continue;
  if (boxes.some(([bx, bz]) => Math.abs(bx - x) < 6 && Math.abs(bz - z) < 6)) continue;
  boxes.push([x, z]);
}
for (const [bx, bz] of boxes) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
  g.set(bx + dx, 12, bz + dz, "light_gray_concrete");
  g.set(bx + dx, 13, bz + dz, "light_gray_concrete");
}

const counts = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269465469.nbt");
console.log(`way_269465469: ${counts.blocks} blocks, ${counts.palette} palette entries; door on ${doorFace}, ${boxes.length} rooftop boxes`);
