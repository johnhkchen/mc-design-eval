import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unknown record: a 2-storey (about 11 block) Taipei commercial block of the late 1980s to 1990s.
// Cream concrete walls with light grey pilasters, a smooth-quartz belt course and cornice,
// full-height shopfront glass on the street (north, low-z) face with a central door and canopy,
// upper-floor ribbon windows, warm glowstone behind some panes, and a rooftop plant box.

const W = 20, H = 23, D = 17;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343637.cells.json", "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const inside = (x, z) => G.has(key(x, z));
const minG = Math.min(...G.values());
const R = minG + 11;                       // roof slab level (absolute)
const minX = Math.min(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const perim = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
const structural = (x, z) => inside(x, z) && !perim(x, z) && x % 6 === 3 && z % 6 === 3;

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Street frontage: footprint cells on the low-z edge
const frontXs = cells.filter(([x, z]) => !inside(x, z - 1)).map(c => c[0]).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

const PANE = "light_blue_stained_glass_pane";
const WALL = "white_concrete";
const PIER = "light_gray_concrete";
const BELT = "smooth_quartz";
const SPANDREL = "light_gray_concrete";

for (const [x, z, gr] of cells) {
  const per = perim(x, z);
  const faceZ = !inside(x, z - 1) || !inside(x, z + 1);   // wall on north/south side
  const faceX = !inside(x - 1, z) || !inside(x + 1, z);   // wall on east/west side
  const corner = faceZ && faceX;
  const front = !inside(x, z - 1);

  // Foundation and ground floor
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, per ? "stone_bricks" : "smooth_stone");

  if (gr >= R) continue;

  // Floor slabs at storey lines (every 5 blocks above this cell's ground)
  const lines = [];
  for (let y = gr + 5; y < R - 1; y += 5) lines.push(y);
  for (const y of lines) put(x, y, z, per ? BELT : "smooth_stone");

  // Walls, windows, structure
  for (let y = gr + 1; y < R - 1; y++) {
    if (lines.includes(y)) continue;
    if (!per) {
      if (structural(x, z)) put(x, y, z, PIER);
      continue;
    }
    if (corner) { put(x, y, z, PIER); continue; }

    const k = (y - gr - 1) % 5;             // 0..3 within a storey
    const story0 = y < gr + 5;
    const pos = faceZ ? x - minX : z - minZ;
    const pier = pos % 3 === 0;

    // Entrance on the street face
    if (front && x === doorX && faceZ) {
      if (y === gr + 1) { put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === gr + 2) { put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    }

    const isWin = story0 ? k <= 2 : (k >= 1 && k <= 3);

    if (pier) {
      put(x, y, z, PIER);
      continue;
    }

    if (isWin) {
      const p = faceZ
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      put(x, y, z, PANE, p);

      // Warm light behind some panes: inward cell is interior air
      if (k === 2 && pos % 6 === 1) {
        let dx = 0, dz = 0;
        if (faceZ) dz = front ? 1 : -1;
        else dx = !inside(x - 1, z) ? 1 : -1;
        const ix = x + dx, iz = z + dz;
        if (inside(ix, iz) && !structural(ix, iz)) put(ix, y, iz, "glowstone");
      }
    } else if (!story0 && k === 0) {
      put(x, y, z, SPANDREL);
    } else {
      put(x, y, z, WALL);
    }
  }

  // Canopy over the entrance and the lanterns beside it
  if (front && perim(x, z) && Math.abs(x - doorX) <= 2) {
    put(x, gr + 4, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  }
  if (front && (x === doorX - 2 || x === doorX + 2)) {
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Roof: cornice on the edge, roof deck inside, parapet on the edge
  if (per) {
    put(x, R, z, BELT);
    put(x, R + 1, z, BELT);
  } else {
    put(x, R, z, "light_gray_concrete");
  }
}

// Rooftop plant box
for (let x = 6; x <= 11; x++) {
  for (let z = 6; z <= 10; z++) {
    if (!inside(x, z) || perim(x, z)) continue;
    put(x, R + 1, z, "light_gray_concrete");
    put(x, R + 2, z, "light_gray_concrete");
    put(x, R + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1071343637.nbt");
