import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 948317557 (Eden Terrace / Newton edge of the CBD): a flat-roofed two-storey commercial block of the 1920s-30s,
// plastered brick with cream piers, the Auckland shopfront type. A basalt plinth; shopfront glass under a fascia course
// on the street storey; dark timber sills and heads on the upper windows; a parapet with a stone cap. The lidar's tops
// (10 / 8 / 3 above y 0) are snapped to three flat tiers: the main block, the shoulders on the north side, the entrance bay.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317557.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317557.nbt";

const tier = (roof) => (roof >= 9 ? 10 : roof >= 6 ? 8 : 3);
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { top: tier(roof) }]));
const inFp = (x, z) => fp.has(`${x},${z}`);
const topOf = (x, z) => fp.get(`${x},${z}`).top;

const OUTWARD = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(OUTWARD).filter((f) => { const [dx, dz] = OUTWARD[f]; return !inFp(x + dx, z + dz); });

const g = new Voxels([11, 23, 13]);
const set = (x, y, z, block, state) => g.set(x, y, z, block, state);
const paneState = (face) => (face === "N" || face === "S"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

const windowCells = [];
for (const key of fp.keys()) {
  const [x, z] = key.split(",").map(Number);
  const top = topOf(x, z);
  const faces = exposed(x, z);
  const edge = faces.length > 0;
  // the stepped south-west side makes most edge cells two-faced, so piers follow the first exposed face's parity, not corners
  const face = faces[0];
  const idx = face === "N" || face === "S" ? x : z;
  const pier = idx % 2 === 0;

  for (let y = 0; y < 2; y++) set(x, y, z, "stone_bricks");            // basalt plinth, on every cell
  for (let y = 2; y < top; y++) {
    if (!edge) {                                                         // interior: floor slab per storey, air, roof deck
      if (y === top - 1) set(x, y, z, "gray_concrete");
      else if (y === 5) set(x, y, z, "smooth_stone");
      continue;
    }
    if (y === top - 1) set(x, y, z, "stone_bricks");                     // parapet with stone cap
    else if (y === 2) set(x, y, z, "polished_andesite");                 // bulkhead under the shopfront
    else if (y === 5) set(x, y, z, "smooth_quartz");                     // fascia / storey belt course
    else if (y === 3 || y === 4) {                                       // shopfront glass between cream piers
      if (pier) set(x, y, z, "smooth_quartz");
      else { set(x, y, z, "glass_pane", paneState(face)); windowCells.push({ x, y, z, face, ground: true }); }
    } else {                                                             // upper storey: sill, glass, head
      const frame = y === 6 || y === top - 2;
      if (pier) set(x, y, z, "smooth_quartz");
      else if (frame) set(x, y, z, "dark_oak_planks");
      else { set(x, y, z, "glass_pane", paneState(face)); windowCells.push({ x, y, z, face, ground: false }); }
    }
  }
}

// Warm light behind some windows: a lamp stands on the floor of the room inside the glass (air behind the pane).
for (const w of windowCells) {
  const [dx, dz] = OUTWARD[w.face];
  const ix = w.x - dx, iz = w.z - dz;
  if (!inFp(ix, iz) || exposed(ix, iz).length) continue;
  const lamp = w.ground ? (w.x + 2 * w.z) % 4 === 1 : (3 * w.x + w.z) % 5 === 0;
  if (!lamp) continue;
  const ly = w.ground ? 2 : 6;
  if (topOf(ix, iz) - 1 <= ly) continue;
  if (w.ground) set(ix, ly, iz, "glowstone");
  else set(ix, ly, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// The entrance on the north side: a pair of doors under a hanging lantern, between the piers.
const door = (half) => ["dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" }];
set(4, 0, 2, ...door("lower"));
set(4, 0, 3, ...door("upper"));
set(4, 0, 4, "lantern", { hanging: "true", waterlogged: "false" });

// Roof: a stair and lift overrun (2x2, stone cap) and two plant boxes, all standing on the roof deck.
for (const x of [4, 5]) for (const z of [5, 6]) {
  for (const y of [10, 11]) set(x, y, z, "smooth_quartz");
  set(x, 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
for (const [x, z] of [[8, 3], [9, 3], [8, 4]]) set(x, 10, z, "light_gray_concrete");

g.save(OUT);
console.log(`built ${OUT}: ${g.count()} blocks, ${g.palette.length - 1} block states`);
