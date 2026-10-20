import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw543058350";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// Two-storey mid-century commercial block with a pale tiled facade, shopfronts,
// a red lintel band and a parapet. Roof sits at y 10, parapet to y 11.
const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

const K = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(K(x, z), Math.max(0, Math.min(H - 2, Math.round(gr))));
}
const has = (x, z) => ground.has(K(x, z));
const expo = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Pick the longest facade for the entrance and the cell nearest its middle.
const runs = { north: [], south: [], west: [], east: [] };
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (const d of expo(x, z)) {
    runs[d.n].push(d.n === "north" || d.n === "south" ? x : z);
  }
}
const doorFacade = Object.keys(runs).sort((a, b) => runs[b].length - runs[a].length)[0];
const dv = runs[doorFacade];
const doorMid = dv.length ? Math.floor((Math.min(...dv) + Math.max(...dv)) / 2) : -1;
const DOOR = new Map();
if (dv.length) {
  let best = null, bestD = Infinity;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    const d = expo(x, z).find((e) => e.n === doorFacade);
    if (!d) continue;
    const idx = doorFacade === "north" || doorFacade === "south" ? x : z;
    const dist = Math.abs(idx - doorMid);
    if (dist < bestD) { bestD = dist; best = k; }
  }
  if (best) DOOR.set(best, doorFacade);
}

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Floors, roof deck, walls, parapet, roof plant.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const ex = expo(x, z);
  const edge = ex.length > 0;
  const corner = ex.length > 1;

  // Interior floor slab at the storey line (y 5) and roof deck (y 10).
  if (!edge && gr <= 5) put(x, 5, z, "smooth_stone");
  if (gr <= 10) put(x, 10, z, edge ? "smooth_quartz" : "light_gray_concrete");

  if (!edge) {
    // Rooftop AC units sitting on the interior roof deck.
    if (gr <= 10 && (x * 5 + z * 3) % 9 === 0) put(x, 11, z, "iron_block");
    continue;
  }

  const primary = ex[0];
  const idx = primary.n === "north" || primary.n === "south" ? x : z;
  const pier = corner || idx % 4 === 0;
  const dk = DOOR.get(k);
  const alongX = primary.n === "north" || primary.n === "south";
  const paneProps = alongX
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  // Base course on the exposed wall at its ground level.
  put(x, gr, z, "polished_granite");

  for (let y = gr + 1; y <= 9; y++) {
    if (y <= 4) {
      // Ground storey: shopfronts, door, red lintel band.
      if (dk && gr + 2 <= 4 && y === gr + 1) {
        put(x, y, z, "oak_door", { facing: dk, half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (dk && gr + 2 <= 4 && y === gr + 2) {
        put(x, y, z, "oak_door", { facing: dk, half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (dk && y === gr + 3) {
        put(x, y, z, "smooth_quartz");
      } else if (pier) {
        put(x, y, z, "smooth_quartz");
      } else if (y === 4) {
        put(x, y, z, "red_terracotta");
      } else {
        put(x, y, z, "glass");
      }
    } else if (y === 5) {
      // Storey line.
      put(x, y, z, "polished_granite");
    } else {
      // Upper storey: piers, sill and head spandrels, glass panes.
      if (pier) {
        put(x, y, z, "smooth_quartz");
      } else if (y === 6 || y === 9) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "glass_pane", paneProps);
        // Warm light in some rooms, right behind the glass.
        if (y === 7 && idx % 8 === 2) {
          const ix = x - primary.dx, iz = z - primary.dz;
          if (has(ix, iz) && ground.get(K(ix, iz)) <= 6) {
            put(ix, 7, iz, "glowstone");
          }
        }
      }
    }
  }

  // Cornice at y 10 (set above for edges) and parapet at y 11.
  if (gr <= 10) put(x, 11, z, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
