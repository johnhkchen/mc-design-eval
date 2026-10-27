// Mt Eden view, CBD edge: one 118 x 54 concrete-frame office block on a shopfront base, built as a 1970s-80s Auckland
// commercial block (white precast spandrels, grey frames, tinted glazing, polished-andesite plinth, quartz awnings).
// Massing follows the lidar roof, median-smoothed and snapped to 4-block storey lines (8, 12, 16, 20); exterior walls
// are a shell, interiors are air with a floor slab per storey and a solid roof; glowstone sits behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_448057556.cells.json`, "utf8"));   // [x, z, ground, roof]

const H = 33;
const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, base: ground, roof, T: 0 }]));
const inFp = (x, z) => fp.has(`${x},${z}`);
const at = (x, z) => fp.get(`${x},${z}`);
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];

// tiers: 5x5 median of the lidar roof over footprint neighbours (kills the 1-2 cell spikes on thin strips), snapped to
// whole storeys (at least one)
for (const c of fp.values()) {
  const near = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const n = at(c.x + dx, c.z + dz); if (n) near.push(n.roof); }
  c.T = Math.max(4, Math.round(median(near) / 4) * 4);
}
// a tower cell with fewer than two tall neighbours is a spike on a thin strip: drop it one storey (twice at most)
for (let pass = 0; pass < 2; pass++) for (const c of fp.values()) {
  if (c.T < 12) continue;
  let tall = 0;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = at(c.x + dx, c.z + dz); if (n && n.T >= c.T - 4) tall++; }
  if (tall < 2) c.T -= 4;
}

const ext = (x, z) => !inFp(x, z - 1) || !inFp(x, z + 1) || !inFp(x - 1, z) || !inFp(x + 1, z);
const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outward = (x, z) => (!inFp(x, z - 1) ? "north" : !inFp(x, z + 1) ? "south" : !inFp(x - 1, z) ? "west" : "east");

const g = new Voxels([118, H, 54]);
const over = new Map();                    // "x,y,z" -> block, applied last (lights behind glass)

for (const c of fp.values()) {
  const { x, z, base, T } = c;
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone");                            // foundation up to the lowest ground under it

  if (!ext(x, z)) {                                                                  // interior: floor slab per storey, air between
    for (let y = base; y <= T - 1; y++) if (y === base || y === T - 1 || y % 4 === 0) g.set(x, y, z, "light_gray_concrete");
    // roof plant on the tallest tiers: a few grey plant boxes on the solid roof
    if ((T === 16 || T === 20) && x % 10 >= 4 && x % 10 <= 6 && z % 8 >= 3 && z % 8 <= 4) g.set(x, T, z, "gray_concrete");
    continue;
  }

  // exterior shell: which way the facade runs (b = bay coordinate), corners, and its outward face
  const zFace = !inFp(x, z - 1) || !inFp(x, z + 1);                                   // facade runs along x
  const xFace = !inFp(x - 1, z) || !inFp(x + 1, z);
  const corner = zFace && xFace;
  const b = zFace ? x : z;
  const face = outward(x, z);
  const [ox, oz] = OUT[face];
  const pane = "light_blue_stained_glass_pane";
  const paneState = { north: String(!zFace), south: String(!zFace), east: String(zFace), west: String(zFace), waterlogged: "false" };

  g.set(x, base, z, "smooth_quartz");                                                 // base course, light so the plinth reads
  for (let y = base + 1; y <= T - 2; y++) {
    const s = y >> 2, r = y & 3;
    if (r === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }                   // storey line
    if (s === 0) {                                                                      // shopfront: glazed bays, entrances
      if (base === 0 && !corner && b % 24 === 12 && y <= 2) {                           // doors (ground floor, on the outward face)
        g.set(x, y, z, "dark_oak_door", { facing: face, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (base === 0 && !corner && b % 24 === 12 && y === 3) {                          // quartz awning over the door, sloping out
        g.set(x, y, z, "smooth_quartz_stairs", { facing: face, half: "top", shape: "straight", waterlogged: "false" });
        continue;
      }
      if (corner || b % 3 === 0) { g.set(x, y, z, "gray_concrete"); continue; }        // frames and corners
      g.set(x, y, z, pane, paneState);
      // shopfront light: glowstone on the floor just inside some bays
      const ix = x - ox, iz = z - oz, n = at(ix, iz);
      if (y === base + 1 && b % 6 === 1 && n && !ext(ix, iz) && y < n.T - 2) over.set(`${ix},${y},${iz}`, "glowstone");
      continue;
    }
    if (r === 3) { g.set(x, y, z, "white_concrete"); continue; }                        // precast spandrel
    if (corner || b % 3 === 0) { g.set(x, y, z, "gray_concrete"); continue; }           // mullions
    g.set(x, y, z, s % 3 === 2 ? "gray_stained_glass_pane" : pane, s % 3 === 2 ? { ...paneState } : paneState);
    // a warm light sits in the room behind some upper-floor windows, on the floor slab
    if (r === 1 && b % 6 === 4) {
      const ix = x - ox, iz = z - oz, n = at(ix, iz);
      if (n && !ext(ix, iz) && y < n.T - 2) over.set(`${ix},${y},${iz}`, "glowstone");
    }
  }
  g.set(x, T - 1, z, "light_gray_concrete");                                          // roof cap
  g.set(x, T, z, "white_concrete");                                                    // parapet
}

for (const [k, block] of over) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block); }

const out = g.save(`${DIR}/way_448057556.nbt`);
console.log(`way_448057556: ${fp.size} cells, ${out.blocks} blocks, ${out.palette} palette entries`);
