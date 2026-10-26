import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73451.cells.json`, "utf8"));

// 1775 Pennsylvania Ave NW: mid-century Portland-stone office block on the avenue.
// White concrete walls, quartz-pillar piers, smooth-quartz storey bands, tinted glass
// windows, granite base course, stone parapet, and a contiguous mechanical penthouse.
const W = 14, H = 31, D = 20;
const g = new Voxels([W, H, D]);

const cmap = new Map();
for (const [x, z, gr, roof] of cells) cmap.set(`${x},${z}`, { gr, roof });
const has = (x, z) => cmap.has(`${x},${z}`);

const STORE_H = 3;
const FOUND = "stone_bricks";
const PIER = "quartz_pillar";
const WALL = "white_concrete";
const BAND = "smooth_quartz";
const GLASS = "light_blue_stained_glass";
const BASE = "polished_granite";
const CAP = "smooth_stone";
const ROOF = "smooth_stone";
const WARM = "glowstone";
const PENT = "light_gray_concrete";
const PENT_CAP = "iron_block";

// Per-cell massing: quantise lidar roof height to whole storeys.
const info = [];
for (const [x, z, gr, roof] of cells) {
  const gg = Math.max(0, Math.round(gr));
  const rise = Math.round(roof) - gg;
  const n = Math.max(1, Math.min(6, Math.round(rise / STORE_H)));
  info.push({ x, z, gg, n, top: gg + STORE_H * n });
}
const maxTop = Math.max(...info.map((c) => c.top));

const doorL = Math.floor(W / 2) - 1; // 6
const doorR = Math.floor(W / 2);     // 7

const isPerim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Pass 1: foundations, storey bands, walls, parapet, entrance.
for (const c of info) {
  const { x, z, gg, n, top } = c;

  for (let y = 0; y < gg; y++) g.set(x, y, z, FOUND);

  // Floor slabs at each storey line (horizontal bands) and roof slab at top.
  for (let k = 0; k <= n; k++) {
    const y = gg + STORE_H * k;
    g.set(x, y, z, k === n ? ROOF : BAND);
  }

  if (!isPerim(x, z)) continue;

  const N = !has(x, z - 1);
  const S = !has(x, z + 1);
  const Wd = !has(x - 1, z);
  const E = !has(x + 1, z);
  const corner = (N || S) && (Wd || E);
  const pos = (N || S) ? x : z;
  const pier = corner || pos % 2 === 0;

  for (let k = 0; k < n; k++) {
    for (const r of [gg + STORE_H * k + 1, gg + STORE_H * k + 2]) {
      let id;
      if (k === 0 && r === gg + 1) id = BASE;
      else if (pier) id = PIER;
      else id = GLASS;
      g.set(x, r, z, id);
    }
  }

  // Parapet coping on the roof line.
  g.set(x, top + 1, z, CAP);

  // Entrance on the street (north) face: granite jambs flank a two-high double door.
  if (N && x >= doorL - 1 && x <= doorR + 1) {
    const isDoor = x === doorL || x === doorR;
    if (isDoor) {
      const hinge = x === doorL ? "left" : "right";
      g.set(x, gg + 1, z, "dark_oak_door", {
        facing: "north", half: "lower", hinge, open: "false", powered: "false",
      });
      g.set(x, gg + 2, z, "dark_oak_door", {
        facing: "north", half: "upper", hinge, open: "false", powered: "false",
      });
    } else {
      // Jambs and a lintel course above the doors.
      g.set(x, gg + 1, z, BASE);
      g.set(x, gg + 2, z, BASE);
    }
  }
}

// Entrance lanterns on the street face, mounted on the granite jambs.
for (const c of info) {
  const { x, z, gg } = c;
  if (!isPerim(x, z) || !has(x, z - 1) && x >= doorL - 1 && x <= doorR + 1) {
    // no-op guard
  }
  if (!has(x, z - 1) && (x === doorL - 1 || x === doorR + 1) && z === 0) {
    g.set(x, gg + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 2: warm lights just inside some windows (interior cells only).
for (const c of info) {
  const { x, z, gg, n } = c;
  if (!isPerim(x, z)) continue;
  const N = !has(x, z - 1);
  const S = !has(x, z + 1);
  const Wd = !has(x - 1, z);
  const E = !has(x + 1, z);
  const corner = (N || S) && (Wd || E);
  const pos = (N || S) ? x : z;
  const pier = corner || pos % 2 === 0;
  if (pier || pos % 4 !== 1) continue;

  let ix = x, iz = z;
  if (N) iz = z + 1;
  else if (S) iz = z - 1;
  else if (Wd) ix = x + 1;
  else if (E) ix = x - 1;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;

  for (let k = 1; k < n; k++) {
    g.set(ix, gg + STORE_H * k + 1, iz, WARM);
  }
}

// Pass 3: one contiguous mechanical penthouse on the upper tiers.
for (const c of info) {
  const { x, z, top } = c;
  if (isPerim(x, z)) continue;
  if (top < maxTop - 3) continue;
  if (x < 4 || x > 9 || z < 6 || z > 13) continue;
  g.set(x, top + 1, z, PENT);
  g.set(x, top + 2, z, PENT);
  g.set(x, top + 3, z, PENT_CAP);
}

g.save(`${DIR}/DC73451.nbt`);
