import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86593";
const W = 14, H = 33, D = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const set = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// The record says the roof is about 21 blocks above the lowest ground.
// Per-cell lidar values that are implausible are replaced by that figure, and
// everything is snapped to 3-block storeys so cornices line up.
const RECORD_ROOF = 21;
const snap = (r) => Math.round(r / 3) * 3;
const cellRoof = (r) => (r >= 15 && r <= 27 ? snap(r) : RECORD_ROOF);
const TOP = RECORD_ROOF;                 // single flat main roof, 7 storeys
const T1 = TOP - 6;                      // outer two storeys set back from the edge
const topOf = new Map();

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const c of cells) {
  const [x, z, gr0, rf] = c;
  const gr = Math.max(0, Math.round(gr0));
  const dist = Math.min(x, W - 1 - x, z, D - 1 - z);
  const faces = [];
  if (x === 0) faces.push("west");
  if (x === W - 1) faces.push("east");
  if (z === 0) faces.push("north");
  if (z === D - 1) faces.push("south");

  const top = Math.max(gr + 3, Math.min(TOP, cellRoof(rf)));
  topOf.set(`${x},${z}`, top);
  const low = dist < 2 && top > T1 ? T1 : top;

  for (let y = 0; y < top; y++) {
    // Foundation up to this cell's ground.
    if (y < gr) {
      set(x, y, z, dist === 0 ? "stone_bricks" : "stone");
      continue;
    }
    // Setback: the outer two rings stop at T1.
    if (dist < 2 && y >= low) continue;

    // Cornice on the perimeter, tar roof inside.
    if (y === top - 1 || (dist < 2 && y === low - 1)) {
      set(x, y, z, dist === 0 ? "smooth_stone" : "gray_concrete");
      continue;
    }

    // Solid deep core.
    if (dist >= 2) {
      set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Air gap behind the glazing; floor slabs only.
    if (dist === 1) {
      if (y % 3 === 0 || y === gr) set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Perimeter wall.
    if (faces.length >= 2) {                // corner pilaster
      set(x, y, z, "stone_bricks");
      continue;
    }
    const face = faces[0];
    const ns = face === "north" || face === "south";
    const along = ns ? x : z;

    if (y < gr + 2) {                       // base course
      set(x, y, z, "stone_bricks");
      continue;
    }
    if (y % 3 === 0) {                      // storey line
      set(x, y, z, "smooth_stone");
      continue;
    }
    if (along % 3 === 1) {                  // window bay, with framing
      const boarded = (along * 7 + y * 5 + x * 3) % 9 === 0;
      if (boarded) set(x, y, z, "oak_planks");
      else set(x, y, z, "glass_pane", ns ? paneNS : paneEW);
      continue;
    }
    set(x, y, z, "bricks");                 // pier
  }
}

// Warm light behind a few upper-floor windows (vacant, so only a handful).
for (const c of cells) {
  const [x, z] = c;
  const dist = Math.min(x, W - 1 - x, z, D - 1 - z);
  if (dist !== 0 || x === 0 || x === W - 1 || z === 0 || z === D - 1) continue;
  // only the street-facing north/south faces, one window in a few
  if (z !== 0 && z !== D - 1) continue;
  if (x % 3 !== 1) continue;
  const top = topOf.get(`${x},${z}`) || 0;
  for (let y = 1; y < top - 1; y++) {
    if (y % 3 === 1 && (x + y) % 7 === 0) {
      const inz = z === 0 ? 1 : D - 2;
      set(x, y, inz, "glowstone");
    }
  }
}

// Main entrance centred on the south face.
const ent = cells.find((c) => c[0] === 6 && c[1] === D - 1);
if (ent) {
  const eg = Math.max(0, Math.round(ent[2]));
  const doorBase = { facing: "south", hinge: "left", open: "false", powered: "false" };
  set(6, eg, D - 1, "oak_door", { ...doorBase, half: "lower" });
  set(6, eg + 1, D - 1, "oak_door", { ...doorBase, half: "upper" });
  for (let y = eg; y <= eg + 2; y++) {
    set(5, y, D - 1, "polished_granite");
    set(7, y, D - 1, "polished_granite");
  }
  set(6, eg + 2, D - 1, "glass_pane", paneNS);
  for (let x = 5; x <= 7; x++) set(x, eg + 3, D - 1, "polished_granite");
}

// Rooftop plant room on the main tier, set back from the edges.
for (let x = 5; x <= 8; x++) {
  for (let z = 9; z <= 14; z++) {
    if (topOf.get(`${x},${z}`) !== TOP) continue;
    for (let y = TOP; y <= TOP + 1; y++) set(x, y, z, "stone_bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
