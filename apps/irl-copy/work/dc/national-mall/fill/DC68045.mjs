import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC68045";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 35, H = 32, D = 29;
const YMAX = 28;
const g = new Voxels([W, H, D]);

// ---- footprint model -------------------------------------------------------
const fp = new Map();
for (const [x, z, gr, roof] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const g0 = Math.round(gr);
  const base = g0 + 1;
  const n = Math.max(2, Math.round((roof - base) / 4));
  const top = Math.min(base + 4 * n, YMAX);
  fp.set(`${x},${z}`, { x, z, g0, base, top });
}
const cellAt = (x, z) => fp.get(`${x},${z}`);
const topAt = (x, z) => { const c = cellAt(x, z); return c ? c.top : -1; };

const DIRS = [
  { name: "south", dx: 0, dz: 1, axis: "x" },
  { name: "north", dx: 0, dz: -1, axis: "x" },
  { name: "east", dx: 1, dz: 0, axis: "z" },
  { name: "west", dx: -1, dz: 0, axis: "z" },
];
const facesOf = (c) => DIRS.filter((d) => topAt(c.x + d.dx, c.z + d.dz) < c.top);
const maxTop = Math.max(...[...fp.values()].map((c) => c.top));

// ---- entrance: exposed south face cell nearest the run's midpoint ----------
const southCells = [...fp.values()].filter((c) => facesOf(c).some((f) => f.name === "south"));
let entrName = "south";
if (!southCells.length) {
  entrName = DIRS.find((d) => [...fp.values()].some((c) => facesOf(c).some((f) => f.name === d.name))).name;
}
const entrCells = [...fp.values()].filter((c) => facesOf(c).some((f) => f.name === entrName));
const entrU = (c) => (entrName === "south" || entrName === "north" ? c.x : c.z);
const uVals = entrCells.map(entrU);
const entrMidU = uVals.length ? (Math.min(...uVals) + Math.max(...uVals)) / 2 : 0;
const entrCell = entrCells.reduce(
  (best, c) => (best === null || Math.abs(entrU(c) - entrMidU) < Math.abs(entrU(best) - entrMidU) ? c : best),
  null
);
const entrKey = entrCell ? `${entrCell.x},${entrCell.z}` : null;

const paneProps = (f) =>
  f.axis === "x"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- pass 1: foundations, interiors, facades -------------------------------
for (const c of fp.values()) {
  for (let y = 0; y <= c.g0; y++) g.set(c.x, y, c.z, "stone_bricks");

  const fs = facesOf(c);
  if (!fs.length) {
    for (let y = c.base; y <= c.top; y += 4) g.set(c.x, y, c.z, "light_gray_concrete");
    g.set(c.x, c.top, c.z, "light_gray_concrete");
    continue;
  }

  const f = fs[0]; // priority: south, north, east, west
  const uu = f.axis === "x" ? c.x : c.z;
  const isEntrCell = c === entrCell && f.name === entrName;

  for (let y = c.base; y < c.top; y++) {
    const k = Math.floor((y - c.base) / 4);
    const ly = (y - c.base) % 4;
    const pier = uu % 3 === 0;

    if (isEntrCell && k === 0 && ly === 0) {
      g.set(c.x, y, c.z, "dark_oak_door", { facing: f.name, half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isEntrCell && k === 0 && ly === 1) {
      g.set(c.x, y, c.z, "dark_oak_door", { facing: f.name, half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (ly === 0) {
      // base course on ground storey, spandrel above
      g.set(c.x, y, c.z, k === 0 ? "polished_granite" : "light_gray_concrete");
      continue;
    }
    if (ly === 3) {
      // header band: granite cornice course on the top storey, quartz elsewhere
      const topStorey = y >= c.top - 4;
      g.set(c.x, y, c.z, topStorey ? "polished_granite" : "smooth_quartz");
      continue;
    }
    if (isEntrCell && k === 0 && ly === 2) {
      g.set(c.x, y, c.z, "smooth_quartz");
      continue;
    }
    if (pier) {
      g.set(c.x, y, c.z, k === 0 ? "stone_bricks" : "white_concrete");
    } else {
      g.set(c.x, y, c.z, "light_blue_stained_glass_pane", paneProps(f));
    }
  }

  // Roof layer and parapet.
  g.set(c.x, c.top, c.z, "light_gray_concrete");
  g.set(c.x, c.top + 1, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// ---- pass 2: lobby lights flanking the entrance, and window lanterns -------
if (entrCell) {
  const f = DIRS.find((d) => d.name === entrName);
  const ex = entrCell.x - f.dx, ez = entrCell.z - f.dz;
  const side = f.axis === "x" ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
  for (const [sx, sz] of side) {
    const ic = cellAt(ex + sx, ez + sz);
    if (ic && ic.top > entrCell.base + 2 && !facesOf(ic).length) {
      g.set(ic.x, entrCell.base + 1, ic.z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}
for (const c of fp.values()) {
  const fs = facesOf(c);
  if (!fs.length) continue;
  const f = fs[0];
  const uu = f.axis === "x" ? c.x : c.z;
  for (let k = 1; c.base + 4 * k + 1 < c.top; k++) {
    const y = c.base + 4 * k + 1;
    if (uu % 3 === 0 || uu % 9 !== 5) continue;
    const ic = cellAt(c.x - f.dx, c.z - f.dz);
    if (!ic || ic.top <= y || facesOf(ic).length) continue;
    g.set(ic.x, y, ic.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// ---- pass 3: roof plant on the tallest interior cells ----------------------
for (const c of fp.values()) {
  if (facesOf(c).length || c.top !== maxTop) continue;
  if (c.x % 8 !== 4 || c.z % 6 !== 3) continue;
  g.set(c.x, c.top + 1, c.z, "gray_concrete");
  g.set(c.x, c.top + 2, c.z, "gray_concrete");
  g.set(c.x, c.top + 3, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
