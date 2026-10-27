// Langton's Kiosk: a c.1910 two-storey red-brick shop block with a one-storey wing. Stone plinth and string course,
// a shopfront with a dark oak fascia on the north (street) face, sash-style glazing in white frames, a smooth stone
// cornice, and a flat roof with a brick chimney and a roof-plant box. Lanterns sit behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_31121947.cells.json`, "utf8"));
const W = 17, D = 20, H = 22;
const g = new Voxels([W, H, D]);

const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFp = (x, z) => at.has(`${x},${z}`);
const NEIGH = [[0, -1], [0, 1], [-1, 0], [1, 0]];           // north (street), south, west, east
const outFaces = (x, z) => NEIGH.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const isPerim = (x, z) => outFaces(x, z).length > 0;

// Lidar roof per cell, median over its 3x3 footprint neighbourhood, snapped to two flat tiers: one storey (5) or two (8)
const tierOf = (x, z) => {
  const rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = at.get(`${x + dx},${z + dz}`); if (c) rs.push(c.roof); }
  rs.sort((a, b) => a - b);
  return rs[Math.floor(rs.length / 2)] >= 6.5 ? 8 : 5;
};

const BRICK = "bricks", BASE = "stone_bricks", STONE = "smooth_stone", ROOF = "light_gray_concrete";
const FRAME = "white_concrete", GLASS = "glass", SHOP = "dark_oak_planks";
const LANTERN = { hanging: "false", waterlogged: "false" };
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

const lanterns = [];       // [x, y, z] behind windows, placed after the shell so interior cells are settled
const doorCandidates = []; // street cells on the ground storey
const T8 = [];             // interior two-storey roof cells, for the chimney and plant

for (const [key, { ground: gr }] of at) {
  const [x, z] = key.split(",").map(Number);
  const T = tierOf(x, z);
  const faces = outFaces(x, z);
  const perim = faces.length > 0, corner = faces.length > 1;
  const face = faces[0];
  const along = face ? (face[0] === 0 ? x : z) : 0;     // position along the face this cell belongs to
  const k = along % 5;                                    // 0 pier, 1 and 4 frame, 2 and 3 glass
  const street = !!face && !corner && face[0] === 0 && face[1] === -1;
  const glassCol = !corner && (k === 2 || k === 3);
  const frameCol = !corner && (k === 1 || k === 4);

  const put = (y, block, state) => g.set(x, y, z, block, state);
  for (let y = 0; y < gr; y++) put(y, BASE);             // foundation up to this cell's ground

  if (!perim) {                                          // interior: floor, floor slab per storey, roof on top
    put(gr, STONE);
    if (T === 8) put(4, STONE);
    put(T - 1, ROOF);
    if (T === 8) T8.push([x, z]);
    continue;
  }

  put(gr, BASE);                                         // plinth course
  for (let y = gr + 1; y < T; y++) {
    let b = BRICK;
    if (y === T - 1) b = STONE;                          // cornice
    else if (T === 8 && y === 4) b = STONE;              // string course at the upper floor line
    else if (y <= 3) {                                   // ground storey: glazing rows, then a lintel on row 3
      if (y === 3) b = street ? SHOP : glassCol || frameCol ? FRAME : BRICK;
      else if (street) b = glassCol ? GLASS : SHOP;      // shopfront: glass between dark oak mullions
      else b = glassCol ? GLASS : frameCol ? FRAME : BRICK;
    } else if (y === 5) b = glassCol ? FRAME : BRICK;    // upper sill under each window, brick between
    else b = glassCol ? GLASS : frameCol ? FRAME : BRICK;           // upper glazing on row 6
    put(y, b);
    const glazed = glassCol && (y === 1 || y === 2 || y === 6) && !(street && gr === 0 && y === 1);
    if (glazed) {                                        // a warm lantern just inside some windows
      const ix = x - face[0], iz = z - face[1];
      if (inFp(ix, iz) && !isPerim(ix, iz) && (x * 7 + z * 3 + y) % 3 === 0) lanterns.push([ix, y === 6 ? 5 : gr + 1, iz]);
    }
  }
  if (street && gr === 0) doorCandidates.push({ x, z, along });
}

// one entrance on the street face, at the middle of the ground-floor street cells
if (doorCandidates.length) {
  const alongs = doorCandidates.map((c) => c.along).sort((a, b) => a - b);
  const mid = alongs[Math.floor(alongs.length / 2)];
  const d = doorCandidates.find((c) => c.along === mid) ?? doorCandidates[0];
  g.set(d.x, 1, d.z, "dark_oak_door", DOOR("lower"));
  g.set(d.x, 2, d.z, "dark_oak_door", DOOR("upper"));
}

for (const [ix, y, iz] of lanterns) g.set(ix, y, iz, "lantern", LANTERN);

// roof plant: a chimney stack near the middle of the two-storey roof, and a plant box beside it
if (T8.length) {
  const cx = T8.reduce((s, [x]) => s + x, 0) / T8.length, cz = T8.reduce((s, [, z]) => s + z, 0) / T8.length;
  const [px, pz] = T8.reduce((best, c) => (Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best));
  g.set(px, 8, pz, BRICK); g.set(px, 9, pz, BRICK); g.set(px, 10, pz, BASE);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (T8.some(([x, z]) => x === px + dx && z === pz + dz)) { g.set(px + dx, 8, pz + dz, "gray_concrete"); break; }
  }
}

const out = g.save(`${HERE}/way_31121947.nbt`);
console.log(`way_31121947: ${out.blocks} blocks, ${out.palette} palette entries, ${cells.length} footprint cells`);
