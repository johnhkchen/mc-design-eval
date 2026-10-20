import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE98-0518-12F: 2009 Xinyi mid-rise office/residential tower, 12 storeys,
// roof about 64 blocks above lowest ground. Reinforced concrete frame with a
// pale stone base, white concrete piers, blue-tinted glass bays, quartz storey
// lines, a stepped parapet, a rooftop plant penthouse and a lit entrance.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE98-0518-12F";
const W = 15, H = 76, D = 20;

const ROOF = 61;   // roof deck / cornice row
const TOP = 63;    // top of parapet coping (roof reads ~64)
// Storey lines: ground storey 0..5, then 11 upper storeys of 5 blocks.
const SLABS = [6, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56];

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const c of cells) {
  const [x, z, gr] = c;
  ground.set(`${x},${z}`, Math.min(60, Math.max(0, Math.round(gr))));
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

const NB = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposedFaces = (x, z) =>
  Object.keys(NB).filter((f) => !inFp(x + NB[f][0], z + NB[f][1]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!inFp(x, z)) return; // build only on footprint cells
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pier (vertical mullion/pilaster) test for a perimeter column.
function isPier(x, z, faces) {
  if (faces.length > 1) return true; // corner pilaster
  const face = faces[0];
  if (face === "north" || face === "south") {
    return x % 3 === 0 || !inFp(x - 1, z) || !inFp(x + 1, z);
  }
  return z % 3 === 0 || !inFp(x, z - 1) || !inFp(x, z + 1);
}

// Facade block for a perimeter column at height y (y >= ground).
function facadeAt(x, z, y, gr, faces) {
  if (y === gr) return { id: "polished_granite" };             // base course
  if (y === ROOF) return { id: "smooth_quartz" };             // cornice
  if (y === ROOF + 1) return { id: "light_gray_concrete" };   // parapet
  if (y === TOP) return { id: "smooth_quartz_slab", props: { type: "top", waterlogged: "false" } }; // coping
  if (SLABS.includes(y)) return { id: "smooth_quartz" };      // storey line

  const S = y < 6 ? 0 : 6 + 5 * Math.floor((y - 6) / 5);
  const r = y - S;
  if (isPier(x, z, faces)) return { id: "white_concrete" };   // piers run full height
  if (r >= 4) return { id: "light_gray_concrete" };           // spandrel
  const t = faces[0] === "north" || faces[0] === "south" ? x : z;
  const id = (t * 3 + y) % 11 === 0 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
  return { id, props: paneProps(faces[0]) };
}

// ---- Pass 1: foundation, floor decks, roof deck, facades ----
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposedFaces(x, z);

  // foundation solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // floor decks across the whole footprint
  for (const y of [gr, ...SLABS]) {
    if (y >= gr && y < ROOF) put(x, y, z, "light_gray_concrete");
  }

  // roof deck
  put(x, ROOF, z, "gray_concrete");

  if (faces.length) {
    for (let y = gr; y <= TOP; y++) {
      const b = facadeAt(x, z, y, gr, faces);
      put(x, y, z, b.id, b.props);
    }
  }
}

// ---- Pass 2: entrance on the north face, glass doors, canopy and lamps ----
if (inFp(7, 0) && exposedFaces(7, 0).includes("north")) {
  const gd = groundAt(7, 0);
  // canopy band across the entrance bay
  for (let x = 5; x <= 9; x++) {
    if (inFp(x, 0) && exposedFaces(x, 0).includes("north")) {
      put(x, gd + 3, 0, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // door pair: iron door reads as a lobby entrance
  put(7, gd + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(7, gd + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // warm lanterns flanking the door, standing on the granite base course
  for (const x of [5, 9]) {
    if (inFp(x, 0) && gd + 1 < ROOF) put(x, gd + 1, 0, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// ---- Pass 3: warm lights in the air gap behind some glass bays ----
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposedFaces(x, z);
  if (faces.length !== 1) continue;
  const f = faces[0];
  const t = f === "north" || f === "south" ? x : z;
  if (isPier(x, z, faces)) continue; // glass bays only
  const ix = x - NB[f][0], iz = z - NB[f][1]; // inward column
  if (!inFp(ix, iz) || exposedFaces(ix, iz).length) continue;

  for (const S of [0, ...SLABS]) {
    const y = S + 2;
    if (y < groundAt(x, z) + 1 || y >= ROOF) continue;
    if ((t * 5 + y * 3 + S) % 4 !== 0) continue;
    put(ix, y, iz, (t + y) % 2 ? "shroomlight" : "glowstone");
  }
}

// ---- Pass 4: roof plant penthouse, setback cornice, cooling boxes, mast ----
for (let x = 4; x <= 10; x++) {
  for (let z = 6; z <= 13; z++) {
    if (!inFp(x, z)) continue;
    const edge = x === 4 || x === 10 || z === 6 || z === 13;
    if (edge) {
      for (let y = ROOF + 1; y <= 65; y++) {
        if ((y === 63 || y === 64) && (x + z) % 2 === 1) put(x, y, z, "light_blue_stained_glass");
        else put(x, y, z, "light_gray_concrete");
      }
    }
    put(x, 66, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    put(x, 67, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}
// rooftop cooling boxes, kept clear of the penthouse
for (let x = 1; x <= 2; x++) {
  for (let z = 2; z <= 3; z++) {
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
  }
}
// lightning mast on the penthouse roof (sits on the slab at y 67)
for (let y = 68; y <= 70; y++) put(7, y, 9, "lightning_rod");

g.save(`${DIR}/${ID}.nbt`);
