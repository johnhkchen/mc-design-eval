import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi mid-rise, c. 1980s: two commercial storeys over a stone base, white
// concrete piers and tinted glazing, red fascia sign band, flat parapet roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458000";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 14, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = new Set(cells.map(([x, z]) => key(x, z)));
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));

// Lowest ground under the footprint is the datum B; storey lines sit at
// B, B+5, B+10 (parapet row), and the roof surface is at B+11.
const B = Math.min(...cells.map((c) => c[2]));

function facesOf(x, z) {
  const f = [];
  if (!has.has(key(x - 1, z))) f.push("W");
  if (!has.has(key(x + 1, z))) f.push("E");
  if (!has.has(key(x, z - 1))) f.push("N");
  if (!has.has(key(x, z + 1))) f.push("S");
  return f;
}

function faceIndex(face, x, z) {
  return face === "W" || face === "E" ? z - minZ : x - minX;
}

function faceLen(face) {
  return face === "W" || face === "E" ? maxZ - minZ + 1 : maxX - minX + 1;
}

// Main (street) face is south; entrance is the middle two cells of it.
const LS = faceLen("S");
const e0 = Math.floor(LS / 2) - 1;
const e1 = Math.floor(LS / 2);

function paneProps(face) {
  const runZ = face === "W" || face === "E";
  return {
    north: runZ ? "true" : "false",
    south: runZ ? "true" : "false",
    east: runZ ? "false" : "true",
    west: runZ ? "false" : "true",
    waterlogged: "false",
  };
}

function isPier(face, x, z) {
  const i = faceIndex(face, x, z);
  const L = faceLen(face);
  return i === 0 || i === L - 1 || i % 3 === 0;
}

function isEntrance(face, x, z) {
  return face === "S" && (faceIndex(face, x, z) === e0 || faceIndex(face, x, z) === e1);
}

// Facade block for a single exposed face at offset o above the datum B.
function facadeBlock(face, x, z, o) {
  const pier = isPier(face, x, z);
  const ent = isEntrance(face, x, z);
  if (o === 0) return ["stone_bricks"];                 // base course
  if (o <= 3) {                                         // ground-floor shopfront
    if (ent) {
      if (o === 1) return ["oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (o === 2) return ["oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
      return ["glass"];                                 // transom
    }
    return pier ? ["white_concrete"] : ["glass"];
  }
  if (o === 4) {                                        // fascia / sign band
    return ent
      ? ["smooth_stone_slab", { type: "top", waterlogged: "false" }]
      : ["red_concrete"];
  }
  if (o === 5) return ["light_gray_concrete"];          // floor line
  if (o <= 8) {                                         // upper-storey windows
    return pier ? ["white_concrete"] : ["light_blue_stained_glass_pane", paneProps(face)];
  }
  if (o === 9) return ["smooth_stone"];                 // cornice course
  if (o === 10) return ["white_concrete"];              // parapet
  return null;
}

for (const [x, z, gc] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gc && y < H; y++) g.set(x, y, z, "stone_bricks");

  const faces = facesOf(x, z);

  for (let y = Math.max(gc, 0); y <= B + 10 && y < H; y++) {
    const o = y - B;
    let spec = null;

    // Floor slabs and roof deck on every cell (interior is solid slab only).
    if (o === 0 || o === 5 || o === 10) spec = ["light_gray_concrete"];

    if (faces.length) {
      if (faces.length > 1) {
        // Corner column: white pier through the full height.
        if (o === 0) spec = ["stone_bricks"];
        else if (o !== 5) spec = ["white_concrete"];
      } else {
        spec = facadeBlock(faces[0], x, z, o);
      }
    }

    if (spec) g.set(x, y, z, spec[0], spec[1]);
  }

  // Roof plant on the interior roof deck.
  if (!faces.length && gc <= B + 10 && B + 11 < H && (x * 3 + z * 5) % 19 === 0) {
    g.set(x, B + 11, z, "iron_block");
  }
}

// Warm light behind selected upper-storey windows (inside, air gap kept).
for (const [x, z, gc] of cells) {
  const faces = facesOf(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  if (isPier(face, x, z) || isEntrance(face, x, z)) continue;
  const i = faceIndex(face, x, z);
  if (i % 6 !== 2) continue;

  let ix = x, iz = z;
  if (face === "W") ix = x + 1;
  else if (face === "E") ix = x - 1;
  else if (face === "N") iz = z + 1;
  else iz = z - 1;

  if (!has.has(key(ix, iz))) continue;
  const y = B + 7;
  const innerGround = cells.find(([cx, cz]) => cx === ix && cz === iz)[2];
  if (y < innerGround || y >= H) continue;
  g.set(ix, y, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
