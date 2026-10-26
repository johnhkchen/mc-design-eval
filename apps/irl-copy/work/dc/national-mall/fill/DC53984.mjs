import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC53984.cells.json`, "utf8"));

const W = 21, H = 29, D = 15;
const g = new Voxels([W, H, D]);

// ---- footprint model -------------------------------------------------------
const key = (x, z) => x + "," + z;
const fp = new Map();
for (const [x, z, gr, rf] of cells) fp.set(key(x, z), { x, z, gr: Math.round(gr), rf: Number(rf) });
const inFp = (x, z) => fp.has(key(x, z));

function faces(x, z) {
  const f = [];
  if (!inFp(x, z - 1)) f.push("north");
  if (!inFp(x, z + 1)) f.push("south");
  if (!inFp(x - 1, z)) f.push("west");
  if (!inFp(x + 1, z)) f.push("east");
  return f;
}

const list = [...fp.values()];

// ---- massing: one main roof, with clear setbacks only --------------------
// Median lidar roof is the main cornice line. Cells a few blocks higher stay
// as towers; cells well below it become lower wings. Small noise is absorbed.
const sorted = list.map(c => c.rf).sort((a, b) => a - b);
const mainRoof = sorted[Math.floor(sorted.length / 2)];
const MAX_TOP = H - 4;

for (const c of list) {
  let target;
  if (c.rf >= mainRoof + 3) target = c.rf;         // tower / setback above main line
  else if (c.rf <= mainRoof - 6) target = c.rf;    // genuine lower wing
  else target = mainRoof;                          // lidar noise: snap to main cornice
  let nst = Math.round((target - c.gr) / 4);
  nst = Math.max(2, Math.min(8, nst));             // at least 2 storeys for a museum
  while (nst > 1 && c.gr + 4 * nst > MAX_TOP) nst--;
  c.nst = nst;
  c.top = c.gr + 4 * nst;
}

// ---- entrance: north (min z) face, nearest the centre line ----------------
const minZ = Math.min(...list.map(c => c.z));
const northRow = list.filter(c => c.z === minZ);
const entr = northRow.reduce((a, b) => (Math.abs(b.x - 10) < Math.abs(a.x - 10) ? b : a));
const ex = entr.x, ez = entr.z;

// ---- build shell ------------------------------------------------------------
for (const c of list) {
  const { x, z, gr, nst, top } = c;
  const f = faces(x, z);
  const per = f.length > 0;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= top; y++) {
    const rel = y - gr;
    const cap = rel === 4 * nst;
    const r = rel % 4;

    if (cap) {
      if (!per) g.set(x, y, z, "gray_concrete");
      else if (((x + z) & 1) === 0) g.set(x, y, z, "quartz_block");
      else g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    if (!per) {
      if (r === 0 || r === 3) g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }
    if (r === 0) { g.set(x, y, z, "smooth_stone"); continue; }
    if (r === 3) {
      // cornice band: quartz dentils over a smooth stone course
      g.set(x, y, z, ((x + z) & 1) === 0 ? "quartz_block" : "smooth_stone");
      continue;
    }

    // window band (r = 1, 2)
    const along = (f[0] === "north" || f[0] === "south") ? x : z;
    const windowable = f.length === 1 && along % 3 !== 0;
    if (windowable) {
      const ns = f[0] === "north" || f[0] === "south";
      g.set(x, y, z, "glass_pane", {
        north: ns ? "false" : "true",
        south: ns ? "false" : "true",
        east: ns ? "true" : "false",
        west: ns ? "true" : "false",
        waterlogged: "false",
      });
    } else {
      // piers: a quartz pilaster with a recessed stone_brick panel on the upper row
      g.set(x, y, z, r === 1 ? "quartz_pillar" : "quartz_block", r === 1 ? { axis: "y" } : undefined);
    }
  }
}

// ---- rooftop pavilion over the core (a stepped penthouse) ------------------
const cx = 10, cz = 7;
for (const c of list) {
  const { x, z, top, nst } = c;
  const d = Math.max(Math.abs(x - cx), Math.abs(z - cz));
  if (d > 3) continue;
  if (top + 2 > H - 1) continue;
  const h = d <= 1 ? 2 : 1;
  for (let k = 0; k < h; k++) {
    const y = top + k;
    if (k === 0) {
      g.set(x, y, z, d <= 1 ? "smooth_stone" : "quartz_block");
    } else {
      // rooftop penthouse: glass on the outer ring, lit core
      if (d === 1) g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      else g.set(x, y, z, "quartz_block");
    }
  }
}

// ---- entrance: canopy, quartz surround, double door, lintel light -----------
const eb = entr.gr;
g.set(ex, eb + 1, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex, eb + 2, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dx of [-2, -1, 1, 2]) {
  if (inFp(ex + dx, ez)) {
    g.set(ex + dx, eb + 1, ez, "quartz_block");
    g.set(ex + dx, eb + 2, ez, "quartz_block");
  }
}
// canopy: dark oak upside-down stairs projecting over the door bay
for (const dx of [-2, -1, 0, 1, 2]) {
  if (inFp(ex + dx, ez)) {
    g.set(ex + dx, eb + 3, ez, "dark_oak_stairs", {
      facing: "south", half: "top", shape: "straight", waterlogged: "false",
    });
  }
}
// steps and a lit lantern-pair flanking the door
for (const dx of [-2, 2]) {
  if (inFp(ex + dx, ez)) g.set(ex + dx, eb + 1, ez, "lantern", { hanging: "false", waterlogged: "false" });
}
g.set(ex, eb + 4, ez, "glowstone");

// ---- warm light behind some glass -------------------------------------------
for (const c of list) {
  const { x, z, gr, nst } = c;
  const f = faces(x, z);
  if (f.length !== 1) continue;
  if (x === ex && z === ez) continue;
  const side = f[0];
  const ix = side === "west" ? x + 1 : side === "east" ? x - 1 : x;
  const iz = side === "north" ? z + 1 : side === "south" ? z - 1 : z;
  if (!inFp(ix, iz)) continue;
  for (let s = 0; s < nst; s++) {
    const along = (side === "north" || side === "south") ? x : z;
    if (along % 3 === 0) continue;
    if (((x * 5 + z * 3 + s * 7) % 4) !== 0) continue;
    g.set(ix, gr + 4 * s + 1, iz, "glowstone");
  }
}

g.save(`${DIR}/DC53984.nbt`);
