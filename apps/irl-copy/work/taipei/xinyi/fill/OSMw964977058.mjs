import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source data. Read as a mid-1980s Taipei commercial block: two storeys over a
// shopfront ground floor, white tiled concrete walls, light-grey bands, a stone-slab cornice,
// a flat roof with air-conditioning plant and a parapet. Roof sits at about y=11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw964977058";
const W = 37, H = 23, D = 29;
const ROOF_BASE = 10;   // flat roof surface level for the building (≈11 above lowest ground)

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 8, Math.round(gr))));
}

const g = new Voxels([W, H, D]);
const S = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// outward normals and facing names
const NORMALS = [
  [1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"],
];
const exteriorFaces = (x, z) =>
  NORMALS.filter(([dx, dz]) => !ground.has(`${x + dx},${z + dz}`));

const cellsList = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr, faces: exteriorFaces(x, z) };
});

// Pass 1: foundation, walls, roofs, parapets
for (const { x, z, gr, faces } of cellsList) {
  const T = Math.max(ROOF_BASE, gr);            // roof surface row for this cell
  const edge = faces.length > 0;

  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");     // foundation to ground
  for (let y = gr; y < T; y++) S(x, y, z, "white_concrete");   // walls / floors

  if (edge) {
    S(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // cornice
    S(x, T + 1, z, "white_concrete");                                          // parapet
  } else {
    S(x, T, z, "gray_concrete");                                               // flat roof
  }
}

// Pass 2: facade articulation on exterior faces
for (const { x, z, gr, faces } of cellsList) {
  if (faces.length === 0) continue;
  const T = Math.max(ROOF_BASE, gr);
  for (const [dx] of faces) {
    const idx = dx !== 0 ? z : x;          // position along the face
    const rows = [];
    rows.push([gr, "light_gray_concrete"]);                                    // base course
    for (let y = gr + 1; y <= gr + 3 && y < T; y++) {                          // shopfront
      rows.push([y, idx % 4 === 0 ? "gray_concrete" : "light_blue_stained_glass_pane"]);
    }
    if (gr + 4 < T) rows.push([gr + 4, "gray_concrete"]);                      // fascia
    if (gr + 5 < T) rows.push([gr + 5, "light_gray_concrete"]);                // storey line
    for (let y = gr + 6; y < T; y++) {                                         // upper storey
      if (y === gr + 6 || y === T - 1) { rows.push([y, "light_gray_concrete"]); continue; }
      if (idx % 3 === 0) rows.push([y, "white_concrete"]);                     // mullion
      else if (y === gr + 7 && idx % 9 === 4) rows.push([y, "shroomlight"]);   // warm light
      else rows.push([y, "light_blue_stained_glass_pane"]);
    }
    for (const [y, b] of rows) S(x, y, z, b);
  }
}

// Pass 3: entrance on the south-facing (-z) frontage, nearest the middle of the face
let door = null;
for (const { x, z, gr, faces } of cellsList) {
  for (const [dx, dz, name] of faces) {
    if (dz !== -1 || dx !== 0) continue;
    const score = Math.abs(x - W / 2);
    if (!door || score < door.score) door = { x, z, gr, name, score };
  }
}
if (door) {
  S(door.x, door.gr + 1, door.z, "dark_oak_door",
    { facing: door.name, half: "lower", hinge: "left", open: "false", powered: "false" });
  S(door.x, door.gr + 2, door.z, "dark_oak_door",
    { facing: door.name, half: "upper", hinge: "left", open: "false", powered: "false" });
  S(door.x, door.gr + 3, door.z, "light_gray_concrete");   // door head
}

// Pass 4: roof plant and lanterns on interior roof cells
for (const { x, z, gr, faces } of cellsList) {
  if (faces.length > 0) continue;
  const T = Math.max(ROOF_BASE, gr);
  if (x % 6 === 2 && z % 6 === 2) {
    S(x, T + 1, z, "light_gray_concrete");
    S(x, T + 2, z, x % 12 === 2 ? "lantern" : "smooth_stone_slab", x % 12 === 2 ? { hanging: "false", waterlogged: "false" } : { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
