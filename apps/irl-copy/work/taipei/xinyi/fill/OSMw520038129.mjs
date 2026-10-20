import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s commercial block: two storeys on a stone plinth, pale quartz
// tile facade with tinted glass bands, a quartz parapet, and a rooftop plant
// house with lanterns. Lit glass at dusk; no interiors beyond an air gap.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw520038129";
const W = 27, H = 23, D = 52;
const ROOF = 10;          // roof slab layer
const PARAPET_LO = 11;    // parapet and plant start
const PLANT_ROOF = 13;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const gMin = Math.min(...list.map((c) => c[2]));
const gMaxRaw = Math.max(...list.map((c) => c[2])) - gMin;

const cells = list.map(([x, z, gr]) => ({
  x, z,
  g: Math.min(ROOF - 2, Math.max(0, gr - gMin)),
}));

const fp = new Map();
for (const c of cells) fp.set(`${c.x},${c.z}`, c);
const at = (x, z) => fp.get(`${x},${z}`);

const minX = Math.min(...cells.map((c) => c.x));
const maxX = Math.max(...cells.map((c) => c.x));
const minZ = Math.min(...cells.map((c) => c.z));
const maxZ = Math.max(...cells.map((c) => c.z));
const bw = maxX - minX + 1;

// Storey line: ground storey about 5 blocks, upper storey to the roof.
const FL = gMaxRaw <= 2 ? 5 : 6;
const kDoor = Math.floor(bw / 2) - 1;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Inward offsets for each exterior face.
const INW = { S: [0, -1], N: [0, 1], W: [1, 0], E: [-1, 0] };

function sideOf(c) {
  if (!at(c.x, c.z + 1)) return "S";
  if (!at(c.x, c.z - 1)) return "N";
  if (!at(c.x - 1, c.z)) return "W";
  if (!at(c.x + 1, c.z)) return "E";
  return null;
}

// Lit glass: a glowstone in the air gap just behind the pane.
function glowBehind(c, side, y, lit) {
  if (!lit) return;
  const [ix, iz] = INW[side];
  const inner = at(c.x + ix, c.z + iz);
  if (!inner || inner.g > y || y === FL) return;
  put(c.x + ix, y, c.z + iz, "glowstone");
}

// Foundations, floor slab, roof slab.
for (const c of cells) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");
  if (c.g <= FL) put(c.x, FL, c.z, "stone");
  const side = sideOf(c);
  put(c.x, ROOF, c.z, side ? "smooth_quartz" : "smooth_stone");
}

// Facades on exterior cells.
for (const c of cells) {
  const side = sideOf(c);
  if (!side) continue;
  const k = side === "S" || side === "N" ? c.x - minX : c.z - minZ;
  const door = side === "S" && (k === kDoor || k === kDoor + 1) && c.g + 3 <= FL - 1;
  const hinge = k === kDoor ? "left" : "right";

  for (let y = c.g; y <= ROOF - 1; y++) {
    if (y === c.g) {
      put(c.x, y, c.z, "polished_granite");
    } else if (y === FL - 1) {
      put(c.x, y, c.z, "smooth_quartz");
    } else if (y < FL - 1) {
      // Ground storey: shopfront glass with mullions, or entrance doors.
      if (door && y === c.g + 1) {
        put(c.x, y, c.z, "iron_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
      } else if (door && y === c.g + 2) {
        put(c.x, y, c.z, "iron_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
      } else if (door) {
        put(c.x, y, c.z, "smooth_quartz");
      } else if (k % 3 === 0) {
        put(c.x, y, c.z, "polished_andesite");
      } else {
        put(c.x, y, c.z, "cyan_stained_glass_pane");
        glowBehind(c, side, y, Math.floor(k / 3) % 2 === 0 && y === c.g + 2);
      }
    } else if (y === FL) {
      put(c.x, y, c.z, "smooth_quartz");
    } else if (y <= ROOF - 2) {
      // Upper storey windows with frames.
      if (k % 3 === 0) {
        put(c.x, y, c.z, "polished_andesite");
      } else {
        put(c.x, y, c.z, "cyan_stained_glass_pane");
        glowBehind(c, side, y, (Math.floor(k / 3) + y) % 3 === 0);
      }
    } else {
      // Cornice band under the roof slab.
      put(c.x, y, c.z, "quartz_slab", { type: "top", waterlogged: "false" });
    }
  }

  // Parapet.
  put(c.x, PARAPET_LO, c.z, "quartz_block");
  put(c.x, PARAPET_LO + 1, c.z, "quartz_block");
}

// Rooftop plant house, set well inside the footprint.
const px0 = minX + 5, px1 = maxX - 5;
const pz0 = minZ + 12, pz1 = pz0 + 8;
const inPlant = (x, z) => x >= px0 && x <= px1 && z >= pz0 && z <= pz1;
for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!at(x, z)) continue;
    const border = x === px0 || x === px1 || z === pz0 || z === pz1;
    for (let y = PARAPET_LO; y <= PLANT_ROOF - 1; y++) {
      const louvre = border && (x - px0 + z - pz0) % 3 === 0 && y === PARAPET_LO;
      put(x, y, z, louvre ? "iron_bars" : "light_gray_concrete");
    }
    put(x, PLANT_ROOF, z, "smooth_stone");
  }
}
for (const [x, z] of [[px0, pz0], [px1, pz0], [px0, pz1], [px1, pz1]]) {
  if (inPlant(x, z) && at(x, z)) {
    put(x, PLANT_ROOF + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Two small condenser units on the roof.
for (let x = minX + 3; x <= minX + 5; x++) {
  for (let z = minZ + 4; z <= minZ + 5; z++) {
    const c = at(x, z);
    if (!c || sideOf(c) || inPlant(x, z)) continue;
    put(x, PARAPET_LO, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
