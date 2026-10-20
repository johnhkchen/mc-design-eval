import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339401654";
const W = 27, H = 24, D = 86;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and bounds
const key = (x, z) => `${x},${z}`;
const inFp = new Set(cells.map(([x, z]) => key(x, z)));
const minX = Math.min(...cells.map(c => c[0]));
const midZ = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);

// Perimeter: any side open to the outside of the footprint
const isPerim = (x, z) =>
  !inFp.has(key(x + 1, z)) || !inFp.has(key(x - 1, z)) ||
  !inFp.has(key(x, z + 1)) || !inFp.has(key(x, z - 1));

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE = { north: "true", south: "true", east: "true", west: "true" };

for (const [x, z, ground] of cells) {
  const gr = Math.max(0, Math.min(ground, H - 4));
  // Two-storey commercial block with parapet: roof top at y 12 (or lifted on high ground)
  const T = gr >= 9 ? Math.min(gr + 4, H - 3) : 12;
  const perim = isPerim(x, z);
  const entrance = perim && x === minX && Math.abs(z - midZ) <= 2;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  for (let y = gr; y <= T; y++) {
    const rel = y - gr;

    if (y === T) {
      if (perim) set(x, y, z, "white_concrete");          // parapet
      continue;
    }
    if (y === T - 1) {
      set(x, y, z, "light_gray_concrete");                 // roof deck
      continue;
    }
    if (rel === 0) {
      set(x, y, z, "light_gray_concrete");                 // ground floor slab
      continue;
    }
    if (rel === 5 || rel === 10) {
      set(x, y, z, perim ? "smooth_stone" : "light_gray_concrete"); // storey line
      continue;
    }
    if (!perim) continue;                                  // interior air gap

    if (y === T - 2) { set(x, y, z, "smooth_stone"); continue; } // cornice

    const storey = rel < 5 ? 0 : 1;
    const r = rel % 5;
    if (r === 4) { set(x, y, z, "white_concrete"); continue; }  // spandrel

    // window zone r = 1..3
    if (storey === 0 && entrance) {
      if (r === 4) set(x, y, z, "smooth_stone");
      else set(x, y, z, "glass");                          // shopfront entrance glazing
      continue;
    }
    if (((x + z) % 3) === 0) {
      set(x, y, z, "white_concrete");                      // mullion
    } else if (storey === 1 && ((x * 3 + z * 5 + y) % 29) === 0) {
      set(x, y, z, "glowstone");                           // warm light behind glass
    } else if (storey === 0) {
      set(x, y, z, "light_blue_stained_glass", null);      // shopfront glass
    } else {
      set(x, y, z, "light_blue_stained_glass_pane", PANE);
    }
  }

  // Roof plant: small boxes on the roof deck, interior cells only
  if (!perim && x % 9 === 4 && z % 11 === 5) {
    set(x, T, z, "light_gray_concrete");
    set(x, T + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
