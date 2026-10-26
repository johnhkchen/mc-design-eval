import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// An unnamed 1930s Federal-style office block (Indiana-limestone walls, stone base, smooth-quartz belts and cornice,
// steel-sash glass in bays, a central pedimented entry). Stepped massing from the lidar: a 7-block core on the north
// block (x 2-7, z 1-4), a 6-block north-south wing, a 5-block spine running south and a 4-block tail at its end.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65189.cells.json`, "utf8"));

const W = 10, D = 16, H = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;

// Lidar roof heights snapped to clean tiers: 7 only on the core rectangle (the raw 7 at x 8 and at z 5 is noise),
// 6 for the wing, 5 and 4 for the spine and tail (raw 4-5 kept where the spine steps down).
function snapRoof(x, z, raw) {
  if (raw >= 7 && x >= 2 && x <= 7 && z >= 1 && z <= 4) return 7;
  if (raw <= 4) return 4;
  if (raw === 5) return 5;
  return 6;
}
const top = new Map(), gnd = new Map();
for (const [x, z, gr, roof] of cells) { top.set(key(x, z), snapRoof(x, z, roof)); gnd.set(key(x, z), gr); }
const R = (x, z) => top.get(key(x, z));       // undefined outside the footprint

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposedFaces = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => R(x + dx, z + dz) === undefined).map(([d]) => d);
const isEnvelope = (x, z) => exposedFaces(x, z).length > 0;

// Storey lines: the ground storey is y 1-2 (doors and glass), a smooth-quartz belt at 3 (also the floor slab over the
// ground storey), upper windows at 4 (and 5 on the core), the top course at R-1.
const belt = (y) => y === 3;

function wallBlock(x, z, y, Rc) {
  if (y === 0) return ["stone_bricks"];                                       // stone base course
  if (y === Rc - 1 || belt(y)) return ["smooth_quartz"];                       // belt course and cornice
  const faces = exposedFaces(x, z);
  if (faces.length >= 2) return ["calcite"];                                    // corner pier, full height
  const face = faces[0];
  const along = face === "N" || face === "S" ? "x" : "z";
  const u = along === "x" ? x : z;
  if (u % 3 === 0) return ["calcite"];                                          // pier between bays
  // the central entry: two doors in the north face at x 4 and 5, flanked by piers at x 3 and 6
  if (face === "N" && (x === 4 || x === 5) && y <= 2) return ["dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 4 ? "left" : "right", open: "false", powered: "false" }];
  if (y === 4 || (Rc === 7 && y === 5)) {                                       // upper bays
    const pane = along === "x"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    return ["glass_pane", pane];
  }
  if (y === 1 || y === 2) {                                                     // ground-storey bays
    const pane = along === "x"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    return ["glass_pane", pane];
  }
  return ["calcite"];
}

for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const Rc = R(x, z);
  const env = isEnvelope(x, z);
  for (let y = 0; y < Rc; y++) {
    if (env) {
      const [block, state] = wallBlock(x, z, y, Rc);
      g.set(x, y, z, block, state);
    } else if (y === 0) {
      g.set(x, y, z, "stone_bricks");                                            // plinth under the interior
    } else if (y === Rc - 1 || (belt(y) && Rc >= 5)) {
      g.set(x, y, z, "smooth_stone");                                            // floor slab per storey, roof deck on top
    }
  }
}

// Warm light behind some glass: glowstone (ground storey) and shroomlight (upper storey) on the interior air cell
// just inward of a single-face bay, where the pane is not a pier.
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
for (const [x, z, , ] of cells) {
  const Rc = R(x, z);
  const faces = exposedFaces(x, z);
  if (faces.length !== 1 || !isEnvelope(x, z)) continue;
  const face = faces[0];
  const u = face === "N" || face === "S" ? x : z;
  if (u % 3 === 0 || (x + z) % 4 !== 1) continue;
  const [dx, dz] = inward[face];
  const ix = x + dx, iz = z + dz;
  if (R(ix, iz) === undefined || isEnvelope(ix, iz)) continue;
  g.set(ix, 1, iz, "glowstone");
  if (Rc >= 6 && (x + z) % 8 === 1) g.set(ix, 4, iz, "shroomlight");
}

// Roof plant room on the wing's roof: a calcite box two blocks square, one course above the deck
for (const [x, z] of [[3, 5], [4, 5], [3, 6], [4, 6]]) g.set(x, 6, z, "calcite");

const stats = g.save(`${DIR}/DC65189.nbt`);
console.log(JSON.stringify(stats));
