import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 162091785, Auckland (Mt Eden / Newton edge). Reads as a 1970s four-storey concrete-frame office block:
// a brick and stone plinth that shows as a lower storey on the downhill side, white concrete piers between
// blue-tinted glazing, concrete floor bands and storey lines, a stone cornice and parapet, a glazed north entrance
// with a stone lintel and hanging lanterns, and a small plant room on the roof. The lidar roof sets the massing:
// 18+ is the four-storey main block, 16-17 a three-storey wing, below 16 a two-storey wing.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162091785.cells.json`, "utf8"));

const PLINTH = 4;                       // rows 0-3: foundation and the lower (plinth) storey; floors at 4, 8, 12, 16
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const F = new Map();
for (const [x, z, ground, roof] of cells) {
  const tier = roof >= 18 ? 4 : roof >= 16 ? 3 : 2;
  F.set(`${x},${z}`, { x, z, ground, roof, tier });
}
const at = (x, z) => F.get(`${x},${z}`);
// faces that look out: off the footprint, or onto a lower wing
const faces = (c) => Object.entries(DIRS).filter(([, [dx, dz]]) => { const n = at(c.x + dx, c.z + dz); return !n || n.tier < c.tier; }).map(([d]) => d);
const pane = (face) => (face === "N" || face === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const isEntrance = (x, z, fs) => z === 1 && fs.includes("N") && x >= 7 && x <= 10;

const g = new Voxels([52, 32, 37]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);
const lights = [];

for (const c of F.values()) {
  const { x, z, ground, tier } = c;
  const fs = faces(c);
  const dr = 4 * tier + 3;                                  // deck row: the top storey's spandrel / cornice
  const face = fs[0];
  const along = face === "W" || face === "E" ? z : x;
  const pier = fs.length > 1 || along % 3 === 0;             // corners and every third bay are concrete piers

  // foundation to grade, then the plinth wherever the storey shows above grade on a face
  for (let y = 0; y < PLINTH; y++) {
    if (y < ground || !fs.length) put(x, y, z, "stone");
    else if (y === 3) put(x, y, z, "stone_bricks");          // base course
    else if (y === 0 || pier) put(x, y, z, "bricks");
    else put(x, y, z, "cyan_stained_glass_pane", pane(face));
  }

  for (let k = 0; k < tier; k++) {
    const s = PLINTH + 4 * k, top = k === tier - 1;
    put(x, s, z, "light_gray_concrete");                     // floor slab, full footprint
    if (!fs.length) continue;                                 // interior: slab only, air between floors
    for (const y of [s + 1, s + 2]) {
      if (pier) put(x, y, z, "white_concrete");
      else {
        put(x, y, z, k ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane", pane(face));
        if ((x * 7 + y * 3 + z) % 9 === 0) lights.push({ x, y, z, face });
      }
    }
    put(x, s + 3, z, top ? "stone_bricks" : "smooth_stone"); // storey line; the top one is the cornice
  }
  if (fs.length) put(x, dr + 1, z, "stone_bricks");          // parapet
  else put(x, dr, z, "light_gray_concrete");                 // roof deck over the interior
}

// glowstone lamps set just inside some glazed bays (on the floor slab, behind the glass)
let lamps = 0;
for (const { x, y, z, face } of lights) {
  const [dx, dz] = DIRS[face];
  const inner = at(x - dx, z - dz);
  if (inner && inner.tier * 4 + 3 > y && !faces(inner).length) { put(inner.x, y, inner.z, "glowstone"); lamps++; }
}

// north entrance: two dark-oak doors, a stone lintel, hanging lanterns either side
if (at(8, 1) && isEntrance(8, 1, faces(at(8, 1)))) {
  for (const x of [8, 9]) {
    const hinge = x === 8 ? "left" : "right";
    put(x, 5, 1, "dark_oak_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
    put(x, 6, 1, "dark_oak_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
  }
  for (let x = 7; x <= 10; x++) put(x, 7, 1, "stone_bricks");
  for (const x of [7, 10]) put(x, 6, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// roof plant room on the four-storey roof, centred over the interior
for (const c of F.values()) {
  if (c.tier === 4 && !faces(c).length && c.x >= 21 && c.x <= 26 && c.z >= 14 && c.z <= 18) {
    put(c.x, 20, c.z, "light_gray_concrete");
    put(c.x, 21, c.z, "smooth_stone");
  }
}

const out = `${DIR}/way_162091785.nbt`;
const res = g.save(out);
console.log(`way_162091785: ${res.blocks} blocks, ${res.palette} palette entries, ${lamps} lamps behind glass -> ${out}`);
