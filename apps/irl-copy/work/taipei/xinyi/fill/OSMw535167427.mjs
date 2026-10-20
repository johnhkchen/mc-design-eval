import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise 1990s-2000s commercial block in Xinyi: five storeys of 5 blocks,
// white-tiled concrete piers and spandrels, blue-tinted glazing in grid bays,
// a granite base and cornice, a shopfront entrance, and a rooftop plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167427";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 38, D = 16;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const ROOF = 24;   // roof deck layer (interior) and cornice layer (exterior)
const PARAPET = 25; // parapet layer, top surface at 26

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const exposed = (x, z) => {
  const out = [];
  if (!has(x, z - 1)) out.push("N");
  if (!has(x, z + 1)) out.push("S");
  if (!has(x + 1, z)) out.push("E");
  if (!has(x - 1, z)) out.push("W");
  return out;
};
const inward = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };

// Footprint centre
let sx = 0, sz = 0;
for (const [x, z] of cells) { sx += x; sz += z; }
const cx = Math.round(sx / cells.length);
const cz = Math.round(sz / cells.length);

// Entrance: exterior non-corner cell on the north face, nearest the centre line
let door = null;
{
  const cand = cells
    .filter(([x, z]) => {
      const e = exposed(x, z);
      const corner = e.some(d => d === "N" || d === "S") && e.some(d => d === "E" || d === "W");
      return e.includes("N") && !corner;
    })
    .sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx) || a[1] - b[1]);
  if (cand.length) door = cand[0];
}

const isPenthouse = (x, z) => Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2;

const litCells = []; // interior cells needing a glowstone behind a window

for (const [x, z, rawGround] of cells) {
  const gr = Math.min(Math.max(0, Math.round(rawGround)), ROOF);
  const ex = exposed(x, z);
  const isExt = ex.length > 0;
  const isCorner = ex.some(d => d === "N" || d === "S") && ex.some(d => d === "E" || d === "W");

  // Foundation under the ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (isExt) {
    const primary = ex[0];
    const along = (primary === "N" || primary === "S") ? x : z;
    const isDoor = door && door[0] === x && door[1] === z;

    for (let y = gr; y <= PARAPET; y++) {
      if (isDoor && (y === gr || y === gr + 1)) {
        const half = y === gr ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (y === PARAPET) { put(x, y, z, "light_gray_concrete"); continue; }
      if (y === ROOF) { put(x, y, z, "light_gray_concrete"); continue; }
      if (isCorner) { put(x, y, z, "white_concrete"); continue; }
      if (y === gr) { put(x, y, z, "polished_granite"); continue; }

      const r = y % 5;
      if (isDoor && y === gr + 2) { put(x, y, z, "light_gray_concrete"); continue; }
      if (r === 0 || r === 4) { put(x, y, z, "light_gray_concrete"); continue; }

      // r in 1..3: window bay
      if (along % 3 === 0) {
        put(x, y, z, "white_concrete");
      } else {
        const alongX = primary === "N" || primary === "S";
        put(x, y, z, "light_blue_stained_glass_pane", {
          north: alongX ? "false" : "true",
          south: alongX ? "false" : "true",
          east: alongX ? "true" : "false",
          west: alongX ? "true" : "false",
          waterlogged: "false",
        });
        // Warm light behind some glazing, on odd storeys
        const k = Math.floor(y / 5);
        if (k % 2 === 1 && r === 2 && along % 6 === 1) {
          const [dx, dz] = inward[primary];
          litCells.push([x + dx, 5 * k + 1, z + dz]);
        }
      }
    }
  } else {
    // Interior: floor slabs at the base level, each storey line and the roof deck; air elsewhere
    for (let y = gr; y <= ROOF; y++) {
      if (y === gr || y % 5 === 0 || y === ROOF) put(x, y, z, "smooth_stone");
    }
  }
}

// Warm light cells (only where the cell is interior and open)
for (const [x, y, z] of litCells) {
  if (!has(x, z)) continue;
  const interiorCell = exposed(x, z).length === 0;
  if (interiorCell) put(x, y, z, "glowstone");
}

// Rooftop plant box and mast
for (const [x, z] of cells) {
  if (exposed(x, z).length) continue;
  if (isPenthouse(x, z)) {
    for (let y = PARAPET; y <= 27; y++) put(x, y, z, "white_concrete");
  } else if ((x + z) % 4 === 1) {
    // Small air-conditioning plant on the roof deck
    put(x, PARAPET, z, "stone");
  }
}
if (has(cx, cz) && !exposed(cx, cz).length) {
  for (let y = 28; y <= 31; y++) {
    put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
