import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309237297";
const W = 45, H = 71, D = 28;
const TOP = 58; // last solid course of the shaft; roof deck surface is y 59

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint helpers ----
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const ext = (x, z) =>
  Object.keys(DIRS).filter((n) => {
    const [dx, dz] = DIRS[n];
    return !has(x + dx, z + dz);
  });

// street front = face with the most exposed cells
const faceCount = { north: 0, south: 0, west: 0, east: 0 };
for (const [x, z] of cells) for (const f of ext(x, z)) faceCount[f]++;
const frontFace = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];

// entrance centre = median bay on the front face
const frontBays = [];
for (const [x, z] of cells) {
  const e = ext(x, z);
  if (e.length === 1 && e[0] === frontFace) {
    frontBays.push(frontFace === "north" || frontFace === "south" ? x : z);
  }
}
frontBays.sort((a, b) => a - b);
const midBay = frontBays.length ? frontBays[Math.floor(frontBays.length / 2)] : -1;

// distance from the outer edge (for roof plant placement)
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (ext(x, z).length > 0) {
    dist.set(`${x},${z}`, 0);
    queue.push([x, z]);
  }
}
for (let qi = 0; qi < queue.length; qi++) {
  const [x, z] = queue[qi];
  const d = dist.get(`${x},${z}`);
  for (const [dx, dz] of Object.values(DIRS)) {
    const nx = x + dx, nz = z + dz, k = `${nx},${nz}`;
    if (has(nx, nz) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push([nx, nz]);
    }
  }
}

// ---- plan (all writes collected, then emitted) ----
const plan = new Map();
const put = (x, y, z, block, props) => plan.set(`${x},${y},${z}`, [x, y, z, block, props]);
const glowCandidates = [];

const GLASS = "cyan_stained_glass_pane";
const paneProps = (axisX) =>
  axisX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const gnd = Math.max(0, Math.min(Math.round(gr), TOP));

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

  const ex = ext(x, z);
  const facade = ex.length > 0;
  const corner = ex.length >= 2;
  const face = ex[0];
  const axisX = face === "north" || face === "south";
  const i = axisX ? x : z;
  const isFront = facade && !corner && face === frontFace;
  const nearMid = isFront && Math.abs(i - midBay) <= 1;

  for (let y = gnd; y <= TOP; y++) {
    const rel = y - gnd;

    // roof deck
    if (y === TOP) {
      put(x, y, z, facade ? "smooth_quartz" : "smooth_stone");
      continue;
    }

    if (!facade) {
      // interior: floor slabs per storey, otherwise air (gap behind glass)
      if (rel > 0 && rel % 5 === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // cornice and parapet: heavier top band
    if (y >= 56) { put(x, y, z, "white_concrete"); continue; }
    if (y >= 54) { put(x, y, z, "quartz_block"); continue; }
    if (corner) { put(x, y, z, "quartz_block"); continue; }

    // three-bay entrance: centre door, glass flanks, lantern above
    if (nearMid && rel <= 3) {
      if (i === midBay) {
        if (rel === 0 || rel === 1) {
          put(x, y, z, "dark_oak_door", {
            facing: face, half: rel === 0 ? "lower" : "upper",
            hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (rel === 2) { put(x, y, z, GLASS, paneProps(axisX)); continue; }
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      if (rel === 0) { put(x, y, z, "polished_granite"); continue; }
      put(x, y, z, GLASS, paneProps(axisX));
      continue;
    }

    if (rel === 0) { put(x, y, z, "polished_granite"); continue; } // base course
    if (rel < 5) {
      if (rel === 4) { put(x, y, z, "black_concrete"); continue; }   // shopfront header
      if (i % 3 === 0) { put(x, y, z, "quartz_block"); continue; }   // shop piers
      put(x, y, z, GLASS, paneProps(axisX));
    } else {
      // storey line: darker spandrel so the floors read from distance
      if (rel % 5 === 0) { put(x, y, z, "light_gray_concrete"); continue; }
      if (i % 3 === 0) { put(x, y, z, "quartz_block"); continue; }   // mullion pier
      put(x, y, z, GLASS, paneProps(axisX));
    }

    // warm light behind some panes (inward cell, interior air)
    const [dx, dz] = DIRS[face];
    const inx = x - dx, inz = z - dz;
    if (
      rel % 5 >= 2 && rel % 5 <= 3 &&
      (i + rel) % 6 === 2 &&
      has(inx, inz) && ext(inx, inz).length === 0 &&
      (ground.get(`${inx},${inz}`) ?? 0) <= y
    ) {
      glowCandidates.push([inx, y, inz]);
    }
  }

  // roof plant and penthouse on the core
  const dd = dist.get(`${x},${z}`) ?? 0;
  if (dd >= 4) {
    for (let y = 59; y <= 61; y++) put(x, y, z, "light_gray_concrete");
  }
  if (dd >= 9) {
    for (let y = 59; y <= 61; y++) put(x, y, z, "smooth_quartz");
    put(x, 62, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// lights last so they win over any slab or pier written in the same place
for (const [x, y, z] of glowCandidates) put(x, y, z, "glowstone");

// ---- emit ----
for (const [x, y, z, block, props] of plan.values()) {
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

g.save(`${DIR}/${ID}.nbt`);
