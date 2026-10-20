import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: unnamed 1980s-90s Xinyi commercial mid-rise, five storeys of 5 blocks.
// Roof about 26 above lowest ground. Facade: white tile-clad concrete with
// polished granite base, quartz cornice, light-blue glass bays, quartz mullions.
// Ground floor is a shopfront with a dark-oak entrance canopy. Some windows
// carry shroomlight behind the glass as warm dusk lamps.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167424";
const W = 11, H = 38, D = 17;

const STOREY = 5;
const NSTOREY = 5;
const DECK = STOREY * NSTOREY;     // 25: top slab of the fifth storey
const PARAPET = DECK + 1;          // 26: roof top sits here, about 26 above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const minG = Math.min(...cells.map((c) => c[2]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr - minG);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// exterior faces of each footprint cell
const ext = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isPerim = (x, z) => {
  const e = ext(x, z);
  return e.N || e.S || e.W || e.E;
};
const faceCount = (x, z) => {
  const e = ext(x, z);
  return [e.N, e.S, e.W, e.E].filter(Boolean).length;
};
const primaryFace = (x, z) => {
  const e = ext(x, z);
  if (e.N) return "N";
  if (e.S) return "S";
  if (e.W) return "W";
  return "E";
};

// Entrance: median cell of the north face (or south if no north face)
let entranceFace = "N";
let entranceCells = cells.filter(([x, z]) => ext(x, z).N);
if (entranceCells.length === 0) {
  entranceFace = "S";
  entranceCells = cells.filter(([x, z]) => ext(x, z).S);
}
if (entranceCells.length === 0) {
  entranceFace = "N";
  entranceCells = cells.filter(([x, z]) => isPerim(x, z));
}
entranceCells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
const ent = entranceCells[Math.floor(entranceCells.length / 2)] || [Math.floor(W / 2), 0, 0];
const [entX, entZ] = [ent[0], ent[1]];
const entIdx = entranceFace === "N" || entranceFace === "S" ? entX : entZ;
const entGround = gAt(entX, entZ);
const doorY = entGround;

// Build each footprint column
for (const [x, z] of cells) {
  const gc = gAt(x, z);
  const perim = isPerim(x, z);
  const nFaces = faceCount(x, z);
  const face = primaryFace(x, z);
  const idx = face === "N" || face === "S" ? x : z;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  // Storey walls and floor slabs, from ground up to the deck
  for (let y = gc; y < DECK; y++) {
    const s = Math.floor(y / STOREY);
    const r = y % STOREY;

    if (r === 0) {
      if (!perim) {
        put(x, y, z, "light_gray_concrete");
      } else if (s === 0) {
        put(x, y, z, "polished_granite");           // base course
      } else {
        put(x, y, z, "white_concrete");              // floor-line spandrel band
      }
      continue;
    }

    if (!perim) continue; // interior air behind glass

    if (r === 4) {
      // spandrel above each window band
      put(x, y, z, "white_concrete");
      continue;
    }

    // window band rows r = 1..3
    if (nFaces >= 2) {
      put(x, y, z, "quartz_pillar");                 // corner column
      continue;
    }

    const lit = ((x * 3 + z * 5 + s * 2 + y) % 7 === 0) && s >= 1;
    if (idx % 2 === 1) {
      put(x, y, z, "quartz_pillar");                 // mullion
    } else if (lit) {
      put(x, y, z, "shroomlight");                   // warm lamp behind glass
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }

  // Roof deck and parapet
  if (gc <= DECK) {
    if (perim) {
      put(x, DECK, z, "smooth_quartz");              // cornice
      put(x, PARAPET, z, "white_concrete");          // parapet
    } else {
      put(x, DECK, z, "light_gray_concrete");        // roof deck
    }
  }
}

// Rooftop plant room on the interior of the roof
for (const [x, z] of cells) {
  if (isPerim(x, z)) continue;
  if (x >= 3 && x <= 7 && z >= 5 && z <= 11 && gAt(x, z) <= DECK) {
    put(x, PARAPET, z, "iron_block");
  }
}

// Ground-floor entrance: door and dark oak canopy over the entrance bay
const dir = entranceFace === "N" ? "south" : "north";
for (const [x, z] of cells) {
  if (entranceFace === "N" && !ext(x, z).N) continue;
  if (entranceFace === "S" && !ext(x, z).S) continue;
  const idx = entranceFace === "N" || entranceFace === "S" ? x : z;
  if (Math.abs(idx - entIdx) <= 1) {
    const yCanopy = doorY + 4;
    put(x, yCanopy, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}
put(entX, doorY, entZ, "dark_oak_door", {
  facing: dir, half: "lower", hinge: "left", open: "false", powered: "false",
});
put(entX, doorY + 1, entZ, "dark_oak_door", {
  facing: dir, half: "upper", hinge: "left", open: "false", powered: "false",
});

g.save(`${DIR}/${ID}.nbt`);
