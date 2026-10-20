import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0345-7F";
const W = 13, H = 47, D = 13;
const TOP = 34;      // roof deck and cornice layer (roof about 35 above lowest ground)
const PARAPET = 35;  // quartz parapet cap on perimeter

// ---- footprint -----------------------------------------------------------
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const faces = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isPerim = (x, z) => {
  const f = faces(x, z);
  return f.N || f.S || f.W || f.E;
};

const vox = new Voxels([W, H, D]);

// ---- warm lights: glowstone inside, behind selected lit windows ---------
const lamps = new Set();
for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number);
  const f = faces(x, z);
  const corner = (f.N || f.S) && (f.W || f.E);
  if (!isPerim(x, z) || corner) continue;
  const t = (f.N || f.S) ? x : z;
  for (let y = 2; y <= 32; y += 5) {           // middle row of each storey window band
    if (y < g) continue;
    if (t % 3 === 0) continue;                  // mullion
    if (f.S && x >= 5 && x <= 7) continue;      // entrance bay
    if (((t + Math.floor(y / 5)) % 4) !== 1) continue;
    let ix = x, iz = z;
    if (f.N) iz = z + 1;
    else if (f.S) iz = z - 1;
    else if (f.W) ix = x + 1;
    else if (f.E) ix = x - 1;
    if (!has(ix, iz) || isPerim(ix, iz)) continue;
    if (y < gAt(ix, iz)) continue;
    lamps.add(`${ix},${y},${iz}`);
  }
}

// ---- perimeter facade block selection ------------------------------------
function perimBlock(x, z, y, g, f, corner) {
  // entrance on the south face, centred on x = 6
  if (f.S && z === 12 && x === 6 && (y === g || y === g + 1)) {
    return y === g
      ? ["dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }]
      : ["dark_oak_door", { half: "upper", hinge: "left", powered: "false" }];
  }
  if (f.S && z === 12 && x === 6 && y === g + 2) return ["light_gray_concrete"]; // lintel
  // entrance jambs flanking the door, so the doorway reads from the street
  if (f.S && z === 12 && (x === 5 || x === 7) && y >= g && y <= g + 2) return ["white_concrete"];
  if (y === g) return ["polished_granite"];   // base course
  if (y === PARAPET) return ["quartz_slab", { type: "top", waterlogged: "false" }];
  if (y > TOP) return null;
  if (y === TOP) return ["white_concrete"];   // cornice
  if (corner) return ["white_concrete"];      // corner piers
  const r = y % 5;
  if (r === 0) return ["white_concrete"];     // storey slab line
  if (r === 4) return ["light_gray_concrete"]; // spandrel
  // window band (r = 1..3)
  const t = (f.N || f.S) ? x : z;
  if (t % 3 === 0) return ["white_concrete"]; // mullion
  const along = (f.N || f.S)
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  return ["light_blue_stained_glass_pane", along];
}

// ---- build footprint -----------------------------------------------------
for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number);
  // foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < g && y < H; y++) vox.set(x, y, z, "polished_granite");

  const f = faces(x, z);
  const per = f.N || f.S || f.W || f.E;
  const corner = (f.N || f.S) && (f.W || f.E);

  for (let y = g; y <= TOP && y < H; y++) {
    if (per) {
      const b = perimBlock(x, z, y, g, f, corner);
      if (b) vox.set(x, y, z, b[0], b[1]);
    } else {
      if (y === TOP) vox.set(x, y, z, "light_gray_concrete");       // roof deck
      else if (y % 5 === 0 && y > 0) vox.set(x, y, z, "white_concrete"); // floor slab
      else if (lamps.has(`${x},${y},${z}`)) vox.set(x, y, z, "glowstone");
    }
  }
}

// ---- roof plant: central penthouse on the roof deck ---------------------
for (let x = 4; x <= 8; x++) {
  for (let z = 4; z <= 8; z++) {
    if (!has(x, z)) continue;
    const ring = x === 4 || x === 8 || z === 4 || z === 8;
    if (ring) {
      vox.set(x, 35, z, "light_gray_concrete");
      vox.set(x, 36, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      vox.set(x, 37, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      vox.set(x, 38, z, "light_gray_concrete");
    }
    vox.set(x, 39, z, "light_gray_concrete");   // penthouse roof
  }
}

// ---- antenna mast on the centre of the penthouse -------------------------
if (has(6, 6)) {
  for (let y = 40; y <= 44; y++) {
    vox.set(6, y, 6, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  }
  vox.set(6, 45, 6, "redstone_lamp", { lit: "true" });   // aviation light
  vox.set(6, 46, 6, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

vox.save(`${DIR}/${ID}.nbt`);
