import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280241";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Four-storey, mid-century (c. 1970s-80s) concrete-frame office/shop block.
// White-tiled concrete walls, stone-brick base and cornice, light-grey storey bands,
// shopfront glazing on the ground floor, punched windows above, a flat roof with a
// water tank and a lightning rod.
const W = 20, H = 33, D = 17;
const ROOF = 21;           // top of parapet course sits at y 21 (roof ~21 above lowest ground)
const LEVELS = [0, 5, 10, 15, 20];
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  const v = Math.max(0, Math.min(H - 1, Math.round(Number(gr) || 0)));
  ground.set(key(x, z), v);
}
const has = (x, z) => ground.has(key(x, z));
const exposed = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z),
});
const isPerim = (e) => e.N || e.S || e.W || e.E;

function put(x, y, z, id, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

// Solid top (highest y that is filled) per footprint cell, used for interior lamp placement.
const solidTop = new Map();

// Pick the front entrance: exposed north (z min) cell nearest the middle of the frontage.
let door = null;
{
  let best = null;
  for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
    const e = exposed(x, z);
    if (!e.N || e.S || e.W || e.E) continue;
    if (ground.get(key(x, z)) !== 0) continue;
    const score = Math.abs(x - 9.5) + z * 0.01;
    if (!best || score < best.score) best = { x, z, score };
  }
  if (best) door = best;
}
const doorKey = door ? key(door.x, door.z) : null;

const windows = [];   // { x, z, y, face, idx }
const corners = [];   // corner cells for lanterns
const canopy = [];    // canopy cells at y=4

for (const [kx, gr] of ground) {
  const [x, z] = kx.split(",").map(Number);
  const e = exposed(x, z);
  const perim = isPerim(e);
  const corner = (e.N || e.S) && (e.W || e.E);

  if (perim) {
    // Foundation below the ground line.
    for (let y = 0; y < gr; y++) put(x, y, z, "stone");
    solidTop.set(kx, ROOF);
    if (corner) corners.push({ x, z });

    // Face for windows: which exterior face this cell shows (N/S show along x, E/W along z).
    const onNS = e.N || e.S;
    const idx = onNS ? x : z;
    const faceKey = onNS ? "NS" : "EW";
    const isDoor = kx === doorKey;

    for (let y = gr; y <= 20; y++) {
      if (y === gr) { put(x, y, z, "stone_bricks"); continue; }          // base course
      if (y === 20) { put(x, y, z, "stone_bricks"); continue; }          // cornice
      if (LEVELS.includes(y)) { put(x, y, z, "light_gray_concrete"); continue; } // storey band

      if (y <= 4) {
        // Ground storey: shopfront glazing with a door in the middle.
        if (isDoor && (y === 1 || y === 2)) continue; // door set below
        if (y >= 1 && y <= 3 && !corner) {
          const props = onNS
            ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
            : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
          put(x, y, z, "light_blue_stained_glass_pane", props);
          if (idx % 6 === 1) windows.push({ x, z, y: 2, face: faceKey, idx });
          continue;
        }
        put(x, y, z, "white_concrete");
        continue;
      }

      // Upper storeys: punched windows, pillars between.
      const L = 5 * Math.floor(y / 5);
      const r = y - L;
      if (r >= 1 && r <= 3 && !corner && idx % 3 === 1) {
        const props = onNS
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, "light_blue_stained_glass_pane", props);
        if (idx % 6 === 1) windows.push({ x, z, y: L + 2, face: faceKey, idx });
      } else {
        put(x, y, z, "white_concrete");
      }
    }

    // Parapet course.
    put(x, ROOF, z, "white_concrete");
  } else {
    // Interior cell: solid up to the first storey line at or above ground, then slabs.
    const Lf = LEVELS.find((L) => L >= gr) ?? gr;
    for (let y = 0; y < gr; y++) put(x, y, z, "stone");
    for (let y = gr; y <= Lf; y++) put(x, y, z, "smooth_stone");
    solidTop.set(kx, Lf);
    for (const L of LEVELS) if (L > Lf) put(x, L, z, "smooth_stone");
    if (Lf < ROOF) put(x, ROOF, z, "smooth_stone"); // roof deck
  }
}

// Entrance: door, transom already glazed, canopy slab over the door bay.
if (door) {
  const { x, z } = door;
  put(x, 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) {
    if (has(x + dx, z) && exposed(x + dx, z).N) {
      put(x + dx, 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // Warm light just inside the entrance.
  if (has(x, z + 1) && solidTop.get(key(x, z + 1)) < 1) {
    put(x, 1, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Glowstone behind some windows (interior air cell just inside the glass).
for (const w of windows) {
  let ix = w.x, iz = w.z;
  if (w.face === "NS") iz = exposed(w.x, w.z).N ? w.z + 1 : w.z - 1;
  else ix = exposed(w.x, w.z).W ? w.x + 1 : w.x - 1;
  const ik = key(ix, iz);
  if (!has(ix, iz)) continue;
  if (solidTop.get(ik) >= w.y) continue;
  put(ix, w.y, iz, "glowstone");
}

// Lanterns on the parapet corners.
for (const c of corners) {
  put(c.x, ROOF + 1, c.z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof plant: a small water tank with cap and lightning rod, on interior deck cells.
{
  const tankCells = [[8, 7], [9, 7], [8, 8], [9, 8]].filter(([x, z]) => {
    const e = exposed(x, z);
    return has(x, z) && !isPerim(e);
  });
  for (const [x, z] of tankCells) {
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
    put(x, ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
  if (tankCells.length) {
    const [x, z] = tankCells[tankCells.length - 1];
    put(x, ROOF + 4, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
