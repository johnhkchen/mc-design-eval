import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001268";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 13, H = 40, D = 14;
const g = new Voxels([W, H, D]);

// ---- helpers --------------------------------------------------------------
const key = (x, z) => x + "," + z;
const cellMap = new Map();
for (const c of cells) cellMap.set(key(c[0], c[1]), { x: c[0], z: c[1], gr: c[2], rf: c[3] });
const has = (x, z) => cellMap.has(key(x, z));

function S(x, y, z, b, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// exterior faces of a footprint cell (N = -z side, S = +z, W = -x, E = +x)
function exteriorFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}
const uOf = (face, x, z) => (face === "N" || face === "S" ? x : z);
const inwardOf = (face, x, z) =>
  face === "N" ? [x, z + 1] : face === "S" ? [x, z - 1] : face === "W" ? [x + 1, z] : [x - 1, z];

// ---- massing: smooth lidar roof heights into tiers ------------------------
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
const top0 = Math.min(30, Math.round(median / 2) * 2); // main roof, even height
const topOf = (rf) => (rf < top0 - 3 ? Math.max(4, Math.round(rf / 2) * 2) : top0);

// ---- entrance: on the north (-z) face, near the middle of its run ---------
const northXs = cells.filter((c) => !has(c[0], c[1] - 1)).map((c) => c[0]).sort((a, b) => a - b);
let entX = null, entZ = null;
if (northXs.length) {
  entX = northXs[Math.floor(northXs.length / 2)];
  entZ = Math.min(...cells.filter((c) => c[0] === entX).map((c) => c[1]));
  if (has(entX, entZ - 1)) entX = null;
}
const isEntrance = (x, z) => entX !== null && x === entX && z === entZ;

const lights = [];

// ---- build each footprint cell --------------------------------------------
for (const c of cells) {
  const x = c[0], z = c[1], gr = c[2];
  const t = topOf(c[3]);
  const faces = exteriorFaces(x, z);
  const perim = faces.length > 0;
  const isCorner = faces.length > 1;

  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  for (let y = gr; y < t; y++) {
    const r = y - gr;

    if (!perim) {
      // interior: floor slabs and roof deck only, no rooms
      if (y === t - 1 || r === 0 || (r % 2 === 0)) S(x, y, z, "stone");
      continue;
    }

    if (y === t - 1) { S(x, y, z, "stone_bricks"); continue; } // cornice band
    if (r === 0) { S(x, y, z, "stone_bricks"); continue; }     // base course

    if (isEntrance(x, z)) {
      if (r === 1) { S(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (r === 2) { S(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (r === 3) { S(x, y, z, "black_concrete"); continue; } // hood over the entrance
    }

    if (r % 2 === 0) { S(x, y, z, "bricks"); continue; } // spandrel / floor line

    // window row
    const f = faces[0];
    const u = uOf(f, x, z);
    if (isCorner || u % 3 === 0) { S(x, y, z, "bricks"); continue; } // piers and corners

    if (r === 1) {
      S(x, y, z, "tinted_glass"); // dark shopfront glazing on the ground storey
    } else {
      S(x, y, z, "glass");
      if (u % 6 === 1) {
        const [ix, iz] = inwardOf(f, x, z);
        if (has(ix, iz) && exteriorFaces(ix, iz).length === 0) lights.push([ix, y, iz]);
      }
    }
  }

  // stone coping on the perimeter
  if (perim) {
    S(x, t, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- elevator bulkhead on the main roof, centred -------------------------
const midX = Math.floor(W / 2), midZ = Math.floor(D / 2);
for (const c of cells) {
  const x = c[0], z = c[1];
  if (topOf(c[3]) !== top0) continue;
  if (exteriorFaces(x, z).length) continue;
  if (Math.abs(x - midX) <= 1 && Math.abs(z - midZ) <= 2 && top0 + 3 < H) {
    for (let y = top0; y < top0 + 3; y++) S(x, y, z, "bricks");
    S(x, top0 + 3, z, "stone_bricks");
  }
}

// ---- warm lights behind some windows (only in open air cells) -------------
for (const [x, y, z] of lights) {
  const c = cellMap.get(key(x, z));
  if (!c) continue;
  const t = topOf(c.rf);
  if (y < t - 1) S(x, y, z, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
