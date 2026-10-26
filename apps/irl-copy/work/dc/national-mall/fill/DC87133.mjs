import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87133";

// Baltimore Sun Building / American Bank Building, 1317 F St NW.
// Read as a 1920s Beaux-Arts commercial block: granite base, brick piers,
// white terra-cotta spandrels, stone cornice, six storeys of 3 blocks each.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 8, D = 15, H = 30;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(`${x},${z}`, { gr, rf });
const has = (x, z) => map.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Smooth the lidar roof into one clean flat tier: median of the cell roofs,
// kept at least 6 blocks above the highest ground so the storeys still read.
const rfs = cells.map(c => c[3]).sort((a, b) => a - b);
const grs = cells.map(c => c[2]);
const ROOF = Math.min(H - 4, Math.max(rfs[Math.floor(rfs.length / 2)], Math.max(...grs) + 6));
const PARAPET_TOP = ROOF; // penthouse sits on top of this

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const STOREY = 3;

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const { gr } = map.get(`${x},${z}`);
  const rf = ROOF;
  const fW = !has(x - 1, z), fE = !has(x + 1, z);
  const fN = !has(x, z - 1), fS = !has(x, z + 1);
  const edge = fW || fE || fN || fS;
  const corner = (fW || fE) && (fN || fS);
  const idxAlong = (fW || fE) ? z : x;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Entrance: centred on the north (z = 0) face, ground storey.
  const isDoor = fN && x === 3 && z === 0;

  for (let y = gr; y < rf; y++) {
    const rel = y - gr;
    const l = rel % STOREY;
    const lvl = Math.floor(rel / STOREY);
    const top = y === rf - 1;

    // Floor slabs span the whole footprint at each storey line.
    if (!top && l === 0 && rel > 0) put(x, y, z, "smooth_stone");
    if (rel === 0 && !edge) put(x, y, z, "smooth_stone");

    if (top) {
      put(x, y, z, edge ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (!edge) continue;

    // Entrance door (two blocks tall).
    if (isDoor && lvl === 0 && rel <= 1) {
      put(x, y, z, "oak_door", {
        facing: "north",
        half: rel === 0 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Cornice band just under the roof line.
    if (y === rf - 2) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    if (corner) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    // Pilaster bays: every fourth bay is a stone pier that stands proud
    // of the brick, marked by a stone-brick column on each storey.
    const pier = idxAlong % 4 === 0;

    if (lvl === 0) {
      // Granite base course and shopfront glazing.
      if (rel === 0) { put(x, y, z, "granite"); continue; }
      if (rel === 1) {
        put(x, y, z, idxAlong % 2 === 1 ? "glass_pane" : "granite");
        continue;
      }
      put(x, y, z, "smooth_stone");
      continue;
    }

    if (l === 0) {
      put(x, y, z, "white_terracotta");
    } else if (l === 1) {
      if (pier) put(x, y, z, "stone_bricks");
      else if (idxAlong % 2 === 1) put(x, y, z, "glass_pane");
      else put(x, y, z, "bricks");
    } else {
      put(x, y, z, pier ? "stone_bricks" : "bricks");
    }
  }

  // Warm light behind selected windows, on the interior side of the wall.
  if (edge && !corner && !isDoor) {
    for (let y = gr + 1; y < rf - 2; y++) {
      const rel = y - gr;
      const l = rel % STOREY;
      if (l !== 1) continue;
      if (idxAlong % 4 !== 1) continue;
      const ax = fW ? x + 1 : fE ? x - 1 : x;
      const az = fN ? z + 1 : fS ? z - 1 : z;
      if (has(ax, az) && !isEdge(ax, az)) {
        put(ax, y, az, (Math.floor(rel / STOREY) % 2 === 0) ? "shroomlight" : "glowstone");
      }
    }
  }
}

// Roof penthouse: a setback box of stone walls with a glazed band, sitting on the
// flat roof over the interior core, so it stands on solid roof and floats nothing.
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (x < 2 || x > 5 || z < 5 || z > 9) continue;
  const edgePH = x === 2 || x === 5 || z === 5 || z === 9;
  for (let y = PARAPET_TOP; y < PARAPET_TOP + 3; y++) {
    if (y === PARAPET_TOP + 2) {
      put(x, y, z, "stone_bricks");
    } else if (edgePH) {
      put(x, y, z, (y === PARAPET_TOP + 1 && (x + z) % 2 === 0) ? "glass_pane" : "stone_bricks");
    } else {
      put(x, y, z, "air");
    }
  }
}

// Lantern just inside the entrance.
put(3, (map.get("3,1")?.gr ?? 0) + 1, 1, "lantern", { hanging: "false" });

g.save(`${DIR}/${ID}.nbt`);
