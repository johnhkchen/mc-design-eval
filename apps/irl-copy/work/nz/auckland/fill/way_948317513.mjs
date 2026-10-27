import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A single-storey Edwardian brick shop (Eden Terrace / Newton commercial strip, c.1905-1920): red brick walls on a
// dressed stone base, a shopfront of glass panes on the ground storey, a stone storey line, an upper row of small
// windows, and a flat roof behind a stone parapet. The lidar roof heights (4-6 above y 0) are smoothed into three
// tiers so the parapet steps in clean flats rather than per-cell noise.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317513.cells.json", "utf8"));
const X = 9, Z = 16, Y = 19;
const g = new Voxels([X, Y, Z]);

// footprint: cell -> { ground, top }
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof });
const inFp = (x, z) => fp.has(`${x},${z}`);

// smooth the roof: 3x3 mean over footprint neighbours, rounded, clamped to the three tiers 4 / 5 / 6
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = fp.get(`${x + dx},${z + dz}`); if (o) { sum += o.roof; n++; }
  }
  c.top = Math.min(6, Math.max(4, Math.round(sum / n)));
}

// outward faces of a footprint cell: the sides where the neighbour is outside the footprint
const outward = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inFp(x + dx, z + dz));
const isRing = (x, z) => outward(x, z).length > 0;

// ground-storey shopfront and upper windows share a parity so windows alternate with piers along each face
const winCell = (x, z) => (x + z) % 2 === 1;

// the door: on the south (z max) face, ground storey, centred on the front
const door = (() => {
  let best = null;
  for (const [key, c] of fp) {
    const [x, z] = key.split(",").map(Number);
    if (z !== Z - 1 || !isRing(x, z)) continue;
    const d = Math.abs(x - 3.5);
    if (!best || d < best.d) best = { x, z, d };
  }
  return best;
})();

// the chimney: an interior cell on the top tier, nearest the middle
const chimney = (() => {
  let best = null;
  for (const [key, c] of fp) {
    const [x, z] = key.split(",").map(Number);
    if (isRing(x, z) || c.top !== 6) continue;
    const d = Math.hypot(x - 4, z - 8);
    if (!best || d < best.d) best = { x, z, d };
  }
  return best;
})();

const shopWindowRows = (y0) => [y0 + 1, y0 + 2];
const upperWindowRows = (y0, top) => { const rows = []; for (let y = y0 + 4; y <= top - 2; y++) rows.push(y); return rows; };

for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const ground = c.ground, top = c.top, ring = isRing(x, z);
  const faces = outward(x, z);

  // foundation under everything, then the body up to the tier's top
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y < top; y++) {
    if (y === top - 1) {
      // roof: a stone parapet cap on the walls, deepslate tiles across the flat roof
      if (ring) g.set(x, y, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
      else g.set(x, y, z, "deepslate_tiles");
      continue;
    }
    if (y === ground) { g.set(x, y, z, ring ? "polished_andesite" : "stone"); continue; }
    if (!ring) { g.set(x, y, z, "stone"); continue; }
    if (y === ground + 3 && ground + 3 < top - 1) { g.set(x, y, z, "smooth_stone"); continue; }   // storey line
    const windowRow = shopWindowRows(ground).includes(y) || upperWindowRows(ground, top).includes(y);
    if (windowRow && winCell(x, z)) {
      const ew = faces[0][0] !== 0;              // a window on an x-facing face: the pane runs along z
      g.set(x, y, z, "glass_pane", { north: String(ew), south: String(ew), east: String(!ew), west: String(!ew), waterlogged: "false" });
      continue;
    }
    g.set(x, y, z, "bricks");
  }

  // the door: lower and upper halves in the shopfront at the door cell
  if (door && door.x === x && door.z === z) {
    g.set(x, ground + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, ground + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// the air gap behind each window, with a warm glowstone in every third one
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (!isRing(x, z)) continue;
  for (const [dx, dz] of outward(x, z)) {
    const ix = x - dx, iz = z - dz;
    if (!inFp(ix, iz) || isRing(ix, iz)) continue;
    const top = fp.get(`${ix},${iz}`).top, ground = fp.get(`${ix},${iz}`).ground;
    if (!winCell(x, z)) continue;
    if (door && door.x === x && door.z === z) continue;
    const rows = [...shopWindowRows(ground), ...upperWindowRows(ground, top)];
    for (const y of rows) if (y < top - 1) g.set(ix, y, iz, "air");
    // one window in three lit from behind, at the shopfront level
    if ((x * 7 + z * 3) % 3 === 0) g.set(ix, ground + 1, iz, "glowstone");
  }
}

// a chimney stack on the top tier, standing on the roof
if (chimney) {
  g.set(chimney.x, 6, chimney.z, "bricks");
  g.set(chimney.x, 7, chimney.z, "bricks");
  g.set(chimney.x, 8, chimney.z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317513.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, ${r.palette} palette entries`);
