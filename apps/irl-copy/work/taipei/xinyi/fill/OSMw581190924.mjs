// Record: no record. Decided as a mid-1990s Xinyi commercial office block: four storeys of about
// five blocks, a white-tiled (quartz/concrete) frame with light-blue glass bands, a granite
// shopfront base, a single centred entrance on the north (z=0) face, a parapet, and a central
// plant room with a lightning rod. Roof at baseY+21 (about 21 above the ground under it).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw581190924";
const W = 26, H = 33, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.round(gy));

const has = (x, z) => ground.has(`${x},${z}`);
let baseY = 0;
for (const v of ground.values()) baseY = Math.max(baseY, v);

const g = new Voxels([W, H, D]);

const isPerim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const paneAlongX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneAlongZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS = "light_blue_stained_glass_pane";

// Front = north face (z = 0). Entrance at the middle of that face.
const midX = 12;

for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const perim = mW || mE || mN || mS;
  const corner = (mW || mE) && (mN || mS);
  const nx = mE ? 1 : mW ? -1 : 0;
  const nz = mS ? 1 : mN ? -1 : 0;
  const alongX = nx != 0; // wall runs along z
  const i = alongX ? z : x;

  // Foundation: solid from y=0 up to the building base.
  for (let y = 0; y < baseY; y++) g.set(x, y, z, "stone_bricks");

  // Storeys 0..21 relative to baseY.
  for (let r = 0; r <= 21; r++) {
    const y = baseY + r;
    if (y >= H) break;
    const floorMat = r === 20 ? "light_gray_concrete" : "smooth_stone";

    if (!perim) {
      if (r % 5 === 0 && r <= 20) g.set(x, y, z, floorMat);
      continue;
    }

    // Perimeter cells.
    if (r === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (r === 20) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (r === 21) { g.set(x, y, z, corner ? "white_concrete" : "smooth_quartz"); continue; }
    if (corner) { g.set(x, y, z, "white_concrete"); continue; }

    if (r < 5) {
      // Ground storey: shopfront with granite piers, central entrance on the front face.
      if (r === 4) { g.set(x, y, z, "smooth_quartz"); continue; }
      const onFront = nz === -1 && i === midX;
      if (onFront && r <= 2) {
        const half = r === 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (onFront && r === 3) { g.set(x, y, z, "smooth_quartz"); continue; }
      if (i % 3 === 0) { g.set(x, y, z, "polished_granite"); continue; }
      g.set(x, y, z, GLASS, alongX ? paneAlongX : paneAlongZ);
      continue;
    }

    // Upper storeys: spandrel bands, transom rows, window bays with white mullions.
    const sr = r % 5;
    if (sr === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }
    if (sr === 4) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (i % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }
    g.set(x, y, z, GLASS, alongX ? paneAlongX : paneAlongZ);

    // Warm light just behind some glass (one block inside, on a non-perimeter cell).
    if (sr === 2 && ((i * 7 + r * 13 + x + z) % 6 === 0)) {
      const ix = x - nx, iz = z - nz;
      if (has(ix, iz) && !isPerim(ix, iz)) g.set(ix, y, iz, "glowstone");
    }
  }
}

// Central roof plant room with a lightning rod on top.
const plantTop = baseY + 23;
if (plantTop + 1 < H) {
  for (let x = 8; x <= 17; x++) {
    for (let z = 5; z <= 12; z++) {
      if (!has(x, z)) continue;
      for (let r = 21; r <= 22; r++) g.set(x, baseY + r, z, "stone_bricks");
      g.set(x, baseY + 23, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  if (plantTop + 1 < H && has(12, 8)) {
    g.set(12, baseY + 24, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
