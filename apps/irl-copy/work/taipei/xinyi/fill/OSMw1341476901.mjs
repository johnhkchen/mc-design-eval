import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341476901";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 19, D = 7;
const g = new Voxels([W, H, D]);

const TOP = 6;          // roof slab level for a building of about 7 blocks
const k = (x, z) => `${x},${z}`;

// Per-cell info: ground, perimeter faces, roof level
const info = new Map();
for (const [x, z, gr] of cells) {
  info.set(k(x, z), { x, z, G: Math.max(0, Math.min(H - 1, gr)) });
}
const has = (x, z) => info.has(k(x, z));

for (const c of info.values()) {
  const { x, z } = c;
  c.faces = [];
  if (!has(x, z - 1)) c.faces.push("N");
  if (!has(x, z + 1)) c.faces.push("S");
  if (!has(x - 1, z)) c.faces.push("W");
  if (!has(x + 1, z)) c.faces.push("E");
  c.perim = c.faces.length > 0;
  c.roofY = Math.max(c.G, TOP);
}

// Front door on the south (max z) face, middle of that run
const southXs = [...info.values()].filter(c => c.faces.includes("S")).map(c => c.x).sort((a, b) => a - b);
const doorX = southXs.length
  ? southXs[Math.floor(southXs.length / 2)]
  : Math.max(...[...info.values()].map(c => c.x));
const doorZ = southXs.length ? 6 : null;

// Is a cell's interior air space free at height y (not foundation, not floor slab, under roof)?
function airAt(x, y, z) {
  const c = info.get(k(x, z));
  if (!c || c.perim) return false;
  if (y < c.G || y >= c.roofY) return false;
  if (y === c.G + 3) return false;
  return true;
}

const set = (x, y, z, b, p) => {
  if (y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

for (const c of info.values()) {
  const { x, z, G, roofY, faces, perim } = c;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) set(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slab at the second-storey line, roof slab, rooftop plant boxes
    if (G + 3 < roofY) set(x, G + 3, z, "smooth_stone");
    set(x, roofY, z, "smooth_stone");
    if ((x + z) % 3 === 0 && roofY + 1 < H) set(x, roofY + 1, z, "light_gray_concrete");
    continue;
  }

  // Perimeter facade bands
  const windowHere = faces.some(f =>
    (f === "N" || f === "S") ? x % 2 === 1 : z % 2 === 1
  );
  const isDoor = z === doorZ && x === doorX;

  for (let y = G; y < roofY; y++) {
    const rel = y - G;
    if (y === roofY - 1 && rel >= 4) {
      set(x, y, z, "smooth_stone");                 // cornice
    } else if (rel === 0) {
      set(x, y, z, "smooth_stone");                 // base course
    } else if (rel <= 2) {
      if (isDoor) {
        set(x, y, z, "dark_oak_door", {
          facing: "south",
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (windowHere) {
        set(x, y, z, "glass");                      // shopfront glass
      } else {
        set(x, y, z, "dark_oak_planks");            // shopfront piers
      }
    } else if (rel === 3) {
      set(x, y, z, "light_gray_concrete");          // spandrel / floor line
    } else {
      set(x, y, z, windowHere ? "glass" : "white_concrete");
    }
  }

  // Parapet on the roof edge
  set(x, roofY + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  set(x, roofY, z, "smooth_stone");
}

// Roof slab across interior cells already set; now warm lights behind some window glass
for (const c of info.values()) {
  if (!c.perim) continue;
  const { x, z, G, roofY, faces } = c;
  const idx = faces.includes("N") || faces.includes("S") ? x : z;
  if (idx % 4 !== 1) continue;
  for (const f of faces) {
    const [ix, iz] = f === "N" ? [x, z + 1] : f === "S" ? [x, z - 1] : f === "W" ? [x + 1, z] : [x - 1, z];
    const ys = [G + 1, G + 4].filter(y => y < roofY - 1);
    for (const y of ys) {
      if (airAt(ix, y, iz)) {
        set(ix, y, iz, "glowstone");
      }
    }
    break;
  }
}

g.save(`${DIR}/${ID}.nbt`);
