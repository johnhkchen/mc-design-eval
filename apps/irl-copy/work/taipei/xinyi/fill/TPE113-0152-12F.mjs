import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE113-0152-12F";
const W = 18, H = 33, D = 40;

// Record: built 2024, 18 x 40 footprint, roof ~21 above lowest ground.
// 4-storey 2024 Taipei mid-rise: white concrete frame, light-blue glass bands,
// shopfront with entrance on the north (street) face, quartz cornice,
// parapet and a rooftop plant room with lanterns for dusk.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, name, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};

const ROOF = 21;     // roof slab y
const PARAPET = 22;  // parapet course y
const SLABS = [1, 6, 11, 16, 21];

// Which exterior face (if any) a footprint cell sits on.
function face(x, z) {
  if (!inFp(x, z - 1)) return { f: "N", i: x };
  if (!inFp(x, z + 1)) return { f: "S", i: x };
  if (!inFp(x - 1, z)) return { f: "W", i: z };
  if (!inFp(x + 1, z)) return { f: "E", i: z };
  return null;
}

const paneProps = (f) =>
  f === "N" || f === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundation, floor slabs, facade, entrance, cornice and parapet.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const fc = face(x, z);

  for (let y = 0; y <= PARAPET; y++) {
    // Foundation: solid from y 0 up to this cell's ground.
    if (y <= gr) { put(x, y, z, "stone"); continue; }

    // Roof: cornice course on the perimeter, plain roof slab inside.
    if (y === ROOF) {
      put(x, y, z, fc ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }

    // Floor slabs span every cell (structure, no air gaps through floors).
    if (SLABS.includes(y)) { put(x, y, z, "light_gray_concrete"); continue; }

    if (y === PARAPET) { if (fc) put(x, y, z, "white_concrete"); continue; }

    // Storey band: slab at s, windows s+1..s+3, spandrel at s+4.
    const s = Math.floor((y - 1) / 5) * 5 + 1;
    const r = y - s;
    if (!fc) continue; // interior air behind the glass

    // Spandrel: light grey so the white mullions and blue glass read against it.
    if (r === 4) { put(x, y, z, "light_gray_concrete"); continue; }

    // Ground storey, street (north) face: shopfront with entrance.
    if (fc.f === "N" && s === 1) {
      if (x >= 7 && x <= 10) {
        if (r === 3) { put(x, y, z, "white_concrete"); continue; } // canopy lintel
        if (x === 8 && r === 1) {
          put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (x === 8 && r === 2) {
          put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (r === 1) { put(x, y, z, "polished_granite"); continue; }
        put(x, y, z, "light_blue_stained_glass");
        continue;
      }
      // Entrance jambs either side of the door opening.
      if (x === 6 || x === 11) {
        put(x, y, z, r === 1 ? "polished_granite" : "white_concrete");
        continue;
      }
      if (r === 1) { put(x, y, z, "polished_granite"); continue; }
      if (fc.i % 6 === 0) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }

    // Base course on the ground storey of other faces.
    if (s === 1 && r === 1) { put(x, y, z, "polished_granite"); continue; }

    // Window grid: concrete mullion every 3 cells, glass pane between.
    if (fc.i % 3 === 0) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", paneProps(fc.f));
  }
}

// Pass 2: warm light (glowstone) one cell behind a few windows on the second storey.
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  const fc = face(x, z);
  if (!fc || fc.i % 6 !== 3) continue;
  let ix = x, iz = z;
  if (fc.f === "N") iz = z + 1;
  else if (fc.f === "S") iz = z - 1;
  else if (fc.f === "W") ix = x + 1;
  else ix = x - 1;
  if (!inFp(ix, iz) || face(ix, iz)) continue;
  const y = 1 + 5 * 1 + 2; // second storey, mid window row
  if (y > gAt(ix, iz)) put(ix, y, iz, "glowstone");
}

// Rooftop plant room: setback box in the middle of the roof.
const [px0, px1, pz0, pz1] = [5, 12, 14, 25];
for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!inFp(x, z)) continue;
    const rim = x === px0 || x === px1 || z === pz0 || z === pz1;
    for (let y = PARAPET; y <= 24; y++) {
      if (rim) put(x, y, z, y === 23 ? "light_gray_concrete" : "white_concrete");
    }
    put(x, 25, z, "light_gray_concrete"); // plant room roof
  }
}
// Lanterns on the plant room roof corners for dusk.
for (const [x, z] of [[px0, pz0], [px1, pz1], [px0, pz1], [px1, pz0]]) {
  if (inFp(x, z)) put(x, 26, z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
