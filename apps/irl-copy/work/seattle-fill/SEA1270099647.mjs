// SEA1270099647: Pacific Science Center campus annex, 1960s concrete science-hall block.
// Local coords: x 0..22 (east), z 0..6 (south). Footprint: z 0-3 full width, z 4-6 only x 0-7.
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 23, D = 7, H = 19;
const g = new Voxels([W, H, D]);

const inF = (x, z) => x >= 0 && x < W && z >= 0 && z < D && (z <= 3 || x <= 7);
const inT1 = (x, z) => x >= 5 && x <= 7 && z >= 4 && z <= 6;   // stair/elevator tower, lower step
const inT2 = (x, z) => x >= 6 && x <= 7 && z >= 4 && z <= 5;   // tower upper step
const inPH = (x, z) => x >= 9 && x <= 12 && z >= 1 && z <= 2;  // rooftop mechanical penthouse
const faces = (x, z, m) => {
  const f = [];
  if (!m(x, z - 1)) f.push("N");
  if (!m(x, z + 1)) f.push("S");
  if (!m(x - 1, z)) f.push("W");
  if (!m(x + 1, z)) f.push("E");
  return f;
};
const paneState = (f) =>
  f.includes("N") || f.includes("S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const cells = (m) => { const out = []; for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (m(x, z)) out.push([x, z]); return out; };

const F = cells(inF);

// 1. Deep gray plinth, y 0-1, whole footprint.
for (const [x, z] of F) {
  g.set(x, 0, z, "gray_concrete");
  g.set(x, 1, z, "gray_concrete");
}

// 2. Body, y 2-13: three storeys of white concrete with piers, glass slots, spandrels.
for (let y = 2; y <= 13; y++) {
  for (const [x, z] of F) {
    const f = faces(x, z, inF);
    if (!f.length) {                       // interior
      if (y === 5 || y === 9) g.set(x, y, z, "white_concrete");   // floor slabs
      else if (y === 13) g.set(x, y, z, "light_gray_concrete");   // roof deck
      continue;
    }
    if (y === 13) { g.set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); continue; } // cornice / parapet

    // Entrance bay on the long south face (z = 3, x 11-16): doors at x 13-14, glazed bay, teal fascia.
    if (z === 3 && f.includes("S") && x >= 11 && x <= 16) {
      if (y === 4) { g.set(x, y, z, "cyan_terracotta"); continue; }
      if (y === 2 || y === 3) {
        if (x === 13 || x === 14) {
          const half = y === 2 ? "lower" : "upper";
          g.set(x, y, z, "dark_oak_door", {
            facing: "south", half, hinge: x === 13 ? "left" : "right", open: "false", powered: "false",
          });
        } else {
          g.set(x, y, z, "glass_pane", paneState(["N", "S"]));
        }
        continue;
      }
    }

    const corner = f.length >= 2;
    const horiz = f.includes("N") || f.includes("S");
    const a = horiz ? x : z;
    const pier = corner || a % 3 === 0;

    if (y === 5 || y === 9) { g.set(x, y, z, "light_gray_concrete"); continue; }        // spandrel bands
    if (y <= 4 || (y >= 6 && y <= 8)) {                                                  // white storeys
      if (pier) {
        const teal = y >= 6 && !corner && (((a / 3) | 0) % 4 === 2);                     // subtle teal accent piers
        g.set(x, y, z, teal ? "cyan_terracotta" : "quartz_pillar", teal ? undefined : { axis: "y" });
      } else {
        g.set(x, y, z, "glass_pane", paneState(f));
      }
      continue;
    }
    // Top storey: dark band, gray piers with light-blue glazing.
    if (pier) g.set(x, y, z, "gray_concrete");
    else g.set(x, y, z, "light_blue_stained_glass");
  }
}

// 3. Stair/elevator tower at the east end of the short wing, stepped.
for (let y = 14; y <= 15; y++) {
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (!inT1(x, z)) continue;
    const f = faces(x, z, inT1);
    if (!f.length) continue;                                       // hollow shaft
    if (f.length >= 2) { g.set(x, y, z, "light_gray_concrete"); continue; }
    const mid = f[0] === "N" || f[0] === "S" ? x === 6 : z === 5;
    if (mid) g.set(x, y, z, "glass_pane", paneState(f));           // tall stair slot
    else g.set(x, y, z, "light_gray_concrete");
  }
}
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (inT1(x, z)) g.set(x, 16, z, "light_gray_concrete");          // tower lower cap, full
  if (inT2(x, z)) g.set(x, 17, z, "light_gray_concrete");          // upper step
  if (inT2(x, z)) g.set(x, 18, z, "gray_concrete");                // upper step cap
}

// 4. Rooftop mechanical penthouse with teal panel on its south face.
for (let y = 14; y <= 15; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inPH(x, z)) continue;
  const teal = z === 2 && (x === 10 || x === 11);
  g.set(x, y, z, teal ? "cyan_terracotta" : "light_gray_concrete");
}
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (inPH(x, z)) g.set(x, 16, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// 5. Roof railings (iron_bars) on the roof edge, clear of the tower.
const R = new Set();
for (const [x, z] of F) if (faces(x, z, inF).length && !inT1(x, z)) R.add(`${x},${z}`);
for (const k of R) {
  const [x, z] = k.split(",").map(Number);
  const c = (dx, dz) => (R.has(`${x + dx},${z + dz}`) ? "true" : "false");
  g.set(x, 14, z, "iron_bars", {
    north: c(0, -1), south: c(0, 1), east: c(1, 0), west: c(-1, 0), waterlogged: "false",
  });
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle-fill/SEA1270099647.nbt");
console.log(`SEA1270099647 built: size [${W},${H},${D}], blocks ${g.count()}`);
