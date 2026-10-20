import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001324";

// 1819 Federal-era brick commercial/residential building, South Street Seaport.
// Stone plinth and cornice, red brick walls with a single stone sill band per storey,
// shopfront at street level, one street door, narrow window bays, a few lit windows.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 5, H = 25, D = 17;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const [x, z, ground, roof] of cells) {
  cellMap.set(`${x},${z}`, {
    x, z,
    ground: Math.max(0, Math.round(ground)),
    roof: Math.min(H, Math.round(roof)),
  });
}

const has = (x, z) => cellMap.has(`${x},${z}`);

function exposedFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

const uOf = (face, x, z) => (face === "north" || face === "south" ? x : z);

// main street face = the exposed side with the most cells; door at its middle
const faceU = { north: [], south: [], west: [], east: [] };
for (const c of cellMap.values()) {
  for (const f of exposedFaces(c.x, c.z)) faceU[f].push(uOf(f, c.x, c.z));
}
let doorFace = "south";
for (const f of ["north", "south", "west", "east"]) {
  if (faceU[f].length > faceU[doorFace].length) doorFace = f;
}
const doorList = faceU[doorFace].slice().sort((a, b) => a - b);
const doorU = doorList.length ? doorList[Math.floor(doorList.length / 2)] : -1;

// facade block for a perimeter cell at storey height rel above its own ground
function facadeBlock(face, x, z, rel) {
  const u = uOf(face, x, z);
  const isDoor = face === doorFace && u === doorU;

  if (rel === 0) return { id: "stone_bricks" };                 // plinth course

  if (rel < 4) {                                                // shopfront storey
    if (isDoor && (rel === 1 || rel === 2)) return { door: true, face, rel };
    if (isDoor && rel === 3) return { id: "stone_bricks" };     // door lintel
    if (u % 3 === 0) return { id: "stone_bricks" };             // stone piers
    if (u % 3 === 2) return { id: "bricks" };                   // brick between glazing
    return { id: "glass" };                                     // shop glazing
  }

  if (rel === 4) return { id: "smooth_stone" };                 // shop-top stone band

  const r = (rel - 4) % 3;                                      // upper storeys, 3-block pitch
  if (r === 0) return { id: "smooth_stone" };                   // stone sill / lintel band
  if (u % 3 === 1) {                                            // narrow window bay
    if (r === 1 && (rel + u) % 9 === 1) return { id: "glowstone" }; // occasional lit window
    return { id: "glass" };
  }
  return { id: "bricks" };                                      // brick wall
}

// 1. Foundations, walls, floors, cornice
for (const c of cellMap.values()) {
  const { x, z, ground, roof } = c;

  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const top = Math.max(roof, ground + 1) - 1;                   // cornice / roof deck
  const ex = exposedFaces(x, z);
  const perimeter = ex.length > 0;

  for (let y = ground; y <= top; y++) {
    const rel = y - ground;

    if (y === top) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (!perimeter) {
      // interior: floor slabs only, air otherwise
      if (rel === 0 || (rel >= 4 && (rel - 4) % 3 === 0)) {
        g.set(x, y, z, "oak_planks");
      }
      continue;
    }

    const face = ex.includes(doorFace) ? doorFace : ex[0];
    const b = facadeBlock(face, x, z, rel);

    if (b.door) {
      g.set(x, y, z, "oak_door", {
        facing: b.face,
        half: b.rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else {
      g.set(x, y, z, b.id);
    }
  }
}

// 2. Save
g.save(`${DIR}/${ID}.nbt`);
