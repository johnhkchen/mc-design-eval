import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw503496499";
const W = 121, H = 23, D = 89;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Lookup of footprint: "x,z" -> ground y
const ground = new Map();
let sx = 0, n = 0;
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, Math.round(gy));
  sx += x; n++;
}
const cx = Math.round(sx / n); // centroid x, used to centre the entrance

const has = (x, z) => ground.has(`${x},${z}`);
const gy = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);

// Safe setter: skips anything outside the volume
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance openings: centred on the north and south faces (open z-edges)
function isEntrance(x, z) {
  const northOrSouthEdge = !has(x, z - 1) || !has(x, z + 1);
  return northOrSouthEdge && Math.abs(x - cx) <= 6;
}

for (const [key, base] of ground) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);

  // Foundation: solid from y 0 up to the cell's ground (downhill cells show extra storeys)
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Base course / floor slab at ground level
  put(x, base, z, perim ? "polished_granite" : "smooth_stone");

  // Floor slab for storey 2 (interior air gap sits above it)
  if (!perim) put(x, base + 5, z, "smooth_stone");

  if (perim) {
    const mull = (x + z) % 4 === 0;
    const entr = isEntrance(x, z);

    // Storey 1 (ground floor): shopfront glass with mullions, entrance openings
    for (let dy = 1; dy <= 4; dy++) {
      const y = base + dy;
      if (entr && dy <= 3) {
        put(x, y, z, "air"); // entrance opening
        continue;
      }
      if (dy === 4) {
        put(x, y, z, "white_concrete"); // lintel / transom
      } else if (mull) {
        put(x, y, z, "white_concrete"); // mullion
      } else {
        put(x, y, z, "glass");
      }
    }

    // Canopy over entrance: stone lintel course above the opening, glowing lanterns
    if (entr) {
      put(x, base + 4, z, "smooth_stone");
      if ((x + z) % 3 === 0) {
        put(x, base + 3, z, "lantern", { hanging: "true" });
      }
    }

    // Storey line
    put(x, base + 5, z, "smooth_stone");

    // Storey 2: window grid of glass panes with frames, warm light in some windows
    for (let dy = 6; dy <= 9; dy++) {
      const y = base + dy;
      if (mull) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane");
      }
    }

    // Cornice and parapet
    put(x, base + 10, z, "smooth_stone");
    put(x, base + 11, z, "white_concrete");
  } else {
    // Interior roof slab at top of storey 2
    put(x, base + 10, z, "smooth_stone");

    // Warm light just inside the glazing on some interior cells, lit at dusk
    if ((x * 7 + z * 13) % 11 === 0) {
      put(x, base + 2, z, "shroomlight");
    }
  }

  // Roof slab for the whole footprint (perimeter cells also get the roof)
  if (perim) put(x, base + 10, z, "smooth_stone");
}

// Roof equipment: glass skylights (3x3 footprints fully inside the footprint)
for (const [key, base] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (x % 14 !== 7 || z % 14 !== 7) continue;
  let ok = true;
  for (let dx = -1; dx <= 1 && ok; dx++)
    for (let dz = -1; dz <= 1 && ok; dz++)
      if (!has(x + dx, z + dz) || isPerim(x + dx, z + dz)) ok = false;
  if (!ok) continue;
  // Curb and glazed cap
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      put(x + dx, base + 11, z + dz, "white_concrete");
      if (dx === 0 && dz === 0) put(x, base + 12, z, "lantern", { hanging: "false" });
      else put(x + dx, base + 12, z + dz, "light_gray_stained_glass");
    }
}

g.save(`${DIR}/${ID}.nbt`);
