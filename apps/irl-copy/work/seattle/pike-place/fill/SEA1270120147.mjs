// Waterfront Landings Condominium (Condominium, Residential; built 1997-2000; 2000 Alaskan Way). Five storeys of
// brick on a stone plinth over a comb-shaped plan: a one-cell brick shell with stone storey bands, white-terracotta
// frames around glass bays, a glazed ground floor on the street face, three recessed entrances under dark hood
// canopies, a stone cornice and brick parapet, and mechanical penthouse boxes with grilles and copper vents on the
// roof. Glowstone behind some glass and the entrance lanterns give it its dusk read. No interiors: air behind the
// glass, a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill/SEA1270120147";
const cells = JSON.parse(readFileSync(`${FILE}.cells.json`, "utf8"));   // [x, z, ground] per footprint cell, x 0..62, z 0..16

const g = new Voxels([63, 37, 17]);
const ground = new Map(cells.map(([x, z, gy]) => [`${x},${z}`, gy]));
const has = (x, z) => ground.has(`${x},${z}`);
const STREET = "N";                       // the z=0 face: the long street front, entrances and glazed base
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = (x, z) => Object.keys(OUT).filter((d) => !has(x + OUT[d][0], z + OUT[d][1]));
const inward = (d) => [-OUT[d][0], -OUT[d][1]];
const STOREY_LINES = [5, 10, 15, 20];    // stone storey bands; storeys are 5 blocks
const ROOF = 25;                         // roof surface row, about 25 blocks above the lowest ground
const PARAPET = 27;
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const wallState = (d) => (d === "N" || d === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const [x, z, gy] of cells) {
  const out = faces(x, z);

  // Foundation under the cell up to its ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  if (!out.length) {
    // Interior: floor slab at each storey line, roof deck on top, air between.
    for (const y of [gy, ...STOREY_LINES]) put(x, y, z, "smooth_stone");
    put(x, ROOF, z, "stone");
    continue;
  }

  // Shell: brick from the plinth to the parapet, then the stone bands and cornice over it.
  for (let y = gy; y <= PARAPET - 1; y++) put(x, y, z, "bricks");
  put(x, gy, z, "stone_bricks");                                              // plinth course
  for (const y of STOREY_LINES) put(x, y, z, "stone_bricks");                 // storey lines
  put(x, ROOF, z, "smooth_stone");                                            // cornice
  put(x, PARAPET - 1, z, "bricks");
  put(x, PARAPET, z, "stone_brick_slab", { type: "top", waterlogged: "false" });  // parapet cap

  // Corner cells (two exposed faces) are dressed sandstone quoins the full height.
  if (out.length >= 2) {
    for (let y = gy; y < PARAPET; y++) put(x, y, z, "smooth_sandstone");
    continue;
  }

  const d = out[0];
  const a = d === "N" || d === "S" ? x : z;
  const bay = a % 5;                      // 0 pier, 1 and 4 frame, 2 and 3 glass pair
  const street = d === STREET && z === 0;
  const [ix, iz] = inward(d);
  const innerOpen = has(x + ix, z + iz) && faces(x + ix, z + iz).length === 0;

  for (let k = 0; k < 5; k++) {
    const lo = k === 0 ? gy + 1 : 5 * k + 1, hi = 5 * k + 3;
    if (lo > hi || bay === 0) continue;
    const glass = bay === 2 || bay === 3 || (street && k === 0);
    for (let y = lo; y <= hi; y++) {
      if (glass) put(x, y, z, "glass_pane", wallState(d));
      else put(x, y, z, "white_terracotta");
    }
    // Warm light behind some glass: a glowstone in the room cell, about one bay in four.
    const mid = k === 0 ? gy + 2 : 5 * k + 2;
    if (glass && bay === 2 && innerOpen && (a * 5 + k * 3 + d.charCodeAt(0)) % 4 === 0) {
      put(x + ix, mid, z + iz, "glowstone");
    }
  }
}

// Entrances on the street face: a door in the wall, white-terracotta jambs, a dark hood canopy over the
// recessed vestibule (the cell in front of the door), and a hanging lantern under it.
for (const x of [12, 36, 54]) {
  const gy = ground.get(`${x},0`);
  put(x, gy + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gy + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const jx of [x - 1, x + 1]) for (const y of [gy + 1, gy + 2]) put(jx, y, 0, "white_terracotta");
  for (const dx of [-1, 0, 1]) for (const dz of [0, 1]) {
    put(x + dx, gy + 3, dz, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
  for (const y of [gy + 1, gy + 2]) put(x, y, 1, "air");                       // vestibule stays open
  put(x, gy + 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Roof: two penthouse mechanical boxes on the roof deck, each with a grille, and copper vent stacks.
const box = (x0, x1, z0, z1, y0, y1, block) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++) put(x, y, z, block);
};
box(23, 27, 4, 5, ROOF + 1, ROOF + 2, "light_gray_concrete");
box(23, 27, 4, 5, ROOF + 3, ROOF + 3, "iron_bars");
box(40, 46, 3, 5, ROOF + 1, ROOF + 3, "light_gray_concrete");
box(40, 46, 3, 5, ROOF + 4, ROOF + 4, "iron_bars");
for (const x of [14, 31, 58]) box(x, x, 4, 4, ROOF + 1, ROOF + 2, "weathered_copper");

const saved = g.save(`${FILE}.nbt`);
console.log(`built ${saved.blocks} blocks, palette ${saved.palette}`);
