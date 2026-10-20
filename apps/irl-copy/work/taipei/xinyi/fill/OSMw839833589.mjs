import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833589";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Footprint and per-cell ground (third number), shifted so the lowest ground is y 0.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const minG = Math.min(...ground.values());
const G = (x, z) => ground.get(`${x},${z}`) - minG;
const has = (x, z) => ground.has(`${x},${z}`);

// Outward directions in priority order.
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Classify boundary cells and their outward faces.
const keys = [...ground.keys()].map((k) => k.split(",").map(Number));
const info = new Map(); // key -> { boundary, missing:[dir], corner }
for (const [x, z] of keys) {
  const missing = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  info.set(`${x},${z}`, { boundary: missing.length > 0, missing, corner: missing.length >= 2 });
}

// Pick the front: the outward direction carrying the most non-corner boundary cells.
const counts = Object.fromEntries(DIRS.map((d) => [d.name, 0]));
for (const [x, z] of keys) {
  const inf = info.get(`${x},${z}`);
  if (inf.boundary && !inf.corner) counts[inf.missing[0].name]++;
}
const frontName = DIRS.map((d) => d.name).sort((a, b) => counts[b] - counts[a])[0];
const frontDir = DIRS.find((d) => d.name === frontName);
const frontCells = keys.filter(([x, z]) => {
  const inf = info.get(`${x},${z}`);
  return inf.boundary && !inf.corner && inf.missing[0].name === frontName;
});
let door = null;
if (frontCells.length) {
  const along = (c) => (frontDir.dz !== 0 ? c[0] : c[1]);
  const mean = frontCells.reduce((s, c) => s + along(c), 0) / frontCells.length;
  door = frontCells.reduce((best, c) =>
    Math.abs(along(c) - mean) < Math.abs(along(best) - mean) ? c : best
  );
}
const doorKey = door ? `${door[0]},${door[1]}` : null;

// Build each footprint column.
for (const [x, z] of keys) {
  const b = G(x, z);
  const inf = info.get(`${x},${z}`);
  const bnd = inf.boundary;
  const top = Math.min(b + 11, H - 1);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");

  // Ground-level base course / floor slab.
  put(x, b, z, bnd ? "polished_andesite" : "light_gray_concrete");

  // Ground storey walls (y b+1..b+4).
  // Storey 2 walls (y b+6..b+9).
  const isDoor = key => key === doorKey;
  const isPier = inf.corner;

  if (bnd) {
    const outward = inf.missing[0];
    const facingOut = outward.name;
    const windowCell = !isPier && (x + z) % 3 !== 0;

    // Ground storey
    for (let y = b + 1; y <= b + 4; y++) {
      if (isDoor(`${x},${z}`) && door && facingOut === frontName) {
        if (y === b + 1 || y === b + 2) {
          put(x, y, z, "oak_door", {
            facing: facingOut,
            half: y === b + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (y === b + 3) {
          put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        } else {
          put(x, y, z, "white_concrete");
        }
        continue;
      }
      if (isPier) {
        put(x, y, z, "white_concrete");
      } else if (windowCell && (y === b + 1 || y === b + 2)) {
        put(x, y, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true" });
      } else if (y === b + 4) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "white_concrete");
      }
    }

    // Storey line above ground floor.
    put(x, b + 5, z, "smooth_quartz");

    // Storey 2 walls
    for (let y = b + 6; y <= b + 9; y++) {
      if (isPier) {
        put(x, y, z, "white_concrete");
      } else if (windowCell && (y === b + 7 || y === b + 8)) {
        put(x, y, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true" });
        // Warm light behind a subset of upper windows.
        if (y === b + 7 && (x + z) % 9 === 1) {
          const ix = x - outward.dx, iz = z - outward.dz;
          if (has(ix, iz) && G(ix, iz) <= b + 6) put(ix, b + 7, iz, "shroomlight");
        }
      } else if (y === b + 6 || y === b + 9) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "white_concrete");
      }
    }

    // Cornice / roof slab edge and parapet.
    put(x, b + 10, z, "smooth_quartz");
    if (top >= b + 11) put(x, b + 11, z, "white_concrete");
  } else {
    // Interior: air gap behind glass, floor slabs per storey.
    put(x, b + 5, z, "light_gray_concrete");
    put(x, b + 10, z, "light_gray_concrete");
    // Roof equipment on a few interior cells.
    if (x % 5 === 2 && z % 5 === 2 && b + 11 <= H - 1) {
      put(x, b + 11, z, "chiseled_stone_bricks");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
