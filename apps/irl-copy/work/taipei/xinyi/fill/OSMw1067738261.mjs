import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi office block, c. 1990s: white concrete wall with a light-grey
// floor line, blue-glass window bands with concrete mullions, a granite plinth,
// a glazed street entrance, and a set-back mechanical penthouse with a mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738261";
const W = 19, H = 33, D = 24;

const TOP = 20;        // top of the four 5-block storeys (roof deck)
const PARAPET = 21;    // parapet course on the perimeter
const PH_TOP = 26;     // penthouse roof
const MAST_TOP = 31;   // lightning-rod mast

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which outward face a perimeter cell sits on (null = interior).
function faceOf(x, z) {
  if (!has(x, z - 1)) return "n";
  if (!has(x, z + 1)) return "s";
  if (!has(x - 1, z)) return "w";
  if (!has(x + 1, z)) return "e";
  return null;
}

// Glass pane connection states: panes on an x-facing wall (n/s faces) join east/west.
function paneProps(face) {
  if (face === "n" || face === "s") {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

// Envelope material for a perimeter cell at height y (y >= its ground).
function wallAt(x, z, y, face) {
  if (y === PARAPET) return ["white_concrete"];
  if (y === TOP) return ["smooth_stone"];
  if (y === 0) return ["polished_granite"];
  const r = y % 5;
  if (r === 0) return ["light_gray_concrete"];   // floor line
  if (r === 4) return ["white_concrete"];        // spandrel
  // window band rows r = 1..3
  const i = face === "n" || face === "s" ? x : z;
  if (i % 3 === 0) return ["light_gray_concrete"]; // mullion
  return ["light_blue_stained_glass_pane", paneProps(face)];
}

// 1. Foundations, interior floors, and the perimeter envelope.
const perim = [];
for (const [x, z, gr] of cells) {
  const face = faceOf(x, z);
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (face) {
    perim.push({ x, z, gr, face });
    for (let y = Math.max(gr, 0); y <= PARAPET; y++) {
      // Street entrance on the north face, x 7..11, storey 1 only.
      if (face === "n" && x >= 7 && x <= 11 && y >= 1 && y <= 3) {
        if (y === 3) put(x, y, z, "light_gray_concrete");
        else if (x === 7 || x === 11) put(x, y, z, "light_gray_concrete");
        else if (x === 9 && y <= 2 && gr <= 1) {
          put(x, y, z, "dark_oak_door", doorProps(y === 1 ? "lower" : "upper"));
        } else put(x, y, z, "glass");
        continue;
      }
      const [id, props] = wallAt(x, z, y, face);
      put(x, y, z, id, props);
    }
  } else {
    // interior: floor slabs at each storey line and the roof deck
    put(x, 0, z, "stone_bricks");
    for (const y of [5, 10, 15, TOP]) {
      if (y >= gr) put(x, y, z, "light_gray_concrete");
    }
  }
}

// 2. Warm light behind some ground/upper windows (interior cell just inside the glass).
for (const { x, z, gr, face } of perim) {
  for (let k = 0; k < 4; k++) {
    const y = k * 5 + 2;
    if (y < gr) continue;
    if ((x * 5 + z * 3 + k * 7) % 6 !== 0) continue;
    if (face === "n" && (x >= 7 && x <= 11)) continue; // keep entrance clear
    let qx = x, qz = z;
    if (face === "n") qz = z + 1;
    else if (face === "s") qz = z - 1;
    else if (face === "w") qx = x + 1;
    else qx = x - 1;
    if (!has(qx, qz) || faceOf(qx, qz)) continue;
    put(qx, y, qz, "glowstone");
  }
}

// 3. Mechanical penthouse, set back from the parapet, with mast.
const PX0 = 4, PX1 = 14, PZ0 = 6, PZ1 = 17;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const ring = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    put(x, PARAPET, z, "light_gray_concrete");          // penthouse floor
    put(x, PH_TOP, z, "light_gray_concrete");           // penthouse roof
    if (ring) {
      put(x, 25, z, "light_gray_concrete");              // cornice
      const face = x === PX0 || x === PX1 ? "e" : "n";
      const along = face === "e" ? z : x;
      for (let y = 22; y <= 24; y++) {
        if (y === 23 && along % 3 === 0) {               // mullion
          put(x, y, z, "light_gray_concrete");
        } else if (along % 3 === 0) {
          put(x, y, z, "light_gray_concrete");
        } else {
          put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));
        }
      }
      put(x, 21, z, "light_gray_concrete");
    }
  }
}

// Mast on the penthouse roof.
for (let y = PH_TOP + 1; y <= MAST_TOP; y++) {
  put(11, y, 12, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// 4. Roof equipment on the main deck.
for (const [x, z] of [[2, 3], [2, 20], [16, 3], [16, 20]]) {
  if (has(x, z)) put(x, PARAPET, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
