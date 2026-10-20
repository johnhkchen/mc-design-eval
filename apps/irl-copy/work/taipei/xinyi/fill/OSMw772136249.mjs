import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772136249";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());

// Absolute storey lines (lowest ground = minG). Roof about 11 above minG.
const T = minG + 10;        // cornice / roof deck
const F2 = minG + 5;        // storey-2 floor line
const LINTEL1 = minG + 4;   // storey-1 head band (red signboard on the street front)
const LINTEL2 = minG + 9;   // storey-2 head band

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Exterior faces of a footprint cell (neighbour missing), in priority order
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};

const pane = (face) =>
  (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Block for an exterior wall voxel. Returns {b, p?} or null.
function faceBlock(y, gr, along, face) {
  const pier = along % 3 === 0;
  if (y < gr) return null;
  if (y === gr) return { b: "stone_bricks" };                 // plinth / base course
  if (y === T) return { b: "light_gray_concrete" };           // cornice belt
  if (y === LINTEL1) return { b: face === "north" ? "red_terracotta" : "smooth_quartz" };
  if (y === F2) return { b: "light_gray_concrete" };          // storey line / sill
  if (y === LINTEL2) return { b: "smooth_quartz" };

  const win1 = y >= minG + 1 && y <= minG + 3 && y > gr;
  const win2 = y >= F2 + 1 && y <= F2 + 3;
  const shop = face === "north";

  if (win1) {
    if (shop) {
      if (along % 4 === 0) return { b: "white_concrete" };      // shopfront mullions
      return { b: "glass_pane", p: pane(face) };
    }
    if (pier) return { b: "smooth_quartz" };
    return { b: "gray_stained_glass_pane", p: pane(face) };
  }
  if (win2) {
    if (pier) return { b: "smooth_quartz" };
    const warm = y === F2 + 2 && along % 6 === 1;             // warm lights in some windows
    return warm ? { b: "sea_lantern" } : { b: "gray_stained_glass_pane", p: pane(face) };
  }
  return { b: "smooth_quartz" };
}

// 1. Foundations, floors, walls, cornice, parapet
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  if (fs.length === 0) {
    // Interior: floor slabs only, air above (no interiors)
    put(x, gr, z, "light_gray_concrete");
    if (F2 >= gr) put(x, F2, z, "light_gray_concrete");
    put(x, T, z, "light_gray_concrete");                       // roof deck
  } else {
    const face = fs[0];
    const along = (face === "north" || face === "south") ? x : z;
    for (let y = gr; y <= T; y++) {
      const r = faceBlock(y, gr, along, face);
      if (r) put(x, y, z, r.b, r.p);
    }
    put(x, T + 1, z, "smooth_quartz");                         // parapet
  }
}

// 2. Recessed entrance on the street (north) frontage
const northX = cells.filter(([x, z]) => faces(x, z).includes("north")).map(([x]) => x);
if (northX.length) {
  const dx = northX.reduce((a, b) => (Math.abs(b - 12) < Math.abs(a - 12) ? b : a));
  const gr = ground.get(`${dx},0`);
  put(dx, gr, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, gr + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Shop canopy line over the door
  if (has(dx - 1, 0)) put(dx - 1, minG + 4, 0, "red_terracotta");
  if (has(dx + 1, 0)) put(dx + 1, minG + 4, 0, "red_terracotta");
}

// 3. Roof equipment: two AC plant boxes and a lightning-rod mast
for (const [x, z] of cells) {
  if (faces(x, z).length) continue;
  if (x >= 5 && x <= 9 && z >= 5 && z <= 7) {
    put(x, T + 1, z, "light_gray_concrete");
    put(x, T + 2, z, "white_concrete");
  }
  if (x >= 16 && x <= 19 && z >= 11 && z <= 12) {
    put(x, T + 1, z, "light_gray_concrete");
  }
}
if (has(13, 8) && faces(13, 8).length === 0) {
  for (let y = T + 1; y <= T + 4; y++) {
    put(13, y, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
