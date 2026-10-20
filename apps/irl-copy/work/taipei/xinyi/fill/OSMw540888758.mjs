// Era: 1980s-90s Xinyi-style commercial block, two storeys on a common flat roof.
// Stone plinth, light-gray concrete pillars, beige tile lintels, blue-glass shopfronts
// on the ground storey and window bays above. Roof deck at B+10, parapet to B+11.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888758";
const W = 24, H = 23, D = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"))
  .map(([x, z, gr]) => [x, z, Math.round(gr)]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));

const B = Math.min(...cells.map((c) => c[2]));   // lowest ground
const ROOF = B + 10;                              // roof deck top layer
const PAR = ROOF + 1;                             // parapet / roof plant layer

const DIRS = {
  N: { dx: 0, dz: -1, facing: "north" },
  S: { dx: 0, dz: 1, facing: "south" },
  W: { dx: -1, dz: 0, facing: "west" },
  E: { dx: 1, dz: 0, facing: "east" },
};
const ORDER = ["N", "S", "W", "E"];
const missing = (x, z, d) => !has(x + DIRS[d].dx, z + DIRS[d].dz);
const isEdge = (x, z) => ORDER.some((d) => missing(x, z, d));
const primaryFace = (x, z) => ORDER.find((d) => missing(x, z, d));
const alongU = (x, z, d) => (d === "N" || d === "S" ? x : z);

// Row and column extents of the footprint (for bay rhythm along each face).
const rowR = new Map(), colR = new Map();
for (const [x, z] of cells) {
  const r = rowR.get(z) ?? [x, x];
  rowR.set(z, [Math.min(r[0], x), Math.max(r[1], x)]);
  const c = colR.get(x) ?? [z, z];
  colR.set(x, [Math.min(c[0], z), Math.max(c[1], z)]);
}

// Main entrance: the face direction with the most exposed cells (ties favour N/S).
const counts = Object.fromEntries(ORDER.map((d) => [d, cells.filter(([x, z]) => missing(x, z, d)).length]));
let doorDir = "S";
for (const d of ["S", "N", "E", "W"]) if (counts[d] > counts[doorDir]) doorDir = d;
const cand = cells.filter(([x, z]) => missing(x, z, doorDir));
const candU = cand.map(([x, z]) => alongU(x, z, doorDir));
const center = (Math.min(...candU) + Math.max(...candU)) / 2;
const doorCell = cand.reduce((best, c) =>
  Math.abs(alongU(c[0], c[1], doorDir) - center) < Math.abs(alongU(best[0], best[1], doorDir) - center) ? c : best);
const doorKey = key(doorCell[0], doorCell[1]);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  // Foundation and plinth below the ground line.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (gr >= ROOF) continue;

  const edge = isEdge(x, z);

  // Storey floor levels: ground, then every 5 blocks above the lowest ground.
  const levels = [gr];
  for (let k = 1; B + 5 * k < ROOF; k++) if (B + 5 * k > gr) levels.push(B + 5 * k);
  const levelSet = new Set(levels);

  const corner = ["N", "S"].some((d) => missing(x, z, d)) && ["W", "E"].some((d) => missing(x, z, d));
  const d = primaryFace(x, z);

  for (let y = gr; y < ROOF; y++) {
    if (levelSet.has(y)) { put(x, y, z, "light_gray_concrete"); continue; } // floor slab
    if (!edge) continue;                                                    // interior air

    let a = gr;
    for (const L of levels) if (L < y) a = L;
    const b = levels.find((L) => L > y) ?? ROOF;
    const h = b - a - 1;       // wall rows in this storey
    const rel = y - a;         // 1-based row within storey
    const first = a === gr;

    const [lo, hi] = (d === "N" || d === "S") ? rowR.get(z) : colR.get(x);
    const u = alongU(x, z, d);
    const pillar = corner || (u - lo) % 3 === 0 || u === hi;

    // Door and entrance light on the main face, ground storey only.
    const isDoor = first && key(x, z) === doorKey && h >= 3;
    if (isDoor && rel <= 2) {
      put(x, y, z, "dark_oak_door", {
        facing: DIRS[doorDir].facing,
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoor && rel === 3 && h >= 4) {
      put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }

    let id;
    if (pillar) id = "light_gray_concrete";
    else if (rel === h) id = "white_terracotta";          // lintel / spandrel
    else if (rel === 1 && h >= 2) id = "smooth_stone";    // sill / base course
    else id = "light_blue_stained_glass";                 // glazing

    // Warm light just inside some windows.
    if (!pillar && id === "light_blue_stained_glass" && rel > 1 && rel < h && (u + y) % 5 === 0) {
      const ix = x - DIRS[d].dx, iz = z - DIRS[d].dz;
      if (has(ix, iz) && !isEdge(ix, iz) && gAt(ix, iz) < y) put(ix, y, iz, "shroomlight");
    }

    put(x, y, z, id);
  }

  // Roof: cornice and parapet on the edge, deck and plant inboard.
  if (edge) {
    put(x, ROOF, z, "smooth_stone");
    put(x, PAR, z, "stone_bricks");
  } else {
    put(x, ROOF, z, "light_gray_concrete");
    if ((x * 7 + z * 3) % 11 === 0) put(x, PAR, z, "iron_block"); // roof plant
  }
}

g.save(`${DIR}/${ID}.nbt`);
