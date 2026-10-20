// OSMw539950877: unnamed mid-rise commercial block, Xinyi, Taipei.
// Read as a late-1980s/1990s Taiwanese office-over-shops block: two storeys of
// white tiled concrete, grey-tinted glass, quartz mullions, a stone-brick plinth
// with shopfronts on the ground floor, a light-grey storey line each 5 blocks,
// a parapet cap and a small central plant room with a lantern.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw539950877";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 13;
const key = (x, z) => `${x},${z}`;

// footprint lookup and highest ground
const ground = new Map();
let maxG = 0;
for (const [x, z, g] of cells) {
  ground.set(key(x, z), g);
  if (g > maxG) maxG = g;
}
const inside = (x, z) => ground.has(key(x, z));

// body floor level sits on top of the highest foundation
const F = maxG + 1;      // first body block
const TOP = F + 10;      // parapet cap level (two storeys of 5 blocks)

const FACES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, z) =>
  Object.keys(FACES).filter((f) => {
    const [dx, dz] = FACES[f];
    return !inside(x + dx, z + dz);
  });
const along = (x, z, face) => (face === "north" || face === "south" ? x : z);

// entrance: the face with the most single-face wall cells, door at its middle cell
const faceCount = {};
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (ex.length === 1) faceCount[ex[0]] = (faceCount[ex[0]] || 0) + 1;
}
let doorFace = "south", best = -1;
for (const f of Object.keys(FACES)) {
  if ((faceCount[f] || 0) > best) { best = faceCount[f] || 0; doorFace = f; }
}
const doorCands = cells
  .filter(([x, z]) => {
    const ex = exposed(x, z);
    return ex.length === 1 && ex[0] === doorFace;
  })
  .sort((a, b) => along(a[0], a[1], doorFace) - along(b[0], b[1], doorFace));
const doorCell = doorCands.length ? doorCands[Math.floor(doorCands.length / 2)] : null;
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

const g = new Voxels([W, H, D]);
const SET = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// 1. foundations: solid from y 0 up to each cell's ground, then podium to F-1
for (const [x, z] of cells) {
  for (let y = 0; y < F; y++) SET(x, y, z, "stone_bricks");
}

// 2. interior floor slabs and roof slab
for (const [x, z] of cells) {
  if (exposed(x, z).length > 0) continue;
  SET(x, F, z, "smooth_stone");           // ground floor deck
  SET(x, F + 5, z, "smooth_stone");       // first floor deck
  SET(x, TOP, z, "light_gray_concrete");  // roof deck
}

// 3. walls, windows, storey lines, parapet, door
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (ex.length === 0) continue;
  const corner = ex.length >= 2;
  const face = ex[0];
  const u = corner ? 0 : along(x, z, face);
  const mullion = corner || u % 3 === 0;
  const isDoor = key(x, z) === doorKey;

  for (let y = F; y <= TOP; y++) {
    if (y === TOP) { SET(x, y, z, "light_gray_concrete"); continue; } // parapet cap
    const s = Math.floor((y - F) / 5);
    const r = (y - F) % 5;

    if (isDoor && y <= F + 1) {
      const half = y === F ? "lower" : "upper";
      SET(x, y, z, "dark_oak_door", {
        facing: doorFace, half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isDoor && y === F + 2) { SET(x, y, z, "light_gray_concrete"); continue; } // lintel

    let id;
    if (corner) id = r === 4 ? "light_gray_concrete" : "smooth_quartz";
    else if (r === 4) id = "light_gray_concrete";           // storey line
    else if (s === 0 && r === 0) id = "stone_bricks";       // base course
    else if (r === 0) id = "white_concrete";                // spandrel
    else if (mullion) id = "smooth_quartz";
    else id = s === 0 ? "light_blue_stained_glass" : "gray_stained_glass";
    SET(x, y, z, id);

    // warm light behind some glass: glowstone on the interior cell inward
    const isGlass = id.endsWith("stained_glass");
    if (isGlass && !corner && r === 2 && (x * 3 + z * 5) % 4 === 0) {
      const [dx, dz] = FACES[face];
      const ix = x - dx, iz = z - dz;
      if (inside(ix, iz) && exposed(ix, iz).length === 0) {
        SET(ix, y, iz, "glowstone");
      }
    }
  }
}

// 4. rooftop plant room: 3x3 stone block on interior roof with a lantern on top
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
for (let dx = -1; dx <= 1; dx++) {
  for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (inside(x, z) && exposed(x, z).length === 0) {
      SET(x, TOP + 1, z, "stone_bricks");
    }
  }
}
if (inside(cx, cz) && exposed(cx, cz).length === 0) {
  SET(cx, TOP + 2, cz, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
