import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1082019";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 26, D = 5;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const cellMap = new Map();
for (const [x, z, gr, roof] of cells) cellMap.set(`${x},${z}`, { g: gr, r: roof });
const inFp = (x, z) => cellMap.has(`${x},${z}`);

const med = (a) => {
  const s = [...a].sort((p, q) => p - q);
  return s[Math.floor(s.length / 2)];
};

// One datum ground and one roof for clean flat tiers.
const G = med(cells.map((c) => c[2]));
const T = Math.min(H - 4, Math.round(med(cells.map((c) => c[3])))); // roof cap y

// Storey floor levels: 3-block ground floor, then 2-block storeys.
const levels = new Set([G]);
for (let f = G + 3; f <= T - 3; f += 2) levels.add(f);

function rowKind(y) {
  if (levels.has(y)) return "floor";
  if (y >= G + 1 && y <= G + 2) return "shop";
  if (levels.has(y - 1)) return "win";
  return "brick";
}

// ---- cell records -----------------------------------------------------------
const info = [];
const at = new Map();
for (const [x, z, gc] of cells) {
  const faces = [];
  if (!inFp(x, z - 1)) faces.push("N");
  if (!inFp(x, z + 1)) faces.push("S");
  if (!inFp(x - 1, z)) faces.push("W");
  if (!inFp(x + 1, z)) faces.push("E");
  const c = { x, z, gc, faces, perim: faces.length > 0, corner: faces.length >= 2 };
  info.push(c);
  at.set(`${x},${z}`, c);
}

// 1. Foundation: solid from y0 up to each cell's ground.
for (const c of info) {
  for (let y = 0; y < c.gc; y++) g.set(c.x, y, c.z, "polished_granite");
}

// 2. Perimeter walls, belt courses, windows and shopfront.
for (const c of info) {
  if (!c.perim) continue;
  const onNS = c.faces.includes("N") || c.faces.includes("S");
  const u = onNS ? c.x : c.z;
  for (let y = c.gc; y <= T - 2; y++) {
    const k = rowKind(y);
    let mat;
    if (k === "floor") mat = "smooth_stone";
    else if (k === "shop") {
      // Wide glass shopfront with granite piers every third bay.
      mat = (c.corner || u % 3 === 0) ? "polished_granite" : "glass_pane";
    } else if (k === "win") {
      mat = (!c.corner && u % 2 === 1) ? "glass_pane" : "bricks";
    } else {
      mat = "bricks";
    }
    g.set(c.x, y, c.z, mat);
  }
  // Projecting-looking cornice band and a parapet above the roof line.
  if (T - 1 >= c.gc) g.set(c.x, T - 1, c.z, "smooth_quartz");
  g.set(c.x, T + 1, c.z, "brick_wall");
}

// 3. Interior: ground slab and storey floors (air between).
for (const c of info) {
  if (c.perim) continue;
  g.set(c.x, c.gc, c.z, "smooth_stone");
  for (const f of levels) {
    if (f >= c.gc && f < T) g.set(c.x, f, c.z, "smooth_stone");
  }
}

// 4. Warm lights behind some windows.
for (const c of info) {
  if (!c.perim || c.corner) continue;
  const onNS = c.faces.includes("N") || c.faces.includes("S");
  const u = onNS ? c.x : c.z;
  let dx = 0, dz = 0;
  if (c.faces.includes("N")) dz = 1;
  else if (c.faces.includes("S")) dz = -1;
  else if (c.faces.includes("W")) dx = 1;
  else if (c.faces.includes("E")) dx = -1;
  const ic = at.get(`${c.x + dx},${c.z + dz}`);
  if (!ic || ic.perim) continue;
  for (let y = c.gc; y <= T - 2; y++) {
    const k = rowKind(y);
    if (y < ic.gc + 1) continue;
    if (k === "shop" && (u + y) % 3 === 0) g.set(ic.x, y, ic.z, "glowstone");
    if (k === "win" && (u + y) % 4 === 0) g.set(ic.x, y, ic.z, "shroomlight");
  }
}

// 5. Roof cap over the whole footprint.
for (const c of info) g.set(c.x, T, c.z, "stone");

// 6. Roof penthouse on the central interior cells, if the footprint allows a 2x2 block.
const pent = [[2, 2], [3, 2], [2, 3], [3, 3]];
if (pent.every(([x, z]) => at.get(`${x},${z}`) && !at.get(`${x},${z}`).perim)) {
  for (const [x, z] of pent) {
    g.set(x, T + 1, z, "bricks");
    g.set(x, T + 2, z, "smooth_quartz");
  }
}

// 7. Entrance on the street (north) face: granite frame, door, lit transom.
const northCells = info.filter((c) => c.faces.includes("N") && !c.corner);
if (northCells.length) {
  const xs = northCells.map((c) => c.x).sort((a, b) => a - b);
  const doorX = xs[Math.floor(xs.length / 2)];
  const dc = northCells.reduce((best, c) =>
    Math.abs(c.x - doorX) < Math.abs(best.x - doorX) ? c : best);
  if (dc.gc <= G + 1 && G + 3 < T) {
    // Granite jambs beside the door, on both shop rows.
    for (const dxn of [-1, 1]) {
      const jc = at.get(`${dc.x + dxn},${dc.z}`);
      if (jc && jc.perim) {
        for (const y of [G + 1, G + 2]) g.set(jc.x, y, jc.z, "polished_granite");
      }
    }
    g.set(dc.x, G + 1, dc.z, "dark_oak_door",
      { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(dc.x, G + 2, dc.z, "dark_oak_door",
      { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Lit lantern just inside the entrance transom.
    const inside = at.get(`${dc.x},${dc.z + 1}`);
    if (inside && !inside.perim) g.set(inside.x, G + 2, inside.z, "lantern");
  }
}

g.save(`${DIR}/${ID}.nbt`);
