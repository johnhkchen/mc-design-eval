import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370157573";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 31, H = 159, D = 29;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);

const G = Math.min(...cells.map((c) => c[2]));
const TOP = G + 147;          // roof level from lidar
const MECH_TOP = TOP + 2;     // roof plant box top (exclusive of mast)
const MAST_TOP = G + 157;     // antenna tip, inside the 159 box

// Setback tiers: full footprint to storey ~20, inset 2 to ~storey 26, inset 4 above.
const tierOf = (y) => (y < G + 100 ? 0 : y < G + 130 ? 2 : 4);
function inTier(x, z, k) {
  if (!inFp(x, z)) return false;
  for (let dx = -k; dx <= k; dx++)
    for (let dz = -k; dz <= k; dz++)
      if (!inFp(x + dx, z + dz)) return false;
  return true;
}
const isFacade = (x, z, k) =>
  inTier(x, z, k) &&
  (!inTier(x + 1, z, k) || !inTier(x - 1, z, k) || !inTier(x, z + 1, k) || !inTier(x, z - 1, k));

// Corner cell: facade on both axes
const isCorner = (x, z, k) =>
  inTier(x, z, k) &&
  (!inTier(x + 1, z, k) || !inTier(x - 1, z, k)) &&
  (!inTier(x, z + 1, k) || !inTier(x, z - 1, k));

const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

for (const [x, z, gr] of cells) {
  // Foundation and plinth below grade
  for (let y = 0; y < gr; y++) g.set(x, y, z, "gray_concrete");

  for (let y = gr; y < TOP; y++) {
    const rel = y - G;
    const k = tierOf(y);

    if (!inTier(x, z, k)) {
      // Terrace slab where a setback steps back
      if ((y === G + 100 && inTier(x, z, 0)) || (y === G + 130 && inTier(x, z, 2))) {
        g.set(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    const facade = isFacade(x, z, k);
    const corner = isCorner(x, z, k);

    // Roof cap
    if (y === TOP - 1) {
      g.set(x, y, z, facade ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    // Parapet band
    if (facade && y >= TOP - 3) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // Corner piers: full height solid white concrete
    if (corner) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // Entrance on south face: glass doors, quartz lintel, lanterns above
    if (facade && z === maxZ && rel < 4 && Math.abs(x - cx) <= 2) {
      if (rel < 3) g.set(x, y, z, "glass");
      else g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (z === maxZ && facade && Math.abs(x - cx) === 3 && rel < 3) {
      g.set(x, y, z, "polished_andesite");   // door surrounds
      continue;
    }
    if (facade && z === maxZ && Math.abs(x - cx) <= 2 && rel === 3) {
      if (x === cx) g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      else g.set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Floor slab / spandrel line at storey starts and at grade
    if (y === gr || rel % 5 === 0) {
      g.set(x, y, z, facade ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    if (facade) {
      const m = rel % 5;
      if (m === 4) {
        // Sill band; the podium storeys get a polished stone plinth course
        g.set(x, y, z, rel < 5 ? "polished_andesite" : "light_gray_concrete");
        continue;
      }
      const alongX = !inTier(x, z + 1, k) || !inTier(x, z - 1, k);
      const along = alongX ? x : z;
      // Podium: quartz mullions at every 2nd cell; tower: 3-cell bays
      const bay = rel < 5 ? 2 : 3;
      if (along % bay === 0) {
        g.set(x, y, z, rel < 5 ? "smooth_quartz" : "light_gray_concrete");
      } else {
        const connect = alongX
          ? { north: "false", south: "false", east: "true", west: "true" }
          : { north: "true", south: "true", east: "false", west: "false" };
        // Alternate blue glass with a warmer tint on some storeys for rhythm
        const glass = (Math.floor(rel / 5) % 4 === 2) ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
        g.set(x, y, z, glass, { ...connect, waterlogged: "false" });
      }
      continue;
    }

    // Interior: warm light just behind some windows, otherwise air
    const nearFacade =
      isFacade(x + 1, z, k) || isFacade(x - 1, z, k) || isFacade(x, z + 1, k) || isFacade(x, z - 1, k);
    if (nearFacade && rel % 5 === 2 && (x * 31 + z * 17 + rel * 7) % 5 === 0) {
      g.set(x, y, z, "glowstone");
    }
  }
}

// Roof plant box: inset-6 core sits on the roof cap
const inCore = (x, z) => inTier(x, z, 6);
for (const [x, z] of cells) {
  if (!inCore(x, z)) continue;
  for (let y = TOP; y < MECH_TOP; y++) {
    const edge = !inCore(x + 1, z) || !inCore(x - 1, z) || !inCore(x, z + 1) || !inCore(x, z - 1);
    if (edge && (x + z + y) % 2 === 0) g.set(x, y, z, "light_gray_concrete");
    else if (edge) g.set(x, y, z, "smooth_quartz");
    else g.set(x, y, z, "gray_concrete");
  }
  // Warm roof lights ringing the plant box top
  if (!inTier(x, z, 7) && !(x + z) % 2) g.set(x, MECH_TOP - 1, z, "shroomlight");
}

// Roof antenna mast on the core, with aviation light
let mx = cx, mz = cz;
if (!inCore(mx, mz)) {
  let best = null;
  for (const [x, z] of cells) {
    if (!inCore(x, z)) continue;
    const d = Math.abs(x - cx) + Math.abs(z - cz);
    if (!best || d < best.d) best = { x, z, d };
  }
  if (best) { mx = best.x; mz = best.z; }
}
for (let y = MECH_TOP; y < MAST_TOP - 1; y++) {
  g.set(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}
g.set(mx, MAST_TOP - 1, mz, "red_stained_glass");

g.save(`${DIR}/${ID}.nbt`);
