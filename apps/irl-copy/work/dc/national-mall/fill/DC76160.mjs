// 1415 Rhode Island Ave NW: a 1920s red-brick apartment block with limestone trim, five storeys on a stone plinth,
// a stepped crown over the centre bay and lower wings at the back. Built from the lidar roof tiers, one solid column per
// footprint cell from y 0 up to its tier, so every storey stands on the one below. Interiors are air behind the glass
// with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC76160.cells.json", "utf8"));

// lidar roof -> clean flat tier: the 13 centre bay crowns the 11-12 body; the wings step down to 8, 5 and a 1-block terrace
const tierOf = (r) => (r >= 13 ? 13 : r >= 11 ? 12 : r >= 7 ? 8 : r >= 5 ? 5 : 1);

const top = new Map(), ground = new Map();
for (const [x, z, g0, roof] of cells) { top.set(`${x},${z}`, tierOf(roof)); ground.set(`${x},${z}`, g0); }
const has = (x, z) => top.has(`${x},${z}`);
const topAt = (x, z) => top.get(`${x},${z}`) ?? 0;

// faces of cell (x,z) at height y that are outside the footprint (out) or against a lower tier (step)
const exposed = (x, z, y) => {
  const faces = [];
  for (const [dx, dz, f] of [[0, -1, "N"], [0, 1, "S"], [-1, 0, "W"], [1, 0, "E"]]) {
    if (!has(x + dx, z + dz)) faces.push({ f, out: true });
    else if (topAt(x + dx, z + dz) <= y) faces.push({ f, out: false });
  }
  return faces;
};

const H = 25;
const g = new Voxels([19, H, 16]);
const WIN = new Set([4, 5, 7, 8, 10]), STR = new Set([3, 6, 9]);
const panes = [], lights = [];
const ENTRANCE = { x: 3, z: 0, f: "N" };   // the street door on the north face

for (const [key, T] of top) {
  const [x, z] = key.split(",").map(Number), g0 = ground.get(key);
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone");              // foundation to the ground (none here: all 0)
  for (let y = g0; y < g0 + T; y++) {
    const k = y - g0, faces = exposed(x, z, y), inner = faces.length === 0;
    const cap = k === T - 1;
    if (inner) {
      // floor slabs, base and roof stay solid; everything else is air behind the glass
      if (k === 0 || k === T - 1 || STR.has(k)) g.set(x, y, z, "stone");
      continue;
    }
    const face = faces.find((f) => f.out) ?? faces[0], out = face.out;
    const j = face.f === "N" || face.f === "S" ? x : z;    // position along the wall
    const pier = j % 3 === 0;
    // the entrance: stoop in the plinth, door in the ground storey, pier either side
    if (x === ENTRANCE.x && z === ENTRANCE.z && face.f === ENTRANCE.f) {
      if (k === 0) { g.set(x, y, z, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" }); continue; }
      if (k === 1 || k === 2) {
        g.set(x, y, z, "oak_door", { facing: "north", half: k === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
    }
    if (T === 1) { g.set(x, y, z, "stone_bricks"); continue; }
    if (k === 0) { g.set(x, y, z, "stone_bricks"); continue; }             // plinth
    if (cap) { g.set(x, y, z, "calcite"); continue; }                     // cornice / coping
    if (k <= 2) {                                                         // ground storey: shopfront glass
      if (!out || pier) g.set(x, y, z, pier ? "calcite" : "bricks"); else { g.set(x, y, z, "glass_pane"); panes.push([x, y, z]); }
      continue;
    }
    if (STR.has(k)) { g.set(x, y, z, "calcite"); continue; }              // storey lines
    if (WIN.has(k)) {                                                     // upper windows, brick piers
      if (out && !pier) { g.set(x, y, z, "glass_pane"); panes.push([x, y, z]); }
      else g.set(x, y, z, "bricks");
      continue;
    }
    g.set(x, y, z, "bricks");                                             // parapet
  }
}

// warm light: the room behind some windows is lit (glowstone one cell in), and a lantern in the entrance hall
for (const [x, y, z] of panes) {
  const face = [[0, -1], [0, 1], [-1, 0], [1, 0]].find(([dx, dz]) => !has(x + dx, z + dz));
  if (!face) continue;
  const ix = x - face[0], iz = z - face[1];                             // the cell inward, toward the building
  if (!has(ix, iz) || g.val(ix, y, iz) || exposed(ix, iz, y).length) continue;
  if ((x * 7 + z * 13 + y * 5) % 6 === 0) lights.push([ix, y, iz]);
}
for (const [x, y, z] of lights) g.set(x, y, z, "glowstone");
g.set(3, 1, 1, "lantern", { hanging: "false", waterlogged: "false" });

// roof plant: a few air-conditioning boxes on the main roof, standing on the roof slab
for (const [key, T] of top) {
  const [x, z] = key.split(",").map(Number);
  if (T === 12 && x >= 9 && x <= 12 && z >= 5 && z <= 6 && exposed(x, z, T - 1).length === 0) g.set(x, T, z, "smooth_stone");
}

// glass panes join their neighbours (panes and walls) across the wall line
for (const [x, y, z] of panes) {
  const c = (dx, dz) => (g.val(x + dx, y, z + dz) ? "true" : "false");
  g.set(x, y, z, "glass_pane", { north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false" });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC76160.nbt");
console.log("DC76160.nbt written", g.count(), "blocks");
