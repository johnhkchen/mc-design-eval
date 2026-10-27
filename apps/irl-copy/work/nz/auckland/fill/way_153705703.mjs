// Saint Paul's, Auckland: a Gothic Revival stone church on a long diagonal footprint. The roof is the lidar profile
// (smoothed by a 3x3 footprint mean), so the nave ridge runs to the tallest point and falls at about 45 degrees to the
// eaves. Walls are dark volcanic-style stone (stone bricks, cracked patches), dressed with polished andesite quoins,
// string courses and window surrounds, lancet windows in one-cell slots with an air gap behind the glass, a slate roof
// of deepslate tiles with stepped stairs on the pitch, and a dark oak door on the north tip.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_153705703.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..48, z 0..43

const DIRS = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };
const NAME = { E: "east", W: "west", N: "north", S: "south" };

// the footprint, with the lidar roof smoothed into clean tiers (3x3 mean over footprint cells)
const C = new Map();
for (const [x, z, ground, roof] of cells) C.set(`${x},${z}`, { x, z, g: ground, roofRaw: roof });
const cell = (x, z) => C.get(`${x},${z}`);
for (const c of C.values()) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const o = cell(c.x + dx, c.z + dz); if (o) { s += o.roofRaw; n++; } }
  c.R = Math.round(s / n);                                    // the roof's top is layer R-1; the column is solid from y 0
}
const maxR = Math.max(...[...C.values()].map((c) => c.R));
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !cell(x + DIRS[d][0], z + DIRS[d][1]));
for (const c of C.values()) { c.ex = exposed(c.x, c.z); }   // outward faces; empty = interior

// overrides: "x,y,z" -> [block, state], or null for air (the glass's gap and the cavities)
const ov = new Map();
const put = (x, y, z, block, state) => ov.set(`${x},${y},${z}`, [block, state]);
const carve = (x, y, z) => ov.set(`${x},${y},${z}`, null);

// the door: the northern tip's single-face cell nearest the middle, on the lowest course it can reach
const doorCands = [...C.values()].filter((c) => c.ex.length === 1 && c.ex[0] === "N" && c.R - c.g >= 6);
doorCands.sort((a, b) => a.z - b.z || Math.abs(a.x - 24) - Math.abs(b.x - 24));
const door = doorCands[0];

// lancet windows: one-cell slots on single-face wall cells every third cell, with an air gap behind (1 in from the face)
for (const c of C.values()) {
  if (c.ex.length !== 1 || c === door) continue;
  const d = c.ex[0], [dx, dz] = DIRS[d];
  const GH = Math.min(7, c.R - c.g - 8);
  if (GH < 4 || ((c.x - c.z) % 3 + 3) % 3 !== 0) continue;
  const cx = c.x - dx, cz = c.z - dz;
  if (!cell(cx, cz) || exposed(cx, cz).length) continue;
  const sill = c.g + 2, head = c.g + 3 + GH;
  const st = d === "E" || d === "W"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
  for (let y = c.g + 3; y < head; y++) { put(c.x, y, c.z, "white_stained_glass_pane", st); carve(cx, y, cz); }
  if ((c.x + 2 * c.z) % 3 === 0) put(cx, c.g + 3 + Math.floor(GH / 2), cz, "glowstone");   // warm light behind a third of the glass
  put(c.x, sill, c.z, "polished_andesite");
  put(c.x, head, c.z, "polished_andesite");
}

// the outer skin: base course, quoined corners, storey strings on the plain piers, a cornice at the eave
for (const c of C.values()) {
  const top = c.R - 1;
  if (c.ex.length === 0) continue;
  for (let y = c.g; y < top; y++) {
    if (c.ex.length >= 2) put(c.x, y, c.z, "polished_andesite");                              // quoins
  }
  if (c.ex.length === 1) {
    put(c.x, c.g, c.z, "chiseled_stone_bricks");                                              // base course
    if (!ov.has(`${c.x},${c.g + 3},${c.z}`)) for (const y of [c.g + 4, c.g + 8]) if (y < top) put(c.x, y, c.z, "chiseled_stone_bricks");
  }
  put(c.x, top, c.z, "polished_andesite");                                                  // cornice
}

// the door, framed by a lintel
if (door) {
  const f = NAME[door.ex[0]];
  put(door.x, door.g, door.z, "dark_oak_door", { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, door.g + 1, door.z, "dark_oak_door", { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(door.x, door.g + 2, door.z, "polished_andesite");
}

// solid massing from y 0 to the roof; the top layer is the slate roof, stepped on the pitch (stairs face the lower neighbour)
const vox = new Voxels([49, maxR + 2, 44]);
for (const c of C.values()) {
  const top = c.R - 1;
  for (let y = 0; y <= top; y++) {
    const k = `${c.x},${y},${c.z}`;
    if (ov.has(k)) { const v = ov.get(k); if (v) vox.set(c.x, y, c.z, v[0], v[1]); continue; }
    if (y < top) { vox.set(c.x, y, c.z, (c.x * 31 + y * 17 + c.z * 7) % 9 === 0 ? "cracked_stone_bricks" : "stone_bricks"); continue; }
    const low = Object.keys(DIRS).find((d) => { const o = cell(c.x + DIRS[d][0], c.z + DIRS[d][1]); return o && o.R === c.R - 1; });
    if (low) vox.set(c.x, y, c.z, "deepslate_tile_stairs", { facing: NAME[low], half: "bottom", shape: "straight", waterlogged: "false" });
    else vox.set(c.x, y, c.z, "deepslate_tiles");
  }
}

// lanterns on the ridge's top, every fifth cell along it
for (const c of C.values()) {
  if (c.R === maxR && c.ex.length === 0 && (c.x + c.z) % 5 === 0) vox.set(c.x, c.R, c.z, "lantern", { hanging: "false", waterlogged: "false" });
}

const out = vox.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_153705703.nbt");
console.log(`saved way_153705703.nbt: ${out.blocks} blocks, ${out.palette} palette entries, roof max ${maxR}, door at ${door ? `${door.x},${door.z}` : "none"}`);
