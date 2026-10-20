import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3395552";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 25, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const L = (x, y, z) => `${x},${y},${z}`;

// One building-wide storey base B and one flat roof R, so lidar noise
// does not produce a spiky massing. Each cell's own ground (gr) only
// sets how deep its foundation goes.
const raw = [];
for (const [x, z, ground] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  raw.push({ x, z, gr: Math.min(Math.max(0, Math.round(ground)), 16) });
}
const gmin = Math.min(...raw.map(c => c.gr));
const gmax = Math.max(...raw.map(c => c.gr));
const B = Math.min(gmax, 16);                     // first storey row for all cells
const R = Math.min(24, Math.max(gmin + 13, B + 8)); // flat roof (solid rows y < R)

const info = new Map();
for (const c of raw) info.set(key(c.x, c.z), { x: c.x, z: c.z, gr: c.gr, B, R });

function exposed(x, z) {
  const f = [];
  if (!info.has(key(x, z - 1))) f.push("N");
  if (!info.has(key(x, z + 1))) f.push("S");
  if (!info.has(key(x - 1, z))) f.push("W");
  if (!info.has(key(x + 1, z))) f.push("E");
  return f;
}

// upper storey floor slabs at B+3, B+5, ...; windows one row above each slab
function isSlab(y) {
  return y >= B + 3 && y <= R - 4 && (y - B - 3) % 2 === 0;
}
function isUpperWinRow(y) {
  return y >= B + 4 && y <= R - 3 && (y - B - 4) % 2 === 0;
}

function windowAt(c, f, y) {
  const exp = exposed(c.x, c.z);
  if (exp.length !== 1) return false;
  const idx = (f === "N" || f === "S") ? c.x : c.z;
  if (idx % 2 !== 1) return false;
  if (isUpperWinRow(y)) return true;
  if (y === B + 1) return true;                  // ground glass / shopfront
  if (y === B + 2 && f !== "N") return true;     // ground glass on other faces
  return false;
}

function inward(f) {
  if (f === "N") return [0, 1];
  if (f === "S") return [0, -1];
  if (f === "W") return [1, 0];
  return [-1, 0];
}

// Pass A: warm lights just inside some windows
const lights = new Set();
for (const c of info.values()) {
  const exp = exposed(c.x, c.z);
  if (exp.length === 0) continue;
  for (const f of exp) {
    for (let y = B + 1; y <= R - 3; y++) {
      if (!windowAt(c, f, y)) continue;
      if (((c.x * 3 + c.z * 5 + y) % 4) !== 0) continue;
      const [dx, dz] = inward(f);
      const ix = c.x + dx, iz = c.z + dz;
      if (info.has(key(ix, iz)) && exposed(ix, iz).length === 0) lights.add(L(ix, y, iz));
    }
  }
}

// Pass B: build
for (const c of info.values()) {
  const { x, z, gr } = c;
  const exp = exposed(x, z);

  // Foundation under every cell up to the building-wide base
  for (let y = 0; y < B; y++) {
    if (exp.length === 0 || y < gr) g.set(x, y, z, "stone_bricks");
    else g.set(x, y, z, "polished_andesite");   // exposed plinth course
  }

  if (exp.length === 0) {
    // interior: floor slabs, roof deck, air gaps, some warm lights
    for (let y = B; y < R; y++) {
      if (lights.has(L(x, y, z))) g.set(x, y, z, "glowstone");
      else if (isSlab(y) || y === R - 1) g.set(x, y, z, "smooth_stone");
    }
    continue;
  }

  const front = exp.includes("N");
  const corner = exp.length > 1;

  for (let y = B; y < R; y++) {
    if (y === R - 1) { g.set(x, y, z, "stone_bricks"); continue; }   // parapet cap
    if (y === R - 2) { g.set(x, y, z, "smooth_stone"); continue; }   // cornice

    // Water Street shopfront: door at centre, fascia above
    if (front && y === B + 2) {
      if (x === 3) g.set(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
      else g.set(x, y, z, "dark_oak_planks");
      continue;
    }
    if (front && y === B + 1 && x === 3) {
      g.set(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
      continue;
    }

    if (isSlab(y)) { g.set(x, y, z, "stone_bricks"); continue; }     // belt courses

    if (!corner && windowAt(c, exp[0], y)) {
      g.set(x, y, z, "glass_pane");
      continue;
    }
    g.set(x, y, z, "bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
