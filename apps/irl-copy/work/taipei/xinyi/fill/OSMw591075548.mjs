import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi shophouse-style commercial block, c. 1970s-80s:
// stone plinth, tinted glass shopfront, two-storey office band with
// white-tiled piers, cornice, parapet and a small rooftop plant box.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075548";
const W = 27, H = 20, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), gr);

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const minG = Math.min(...cells.map((c) => c[2]));
const R = minG + 8; // roof deck / parapet top index (roof ~8 above lowest ground)

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

const facesOf = (x, z) => DIRS.filter((d) => !cellMap.has(key(x + d.dx, z + d.dz)));

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Choose the main entrance: south-facing perimeter cell nearest the middle.
const midX = (minX + maxX) / 2;
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!facesOf(x, z).some((f) => f.n === "south")) continue;
    const d = Math.abs(x - midX);
    if (d < best) { best = d; doorKey = key(x, z); }
  }
}

// Foundation, plinth, shopfront, office band, cornice, parapet.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const h = R - gr;
  const faces = facesOf(x, z);
  const perim = faces.length > 0;
  const isDoor = doorKey === key(x, z);

  for (let r = 0; r <= h; r++) {
    const y = gr + r;

    if (!perim) {
      // Interior: floor slabs per storey and roof deck only (no fitted interiors).
      if (r === 0 || r === 4 || r === h) put(x, y, z, "smooth_stone");
      continue;
    }

    const f = faces[0];
    const alongX = f.n === "north" || f.n === "south";
    const k = alongX ? x - minX : z - minZ;
    const paneProps = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    if (r === 0) { put(x, y, z, "polished_andesite"); continue; }
    if (r === h) { put(x, y, z, "white_concrete"); continue; }
    if (r === h - 1 || r === 4) { put(x, y, z, "smooth_quartz"); continue; }

    if (r <= 3) {
      if (isDoor && r <= 2) {
        put(x, y, z, "dark_oak_door", {
          facing: "south", half: r === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (isDoor && r === 3) { put(x, y, z, "polished_andesite"); continue; }
      if (k % 3 === 0) { put(x, y, z, "polished_andesite"); continue; }
      put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      continue;
    }

    // Office windows, r = 5 .. h-2
    if (k % 3 === 0) { put(x, y, z, "white_concrete"); continue; }
    if (r === 5 && k % 6 === 4) { put(x, y, z, "glowstone"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", paneProps);
  }
}

// Red signboard band on the north parapet, standing above the parapet.
for (const [x, z] of cells) {
  const faces = facesOf(x, z);
  if (!faces.some((f) => f.n === "north")) continue;
  const k = x - minX;
  if (k >= 8 && k <= 14) put(x, R + 1, z, "red_concrete");
}

// Rooftop plant enclosure on the deck, if the deck exists there.
for (const [x, z] of cells) {
  if (facesOf(x, z).length > 0) continue;
  if (x < 18 || x > 21 || z < 5 || z > 8) continue;
  put(x, R + 1, z, "light_gray_concrete");
  put(x, R + 2, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
