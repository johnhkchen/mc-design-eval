import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC87503 — 811 Vermont Ave NW. Commercial office, mid-century (c. 1960s-70s)
// pale precast concrete with a glass curtain wall on a rusticated stone base,
// ~5 storeys of 4 blocks, roof massing smoothed into clean 4-block tiers,
// flat roof with a central mechanical penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87503.cells.json`, "utf8"));

const W = 34, H = 32, D = 41;
const g = new Voxels([W, H, D]);

const raw = new Map();
for (const [x, z, gr, rf] of cells) raw.set(`${x},${z}`, { x, z, ground: Math.max(0, Math.min(gr, H - 8)), roofRaw: rf });
const has = (x, z) => raw.has(`${x},${z}`);

// --- Smooth the lidar roof: 5x5 mean over footprint cells, then quantise to 4-block tiers ---
let base = Infinity;
for (const c of raw.values()) base = Math.min(base, c.roofRaw);
for (const c of raw.values()) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const o = raw.get(`${c.x + dx},${c.z + dz}`);
    if (o) { sum += o.roofRaw; n++; }
  }
  const mean = sum / n;
  const tier = base + 4 * Math.round((mean - base) / 4);
  c.roof = Math.min(Math.max(tier, c.ground + 8), H - 4);
}
const S = raw;

// Entrance on the south (max-z) face, two cells wide, centred on that face
const ENT0 = 16, ENT1 = 17;

for (const c of S.values()) {
  const { x, z, ground, roof } = c;
  const missX0 = !has(x - 1, z), missX1 = !has(x + 1, z);
  const missZ0 = !has(x, z - 1), missZ1 = !has(x, z + 1);
  const perim = missX0 || missX1 || missZ0 || missZ1;
  const corner = (missX0 || missX1) && (missZ0 || missZ1);
  const xFace = missX0 || missX1;
  const along = xFace ? z : x;
  const dx = missX0 ? 1 : missX1 ? -1 : 0;
  const dz = missZ0 ? 1 : missZ1 ? -1 : 0;

  // Foundation: rusticated stone up to this cell's ground
  for (let y = 0; y < ground; y++) {
    let blk = "stone_bricks";
    if (along % 4 === 0) blk = "chiseled_stone_bricks";
    if (y % 4 === 3) blk = "polished_andesite";
    if (perim) g.set(x, y, z, blk);
    else g.set(x, y, z, "stone_bricks");
  }

  // Body: ground -> roof-1
  for (let y = ground; y < roof; y++) {
    const r = y - ground;
    const k = Math.floor(r / 4);
    const rr = r % 4;

    if (!perim) {
      if (rr === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (corner) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    if (rr === 0) {
      g.set(x, y, z, k === 0 ? "polished_andesite" : "smooth_quartz");
      continue;
    }
    if (rr === 3) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    // rr 1..2: window zone
    const onEntFace = !xFace && missZ1 && k === 0;
    if (onEntFace && along >= ENT0 && along <= ENT1) {
      const half = rr === 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: along === ENT0 ? "left" : "right",
        open: "false", powered: "false",
      });
      continue;
    }
    if (onEntFace && (along === ENT0 - 1 || along === ENT1 + 1)) {
      // stone door surround
      g.set(x, y, z, "polished_andesite");
      continue;
    }

    if (along % 3 === 0) {
      g.set(x, y, z, "white_concrete");
    } else {
      const props = xFace
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      g.set(x, y, z, "light_blue_stained_glass_pane", props);
    }

    // warm light behind some glass
    if (rr === 1 && ((along + k * 2) % 7 === 3) && (dx !== 0 || dz !== 0) && has(x + dx, z + dz)) {
      g.set(x + dx, y, z + dz, "glowstone");
    }
  }

  // Lantern above the entrance (on the storey band, one block above the door head)
  if (perim && !xFace && missZ1 && along === 16 && ground === ground) {
    // handled below after loop
  }

  // Roof deck and parapet
  g.set(x, roof - 1, z, "light_gray_concrete");
  if (perim) g.set(x, roof, z, "smooth_quartz");
}

// Lanterns flanking the entrance door, on the ground-floor band
for (const c of S.values()) {
  const { x, z, ground } = c;
  if (has(x, z + 1)) continue;
  if (x === ENT0 - 1 || x === ENT1 + 1) {
    g.set(x, ground + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Central mechanical penthouse, set back from the parapet
for (const c of S.values()) {
  const { x, z, roof } = c;
  if (x < 9 || x > 24 || z < 13 || z > 27) continue;
  g.set(x, roof, z, "light_gray_concrete");
  g.set(x, roof + 1, z, "light_gray_concrete");
  g.set(x, roof + 2, z, "smooth_quartz");
}

g.save(`${DIR}/DC87503.nbt`);
