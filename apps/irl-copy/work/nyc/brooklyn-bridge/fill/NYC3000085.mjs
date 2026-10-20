import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000085";
const W = 17, H = 40, D = 10;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const arr = Array.isArray(raw) ? raw : raw.cells;

// ---- cell map: ground g (absolute y), lidar roof r (absolute y) ----
const cm = new Map();
for (const [x, z, g, r] of arr) {
  cm.set(`${x},${z}`, { x, z, g: Math.round(g), r: Math.round(r) });
}
const cell = (x, z) => cm.get(`${x},${z}`);
const cells = [...cm.values()];
const Gmin = Math.min(...cells.map(c => c.g));
const p = Gmin & 1;                 // storey lines share the parity of the lowest ground
const isBase = y => ((y - p) & 1) === 0;
const capT = p === 0 ? 38 : 37;     // leaves room for roof plant up to y 39

const med = a => { const s = [...a].sort((u, v) => u - v); return s[s.length >> 1]; };

// smooth lidar roof with a 3x3 median, then snap to storey lines
for (const c of cells) {
  const rs = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = cell(c.x + dx, c.z + dz);
    if (n) rs.push(n.r);
  }
  const r = med(rs);
  let T = Math.round((r - p) / 2) * 2 + p;
  T = Math.max(T, c.g + 6);
  if ((T - p) & 1) T += 1;
  T = Math.min(T, capT);
  c.T = T;
}

const SIDES = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const exposedSides = (c, y) => {
  const out = [];
  SIDES.forEach(([dx, dz], i) => {
    const n = cell(c.x + dx, c.z + dz);
    if (!n || (n.T <= y && y >= n.g)) out.push(i);
  });
  return out;
};
const isPerim = c => SIDES.some(([dx, dz]) => !cell(c.x + dx, c.z + dz));

const front = cells.filter(c => c.z === 0);
const doorX = front.length ? (() => {
  const mx = med(front.map(c => c.x));
  return front.reduce((a, b) => (Math.abs(b.x - mx) < Math.abs(a.x - mx) ? b : a)).x;
})() : -1;

const vox = new Voxels([W, H, D]);

// ---- main massing ----
for (const c of cells) {
  const { x, z, g, T } = c;
  for (let y = 0; y < g; y++) vox.set(x, y, z, "stone_bricks");   // foundation

  const perim = isPerim(c);
  for (let y = g; y < T; y++) {
    const ex = exposedSides(c, y);
    let blk = null;
    if (y === T - 1) {
      blk = perim ? "stone_bricks" : "stone";                    // parapet / roof deck
    } else if (y === T - 2 && perim) {
      blk = "stone_bricks";                                      // cornice course
    } else if (isBase(y)) {
      if (y === g && ex.length) blk = "stone_bricks";            // base course
      else if (ex.length) blk = "smooth_stone";                  // string course / sill
      else blk = "stone";                                        // floor slab
    } else if (ex.length) {
      const i = ex.find(k => !cell(x + SIDES[k][0], z + SIDES[k][1])) ?? ex[0];
      const along = SIDES[i][0] !== 0 ? z : x;
      const isFront = i === 0;
      if (isFront && y <= g + 2) {
        // two-storey shopfront: glazed bays framed by dark oak piers
        blk = (along % 4 === 0) ? "dark_oak_planks" : "glass";
      } else if (along % 4 === 0) {
        blk = "stone_bricks";                                    // pier
      } else if (along % 4 === 2) {
        blk = "bricks";                                          // mullion-width brick
      } else {
        blk = "glass";                                           // window pane
      }
    }
    if (blk) vox.set(x, y, z, blk);
  }
}

// ---- shopfront lintel and canopy over the street face ----
for (const c of front) {
  const { x, g, T } = c;
  if (g + 3 < T - 2) vox.set(x, g + 3, 0, "smooth_stone");     // lintel course
}

// ---- warm light behind some windows (interior air gap), sparse rhythm ----
for (const c of cells) {
  const { x, z, g, T } = c;
  for (let y = g; y < T - 2; y++) {
    if (isBase(y)) continue;
    const ex = exposedSides(c, y);
    if (!ex.length) continue;
    const i = ex.find(k => !cell(x + SIDES[k][0], z + SIDES[k][1])) ?? ex[0];
    const along = SIDES[i][0] !== 0 ? z : x;
    if (i === 0 && y <= g + 2) continue;
    if (along % 4 !== 1) continue;
    if ((along + y) % 6 !== 1) continue;
    const ix = x - SIDES[i][0], iz = z - SIDES[i][1];
    const inner = cell(ix, iz);
    if (inner && inner.g <= y && y < inner.T - 2 && !isBase(y)) {
      vox.set(ix, y, iz, "glowstone");
    }
  }
}

// ---- entrance on the street face (z = 0) ----
const door = front.find(c => c.x === doorX);
if (door) {
  const dx = door.x, gd = door.g;
  // clear any pier at the door position, then place a two-high door
  vox.set(dx, gd + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  vox.set(dx, gd + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // canopy over the entrance, projecting from the lintel line
  if (gd + 3 < door.T - 2) {
    for (const o of [-1, 0, 1]) {
      if (cell(dx + o, 0)) {
        vox.set(dx + o, gd + 3, 0, "dark_oak_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
      }
    }
  }
  // lanterns flanking the door at the shopfront
  for (const o of [-2, 2]) {
    if (cell(dx + o, 0)) vox.set(dx + o, gd + 1, 0, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// ---- roof plant on interior roof cells ----
for (const c of cells) {
  if (isPerim(c)) continue;
  if (c.x % 5 === 2 && c.z % 4 === 1 && c.T + 1 <= 39) {
    vox.set(c.x, c.T, c.z, "light_gray_concrete");
    vox.set(c.x, c.T + 1, c.z, "light_gray_concrete");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
