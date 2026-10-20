import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265979";
const W = 31, H = 33, D = 13;
const ROOF = 21;          // top of parapet cap, about 21 blocks above lowest ground
const MAX_GROUND = ROOF - 4;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.min(Math.max(gr, 0), MAX_GROUND));
const has = (x, z) => ground.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Face classification for perimeter cells
// face: "north" (z=0 edge), "south" (z=D-1), "west" (x=0), "east" (x=W-1)
function faceOf(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  return "east";
}
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };
const OUTWARD = { north: "north", south: "south", west: "west", east: "east" };

// Face extents, used to place the entrance at the middle of the south face
const faceRange = { south: [Infinity, -Infinity] };
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (!has(x, z + 1)) {
    faceRange.south[0] = Math.min(faceRange.south[0], x);
    faceRange.south[1] = Math.max(faceRange.south[1], x);
  }
}
const southMid = faceRange.south[0] === Infinity
  ? -1
  : Math.floor((faceRange.south[0] + faceRange.south[1]) / 2);

// Facade block for a wall cell at absolute height y, face index i
function facadeBlock(y, i, face, isEntrance) {
  if (y === ROOF) return ["quartz_slab", { type: "top" }];   // cornice cap
  if (y === ROOF - 1) return ["smooth_quartz", null];         // parapet
  const k = Math.floor(y / 5);
  const rel = y % 5;
  if (rel === 0) return [k === 0 ? "polished_andesite" : "smooth_quartz", null]; // base / spandrel
  if (rel === 4) return ["smooth_quartz", null];              // head band / lintel
  // rel 1..3: window band
  if (isEntrance) {
    if (y <= 2) return null;                                  // door handled separately
    return ["glass", null];                                   // transom
  }
  if (i % 4 === 0) return ["quartz_pillar", { axis: face === "north" || face === "south" ? "y" : "y" }];
  return ["light_blue_stained_glass", null];
}

// Foundations, interior slabs, and walls
for (const [x, z, gr] of cells) {
  const base = ground.get(`${x},${z}`);

  // foundation: fill solid from 0 up to this cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  const perimeter = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

  if (!perimeter) {
    // interior: floor slab at ground and at each storey line, air elsewhere
    put(x, base, z, "smooth_quartz");
    for (let y = 5; y <= ROOF - 1; y += 5) if (y >= base) put(x, y, z, "smooth_quartz");
    continue;
  }

  const face = faceOf(x, z);
  const [dx, dz] = INWARD[face];
  const along = face === "north" || face === "south" ? x : z;
  const isSouthEntrance = face === "south" && along === southMid;
  const interiorOk = has(x + dx, z + dz);

  for (let y = base; y <= ROOF; y++) {
    const isEntrance = isSouthEntrance && y <= 4;
    if (isEntrance && (y === 1 || y === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: OUTWARD[face],
        half: y === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    const b = facadeBlock(y, along, face, isEntrance);
    if (b) {
      if (b[1]) put(x, y, z, b[0], b[1]);
      else put(x, y, z, b[0]);
    }

    // warm lights behind some upper-floor windows (interior cell, behind glass)
    const k = Math.floor(y / 5);
    if (k >= 1 && k % 2 === 1 && y % 5 === 2 && along % 4 === 2 && interiorOk && !isEntrance && y < ROOF - 1) {
      put(x + dx, y, z + dz, "glowstone");
    }
  }
}

// Roof plant: small HVAC boxes on the roof deck, and a central mast
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  const perimeter = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (perimeter) continue;
  const base = ground.get(`${x},${z}`);
  if (x % 7 === 3 && z % 5 === 2 && base <= ROOF - 4) {
    put(x, ROOF, z, "light_gray_concrete");
    put(x, ROOF + 1, z, "light_gray_concrete");
  }
}
const mx = Math.floor(W / 2), mz = Math.floor(D / 2);
if (has(mx, mz) && !(!has(mx, mz - 1) || !has(mx, mz + 1) || !has(mx - 1, mz) || !has(mx + 1, mz))) {
  for (let y = ROOF; y <= ROOF + 4; y++) put(mx, y, mz, "lightning_rod", { facing: "up" });
}

g.save(`${DIR}/${ID}.nbt`);
