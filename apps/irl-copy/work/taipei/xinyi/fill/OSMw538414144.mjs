import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 20 x 17 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey 1980s Taipei commercial block: white-tiled concrete
// frame, grey storey lines, shopfront at street level, flat roof with a
// small stair/lift penthouse and rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414144";
const W = 20, H = 23, D = 17;
const ROOF = 10;      // roof slab level (interior)
const PARAPET = 11;   // top of parapet on the perimeter
const MAXG = 9;       // keep foundations below the roof line

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const minG = Math.min(...list.map((c) => c[2]));
const fp = new Map();
for (const c of list) {
  const g = Math.max(0, Math.min(MAXG, c[2] - minG));
  fp.set(`${c[0]},${c[1]}`, g);
}

const g_ = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g_.set(x, y, z, id, props);
  else g_.set(x, y, z, id);
};

const has = (x, z) => fp.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const exposed = (x, z) =>
  Object.keys(DIRS).filter((d) => !has(x + DIRS[d][0], z + DIRS[d][1]));

// Centre of the footprint
let sx = 0, sz = 0;
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  sx += x; sz += z;
}
const cx = Math.round(sx / fp.size);
const cz = Math.round(sz / fp.size);

// ---- Main body -------------------------------------------------------------
for (const [key, g] of fp) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  const exp = exposed(x, z);

  if (exp.length === 0) {
    // Interior: floor slabs and roof slab, air between
    put(x, g, z, "smooth_stone");
    if (g <= 5) put(x, 5, z, "smooth_stone");
    put(x, ROOF, z, "gray_concrete");
    continue;
  }

  const corner = exp.length >= 2;
  const alongX = exp.includes("N") || exp.includes("S");
  const t = alongX ? x : z;
  const win = !corner && t % 3 === 1;
  const glassProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };

  for (let y = g; y <= PARAPET; y++) {
    if (y === g) { put(x, y, z, "stone_bricks"); continue; }
    if (corner) { put(x, y, z, "light_gray_concrete"); continue; }

    if (y <= 4) {
      // Ground storey: shopfront glazing between stone piers, grey header
      if (y === 4) put(x, y, z, "light_gray_concrete");
      else if (win) put(x, y, z, "glass_pane", glassProps);
      else put(x, y, z, "stone_bricks");
    } else if (y === 5 || y === 10) {
      // Storey line and cornice
      put(x, y, z, "light_gray_concrete");
    } else if (y >= 6 && y <= 9) {
      // Upper storey: window grid of panes between white tile piers
      if (win) put(x, y, z, "glass_pane", glassProps);
      else put(x, y, z, "white_concrete");
    } else if (y === PARAPET) {
      put(x, y, z, "white_concrete");
    }
  }

  // Warm lights in some windows, placed in the air cell just inside the glass
  if (win) {
    const inward = [-DIRS[exp[0]][0], -DIRS[exp[0]][1]];
    const ix = x + inward[0], iz = z + inward[1];
    if (has(ix, iz) && exposed(ix, iz).length === 0) {
      if (t % 6 === 1) put(ix, 6, iz, "lantern");
      if (t % 6 === 4 && g + 1 <= 3) put(ix, g + 1, iz, "lantern");
    }
  }
}

// ---- Entrance on the south (street-facing) side ----------------------------
let doorCell = null;
for (const [key, g] of fp) {
  const [x, z] = key.split(",").map(Number);
  const exp = exposed(x, z);
  if (exp.length !== 1 || exp[0] !== "S") continue;
  if (!doorCell || Math.abs(x - cx) < Math.abs(doorCell.x - cx)) {
    doorCell = { x, z, g };
  }
}
if (doorCell) {
  const { x, z, g } = doorCell;
  put(x, g + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, g + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, g + 3, z, "light_gray_concrete");
  // Small canopy over the entrance, inside the footprint at the header
  put(x - 1, g + 3, z, "stone_brick_slab", { type: "bottom" });
  put(x + 1, g + 3, z, "stone_brick_slab", { type: "bottom" });
}

// ---- Rooftop penthouse (stair and lift core) -------------------------------
const px0 = cx - 3, px1 = cx + 3, pz0 = cz - 2, pz1 = cz + 2;
let penthouseOk = true;
for (let x = px0; x <= px1; x++) for (let z = pz0; z <= pz1; z++) {
  if (!has(x, z)) penthouseOk = false;
  for (const d of Object.keys(DIRS)) {
    if (!has(x + DIRS[d][0], z + DIRS[d][1])) penthouseOk = false;
  }
}
if (penthouseOk) {
  for (let x = px0; x <= px1; x++) for (let z = pz0; z <= pz1; z++) {
    const onX = x === px0 || x === px1;
    const onZ = z === pz0 || z === pz1;
    const border = onX || onZ;
    const corner = onX && onZ;
    const alongX = onZ && !onX; // north/south face of the box
    const t = alongX ? x : z;
    const pProps = alongX
      ? { north: "false", south: "false", east: "true", west: "true" }
      : { north: "true", south: "true", east: "false", west: "false" };
    if (border) {
      put(x, 11, z, "light_gray_concrete");
      for (let y = 12; y <= 13; y++) {
        if (corner) put(x, y, z, "light_gray_concrete");
        else if (t % 2 === 0) put(x, y, z, "glass_pane", pProps);
        else put(x, y, z, "white_concrete");
      }
    }
    put(x, 14, z, "stone_brick_slab", { type: "bottom" });
  }
  put(cx, 15, cz, "lightning_rod");
}

// ---- Rooftop plant (AC units) on the main roof -----------------------------
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (exposed(x, z).length !== 0) continue;
  const inPent = penthouseOk && x >= px0 && x <= px1 && z >= pz0 && z <= pz1;
  if (inPent) continue;
  if ((x * 3 + z * 5) % 11 === 0) put(x, 11, z, "iron_block");
}

g_.save(`${DIR}/${ID}.nbt`);
