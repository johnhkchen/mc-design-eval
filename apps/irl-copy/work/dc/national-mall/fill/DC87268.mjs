import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Union Trust Company, 750 15th St NW (Commercial-Office-Large).
// c.1906-1915 Beaux-Arts commercial block: granite base, calcite piers, stone-brick
// spandrels, chiseled cornice, flat stone cap, central stone penthouse.
// Six storeys; one flat roof level smoothed from the lidar.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87268";
const W = 19, H = 32, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const fp = new Map();
for (const [x, z, gr, rr] of cells) fp.set(`${x},${z}`, { g: gr, r: rr });
const has = (x, z) => fp.has(`${x},${z}`);
const Gmin = Math.min(...cells.map((c) => c[2]));

// Smooth the lidar roof into one flat tier: median roof, never below any ground + 4.
const sortedRoofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const medianRoof = sortedRoofs[Math.floor(sortedRoofs.length / 2)];
const maxGround = Math.max(...cells.map((c) => c[2]));
const RF = Math.max(Math.round(medianRoof), maxGround + 4);
const Rmax = RF;

const set = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Exterior faces of a footprint cell. N = -z side, S = +z side, W = -x, E = +x.
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

const TF = (b) => (b ? "true" : "false");
// Pane connection props: connect only toward neighbouring glass in the same bay.
function paneProps(ns, plus, minus) {
  if (ns) return { north: "false", south: "false", east: TF(plus), west: TF(minus), waterlogged: "false" };
  return { east: "false", west: "false", north: TF(minus), south: TF(plus), waterlogged: "false" };
}
// Sparse warm lights: a few windows per elevation, not a speckle.
const litAt = (x, y, z) => (x * 31 + z * 17 + y * 7) % 29 === 0;

// Entrance: the street-side cell (minimum z) nearest the middle of the frontage.
const nz = Math.min(...cells.map((c) => c[1]));
const entranceCell = cells
  .filter((c) => c[1] === nz)
  .sort((a, b) => Math.abs(a[0] - 9) - Math.abs(b[0] - 9))[0];

// ---- Shell: foundation, walls, floors, cornice, flat roof ----
for (const [x, z, gr] of cells) {
  const R = RF;
  const fc = faces(x, z);
  const per = fc.length > 0;
  const multi = fc.length > 1;
  const ns = per && (fc[0] === "N" || fc[0] === "S");
  const t = ns ? x : z;

  // Foundation solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "granite");

  for (let y = gr; y < R; y++) {
    const rel = y - Gmin;

    // Flat stone roof cap over every footprint cell.
    if (y === R - 1) { set(x, y, z, "smooth_stone"); continue; }

    // Interior: only floor slabs, the rest is air (no interiors).
    if (!per) {
      if (rel === 0 || (rel >= 3 && (rel - 3) % 3 === 0)) set(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter cornice course.
    if (y === R - 2) { set(x, y, z, "chiseled_stone_bricks"); continue; }

    const pier = multi || t % 3 === 0;

    // Granite base course.
    if (rel === 0) { set(x, y, z, "polished_granite"); continue; }

    // Storey spandrels (stone brick) and calcite piers give the facade relief.
    const s = rel < 3 ? 1 : (rel - 3) % 3;
    if (rel >= 3 && s === 0) { set(x, y, z, "stone_bricks"); continue; }
    if (pier) { set(x, y, z, "calcite"); continue; }

    // Window / shopfront pane with frame logic.
    const plus = t % 3 === 1;
    const minus = t % 3 === 2;
    if (s === 1 && litAt(x, y, z)) {
      set(x, y, z, "glowstone");
    } else {
      set(x, y, z, "light_blue_stained_glass_pane", paneProps(ns, plus, minus));
    }
  }
}

// ---- Entrance: dark doors under a stone lintel with calcite flanks ----
{
  const [ex, ez, egr] = entranceCell;
  const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  set(ex, egr, ez, "dark_oak_door", doorProps("lower"));
  set(ex, egr + 1, ez, "dark_oak_door", doorProps("upper"));
  for (let dx = -2; dx <= 2; dx++) {
    const cx = ex + dx;
    if (!has(cx, ez)) continue;
    const cg = fp.get(`${cx},${ez}`).g;
    set(cx, cg + 2, ez, "chiseled_stone_bricks");
  }
  for (const dx of [-1, 1]) {
    if (!has(ex + dx, ez)) continue;
    const cg = fp.get(`${ex + dx},${ez}`).g;
    set(ex + dx, cg, ez, "calcite");
    set(ex + dx, cg + 1, ez, "calcite");
  }
}

// ---- Central penthouse on the flat roof: solid stone core with a glazed ring ----
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (x < 4 || x > 14 || z < 5 || z > 15) continue;
  const R = RF;
  const ring = x === 4 || x === 14 || z === 5 || z === 15;
  for (let y = R; y < Rmax; y++) set(x, y, z, "calcite");
  for (let y = Rmax; y <= Rmax + 1; y++) {
    if (!ring) { set(x, y, z, "calcite"); continue; }
    const cornerP = (x === 4 || x === 14) && (z === 5 || z === 15);
    const nsP = z === 5 || z === 15;
    const tt = nsP ? x : z;
    const ph = (tt - 4) % 3;
    if (cornerP || ph === 0) { set(x, y, z, "calcite"); continue; }
    if (litAt(x, y, z)) set(x, y, z, "glowstone");
    else set(x, y, z, "light_blue_stained_glass_pane", paneProps(nsP, ph === 1, ph === 2));
  }
  set(x, Rmax + 2, z, ring ? "chiseled_stone_bricks" : "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
