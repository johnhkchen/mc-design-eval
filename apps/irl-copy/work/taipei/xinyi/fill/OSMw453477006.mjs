import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453477006";
const W = 47, H = 95, D = 30;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.round(gy));
const inFp = (x, z) => ground.has(`${x},${z}`);

// Setback tiers: podium garden (0-19), tower (20-49), setback (50-69), crown (70-83)
const TIERS = [
  { start: 0,  top: 19, r: 0 },
  { start: 20, top: 49, r: 3 },
  { start: 50, top: 69, r: 6 },
  { start: 70, top: 83, r: 9 },
];

const squareInside = (x, z, r) => {
  for (let dx = -r; dx <= r; dx++)
    for (let dz = -r; dz <= r; dz++)
      if (!inFp(x + dx, z + dz)) return false;
  return true;
};
const inTier = (k, x, z) => inFp(x, z) && squareInside(x, z, TIERS[k].r);
const maxTier = (x, z) => {
  let k = 0;
  while (k + 1 < TIERS.length && inTier(k + 1, x, z)) k++;
  return k;
};
const tierAt = (y, x, z) => {
  let k = 0;
  for (let i = 0; i < TIERS.length; i++)
    if (y >= TIERS[i].start && inTier(i, x, z)) k = i;
  return k;
};

// [name, dx, dz]; facing names match Minecraft's facing property
const DIRS = [["east", 1, 0], ["west", -1, 0], ["south", 0, 1], ["north", 0, -1]];
const outwardOf = (k, x, z) => DIRS.filter(([, dx, dz]) => !inTier(k, x + dx, z + dz));
const isEdge = (k, x, z) => inTier(k, x, z) && outwardOf(k, x, z).length > 0;

const capBlock = (mk, x, z) => {
  if (mk === 0) return "moss_block";                 // podium roof garden
  if (mk === TIERS.length - 1) return isEdge(mk, x, z) ? "gold_block" : "smooth_quartz";
  return "smooth_quartz";
};

// Warm glow inside a room directly behind some lit upper-floor windows
const litBy = (k, x, z, s) =>
  DIRS.some(([, dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    if (!inTier(k, nx, nz) || !isEdge(k, nx, nz)) return false;
    const o = outwardOf(k, nx, nz);
    if (o.length !== 1) return false;
    const idx = o[0][1] !== 0 ? nz : nx;
    return idx % 3 !== 0 && ((nx * 31 + nz * 17 + s * 7) % 5 === 0);
  });

const g = new Voxels([W, H, D]);

for (const [x, z, gy0] of cells) {
  const gy = Math.round(gy0);
  const mk = maxTier(x, z);
  const top = TIERS[mk].top;

  // foundation up to this cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gy; y <= top; y++) {
    // roof / ledge cap
    if (y === top) {
      g.set(x, y, z, capBlock(mk, x, z));
      if (mk === 0 && (x * 5 + z * 3) % 7 === 0) {
        g.set(x, y + 1, z, "azalea_leaves", { distance: "7", persistent: "true", waterlogged: "false" });
      }
      continue;
    }

    const k = tierAt(y, x, z);

    // ceiling of a lower tier that carries the next tier above it
    if (tierAt(y + 1, x, z) > k) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }

    const s = Math.floor(y / 5);
    const yy = y % 5;

    if (!isEdge(k, x, z)) {
      // interior: floor slab each storey, air between, occasional warm light
      if (yy === 0) g.set(x, y, z, "smooth_quartz");
      else if (yy === 1 && s >= 1 && litBy(k, x, z, s)) g.set(x, y, z, "glowstone");
      continue;
    }

    // facade
    const out = outwardOf(k, x, z);
    if (yy === 0) {
      g.set(x, y, z, s === 0 ? "polished_granite" : "smooth_quartz");
      continue;
    }
    if (yy === 4) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    // yy 1..3
    if (out.length >= 2) {            // corner pier
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    const [face, dx, dz] = out[0];
    const idx = dx !== 0 ? z : x;

    if (s === 0) {
      const entrance = gy <= 1 && idx % 12 === 6;
      const nearEntrance = gy <= 1 && [5, 6, 7].includes(idx % 12);
      if (entrance) {
        if (yy === 1) g.set(x, y, z, "oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (yy === 2) g.set(x, y, z, "oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
        else g.set(x, y, z, "smooth_quartz");
        continue;
      }
      if (yy === 3 && nearEntrance) g.set(x, y, z, "smooth_quartz"); // canopy band
      else g.set(x, y, z, "light_blue_stained_glass");               // shopfront glass
      continue;
    }

    // upper floors: framed window grid of glass panes
    if (idx % 3 === 0) {
      g.set(x, y, z, "smooth_quartz");   // mullion
      continue;
    }
    const along = dx !== 0
      ? { north: "true", south: "true", east: "false", west: "false" }
      : { east: "true", west: "true", north: "false", south: "false" };
    g.set(x, y, z, "light_blue_stained_glass_pane", { ...along, waterlogged: "false" });
  }
}

// Crown: plant-room penthouse and a gold spire on the top tier
const cx = 23, cz = 14;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (!inTier(3, x, z)) continue;
  if (Math.abs(x - cx) <= 4 && Math.abs(z - cz) <= 3) {
    g.set(x, 84, z, "light_gray_concrete");
    g.set(x, 85, z, "light_gray_concrete");
    g.set(x, 86, z, "smooth_quartz");
  }
}
if (inTier(3, cx, cz)) {
  for (let y = 87; y <= 90; y++) g.set(cx, y, cz, "gold_block");
  g.set(cx, 91, cz, "sea_lantern");
}

g.save(`${DIR}/${ID}.nbt`);
