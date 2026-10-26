import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC61023.cells.json`, "utf8"));

const W = 15, H = 31, D = 32;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Cell massing: quantise lidar roof to even tiers, keep a minimum rise, cap for roof plant.
const cellMap = new Map();
for (const [x, z, ground, roof] of cells) {
  let t = 2 * Math.round(roof / 2);
  t = Math.max(t, ground + 6);
  t = Math.min(t, 28);
  cellMap.set(key(x, z), { x, z, ground, top: t });
}
const has = (x, z) => cellMap.has(key(x, z));

// Depth from the outside of the footprint: 0 = facade ring, 1 = behind it, etc.
const depth = new Map();
const q = [];
for (const c of cellMap.values()) {
  const edge = nb.some(([dx, dz]) => !has(c.x + dx, c.z + dz));
  if (edge) { depth.set(key(c.x, c.z), 0); q.push(c); }
}
for (let i = 0; i < q.length; i++) {
  const c = q[i];
  const dd = depth.get(key(c.x, c.z));
  for (const [dx, dz] of nb) {
    const nx = c.x + dx, nz = c.z + dz;
    const k = key(nx, nz);
    if (has(nx, nz) && !depth.has(k)) {
      depth.set(k, dd + 1);
      q.push(cellMap.get(k));
    }
  }
}

// Facade info: corner piers and bay position along the street face.
function facade(c) {
  const m = [!has(c.x - 1, c.z), !has(c.x + 1, c.z), !has(c.x, c.z - 1), !has(c.x, c.z + 1)];
  const n = m.filter(Boolean).length;
  const pos = (m[0] || m[1]) ? c.z : c.x;
  return { corner: n >= 2, pos };
}
const isPier = (c) => { const f = facade(c); return f.corner || f.pos % 3 === 0; };

// Ground-floor entrance on the north-facing (min z) side, centred: three cells wide.
const isEntrance = (c) => depth.get(key(c.x, c.z)) === 0 && !has(c.x, c.z - 1) && Math.abs(c.x - 7) <= 1;

// Window rows: shopfront at h 1-2, then even rows h>=4 with odd rows as spandrel slabs.
const isWinRow = (h, rel) => (h === 1 || h === 2) || (h >= 4 && h <= rel - 3 && h % 2 === 0);

// Pre-pass: glass panes on the facade.
const glass = new Set();
for (const c of cellMap.values()) {
  const d = depth.get(key(c.x, c.z));
  if (d !== 0) continue;
  const rel = c.top - c.ground;
  for (let y = c.ground + 1; y < c.top; y++) {
    const h = y - c.ground;
    if (!isWinRow(h, rel)) continue;
    if (isPier(c)) continue;
    if (isEntrance(c) && (h === 1 || h === 2) && c.x === 7) continue; // open door
    if (isEntrance(c) && (h === 1 || h === 2)) { glass.add(`${c.x},${c.z},${y}`); continue; }
    glass.add(`${c.x},${c.z},${y}`);
  }
}

// Main build.
for (const c of cellMap.values()) {
  const { x, z, ground, top } = c;
  const d = depth.get(key(x, z));
  const rel = top - ground;

  // Foundation from y 0 up to the lowest ground under the cell.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y < top; y++) {
    const h = y - ground;
    let b = null;

    if (h === 0) {
      b = "polished_granite"; // base course
    } else if (h >= rel - 2) {
      // Cornice and parapet on the facade; roof deck inside.
      if (d === 0) b = (h === rel - 2) ? "chiseled_quartz_block" : "smooth_quartz";
      else b = "light_gray_concrete";
    } else if (d === 0) {
      if (isEntrance(c) && (h === 1 || h === 2)) {
        // Centre cell is the open doorway; flanking cells are glazed storefront.
        b = (x === 7) ? null : "light_blue_stained_glass_pane";
      } else if (h >= 3 && h % 2 === 1) {
        b = "smooth_quartz"; // floor spandrel
      } else if (isWinRow(h, rel)) {
        b = isPier(c) ? "smooth_quartz" : "light_blue_stained_glass_pane";
      } else {
        b = "smooth_quartz"; // facade stays quartz everywhere on the outside
      }
    } else {
      // Interior: solid core, with air cavities behind facade glass.
      const behindGlass = isWinRow(h, rel) && nb.some(([dx, dz]) => glass.has(`${x + dx},${z + dz},${y}`));
      if (behindGlass) {
        const p = (x * 5 + z * 3 + y) % 6;
        if (p === 0) b = "glowstone";
        else if (p === 3) b = "shroomlight";
        else b = null; // air gap behind the glass
      } else if (d === 1 && x === 7 && h === 1 && isEntrance({ x, z: z - 1 })) {
        b = "lantern"; // lobby light just inside the doorway
      } else {
        b = "light_gray_concrete";
      }
    }

    if (b) g.set(x, y, z, b);
  }

  // Roof plant: 2x2 mechanical enclosures on interior roof cells, one storey high.
  if (d >= 2 && top + 1 <= H - 1 && Math.floor(x / 2) % 4 === 1 && Math.floor(z / 2) % 4 === 1) {
    g.set(x, top, z, "light_gray_concrete");
    g.set(x, top + 1, z, "stone_bricks");
  }
}

g.save(`${DIR}/DC61023.nbt`);
