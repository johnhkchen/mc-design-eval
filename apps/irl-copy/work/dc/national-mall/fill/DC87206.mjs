import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${SRC}/DC87206.cells.json`, "utf8"));

const W = 18, H = 31, D = 14;
const g = new Voxels([W, H, D]);

// ---- footprint lookup ----
const cellMap = new Map();
for (const [x, z, ground, roof] of cells) cellMap.set(`${x},${z}`, { x, z, ground, roof });
const has = (x, z) => cellMap.has(`${x},${z}`);
const isInner = (x, z) => has(x, z) && has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
const isPerim = (x, z) => has(x, z) && !isInner(x, z);
const isStreet = (x, z) => isPerim(x, z) && !has(x, z - 1); // z-min face = entrance face

// ---- smooth roof into flat tiers: round, then snap near-mode values to the mode ----
const counts = new Map();
for (const c of cellMap.values()) {
  const r = Math.round(c.roof);
  counts.set(r, (counts.get(r) || 0) + 1);
}
let mode = 0, best = -1;
for (const [r, n] of counts) if (n > best) { best = n; mode = r; }

// ---- entrance: median x of street-face cells ----
const streetXs = [...cellMap.values()].filter(c => isStreet(c.x, c.z)).map(c => c.x).sort((a, b) => a - b);
const doorX = streetXs.length ? streetXs[Math.floor(streetXs.length / 2)] : Math.floor(W / 2);

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const c of cellMap.values()) {
  const { x, z } = c;
  const gr = Math.max(0, Math.round(c.ground));
  let T = Math.round(c.roof);
  if (Math.abs(T - mode) <= 1) T = mode;
  T = Math.min(26, Math.max(T, gr + 8));

  const perim = isPerim(x, z);
  const street = isStreet(x, z);
  const corner = perim && (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
  const lobby = street && Math.abs(x - doorX) <= 1; // recessed entrance bay

  // floor slabs: ground-floor base at gr+4, then every 3 blocks
  const slabRows = new Set();
  for (let yy = gr + 4; yy < T - 2; yy += 3) slabRows.add(yy);

  // foundation (grey granite plinth)
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_granite");

  for (let y = gr; y <= T - 1; y++) {
    // base course / ground slab
    if (y === gr) {
      put(x, y, z, perim ? "polished_granite" : "light_gray_concrete");
      continue;
    }
    // roof deck and parapet
    if (y === T - 1) { put(x, y, z, "smooth_stone"); continue; }
    if (perim && y === T - 2) { put(x, y, z, "white_concrete"); continue; }
    // floor slabs
    if (slabRows.has(y)) {
      put(x, y, z, perim ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (!perim) {
      // interior: structural columns on a grid, warm light behind glass, otherwise air
      if (x % 6 === 0 && z % 6 === 0) { put(x, y, z, "white_concrete"); continue; }
      if (y > gr + 3 && y % 3 === 1 && (x * 3 + z * 5) % 11 === 0) { put(x, y, z, "glowstone"); continue; }
      // hanging lantern in the lobby, under the first slab
      if (y === gr + 3 && x === doorX && z === 1) { put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
      continue;
    }
    // perimeter facade
    const ground = y < gr + 4;
    if (ground && street) {
      if (lobby) {
        // stone surround and recessed glass lobby
        if (y === gr + 3) { put(x, y, z, "stone_bricks"); continue; }
        if (x === doorX && (y === gr + 1 || y === gr + 2)) {
          put(x, y, z, "oak_door", {
            facing: "south", half: y === gr + 1 ? "lower" : "upper",
            hinge: "left", open: "false", powered: "false",
          });
          continue;
        }
        if (x === doorX - 1 || x === doorX + 1) {
          // door jambs as stone; glass lobby sides
          put(x, y, z, (y === gr + 1 || y === gr + 2) ? "stone_bricks" : "stone_bricks");
          continue;
        }
      }
      if (y === gr + 1 || y === gr + 2) {
        if (corner || x % 3 === 0) put(x, y, z, "white_concrete");
        else put(x, y, z, "glass");
      } else if (y === gr + 3) {
        put(x, y, z, "white_concrete"); // transom
      }
      continue;
    }
    // upper floors and non-street walls: window grid with piers
    if (corner || (x + z) % 3 === 0) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass");
  }

  // roof equipment: central penthouse with glazed ring and roof slab
  if (x >= 5 && x <= 12 && z >= 4 && z <= 9) {
    const ring = x === 5 || x === 12 || z === 4 || z === 9;
    for (let y = T; y <= T + 2; y++) {
      if (!ring) continue;
      put(x, y, z, y === T + 1 ? "light_blue_stained_glass" : "light_gray_concrete");
    }
    put(x, T + 3, z, "smooth_stone");
  }
}

g.save(`${SRC}/DC87206.nbt`);
