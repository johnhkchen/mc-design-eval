import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Low-rise Xinyi commercial block, two storeys over a shopfront
// ground floor, cream quartz facade, stone base, flat roof with parapet and
// rooftop plant. Roof deck at y 11 (about 11 blocks above lowest ground).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542017370";
const W = 16, H = 23, D = 16;
const ROOF = 11;     // roof deck course
const PARAPET = 12;  // parapet course on the edge

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.min(ROOF, Math.round(gr))));
}

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "east", dx: 1, dz: 0 },
  { n: "west", dx: -1, dz: 0 },
];
const has = (x, z) => ground.has(key(x, z));
const exteriorDirs = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isEdge = (x, z) => has(x, z) && exteriorDirs(x, z).length > 0;

// Centroid for placing the entrance.
let cx = 0, cz = 0, n = 0;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  cx += x; cz += z; n++;
}
cx /= Math.max(1, n); cz /= Math.max(1, n);

// Pick one entrance: lowest ground, on a south-facing edge if possible, near centre.
let doorKey = null, doorFacing = null;
{
  let best = Infinity;
  for (const [k, gr] of ground) {
    if (gr > 2) continue;
    const [x, z] = k.split(",").map(Number);
    const ext = exteriorDirs(x, z);
    if (!ext.length) continue;
    const hasSouth = ext.some((d) => d.n === "south");
    const score = Math.abs(x - cx) + Math.abs(z - cz) + (hasSouth ? 0 : 6);
    if (score < best) {
      best = score;
      doorKey = k;
      doorFacing = (hasSouth ? ext.find((d) => d.n === "south") : ext[0]).n;
    }
  }
}

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const pane = (x, y, z, wallAlongX) => {
  put(x, y, z, "glass_pane", {
    north: wallAlongX ? "false" : "true",
    south: wallAlongX ? "false" : "true",
    east: wallAlongX ? "true" : "false",
    west: wallAlongX ? "true" : "false",
    waterlogged: "false",
  });
};

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const ext = exteriorDirs(x, z);
  const edge = ext.length > 0;
  const corner = ext.length >= 2;
  const wallAlongX = ext.some((d) => d.n === "north" || d.n === "south");
  const p = wallAlongX ? x : z;
  const pier = corner || p % 4 === 0;
  const outward = ext[0];

  // Foundation fill up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course at the ground line.
  for (let y = gr; y <= PARAPET; y++) {
    if (y === gr) put(x, y, z, edge ? "polished_andesite" : "smooth_stone");

    if (edge) {
      // Shopfront storey: y gr+1 .. 4
      if (y > gr && y <= 4) {
        const isDoor = k === doorKey;
        if (isDoor) {
          if (y === gr + 1) {
            put(x, y, z, "oak_door", {
              facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false",
            });
          } else if (y === gr + 2) {
            put(x, y, z, "oak_door", {
              facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false",
            });
          } else if (y === gr + 3) {
            put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
          } else {
            put(x, y, z, "stone_bricks");
          }
        } else if (y === 4) {
          put(x, y, z, "stone_bricks");        // lintel band
        } else if (pier) {
          put(x, y, z, "stone_bricks");        // piers
        } else {
          pane(x, y, z, wallAlongX);            // shopfront glass
        }
      }

      // Upper storey: y 6 .. 9
      if (y >= 6 && y <= 9) {
        if (pier || y === 6 || y === 9) {
          put(x, y, z, "smooth_quartz");
        } else {
          pane(x, y, z, wallAlongX);
          // Warm light just inside some bays.
          if (y === 7 && p % 8 === 2) {
            const ix = x - outward.dx, iz = z - outward.dz;
            if (has(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "glowstone");
          }
        }
      }

      if (y === ROOF) put(x, y, z, "smooth_stone");     // cornice
      if (y === PARAPET) put(x, y, z, "smooth_quartz"); // parapet
    }

    // Storey lines and roof deck.
    if (y === 5 || y === 10) put(x, y, z, "smooth_stone");
    if (y === ROOF && !edge) put(x, y, z, "light_gray_concrete");
  }

  // Rooftop plant on a sparse grid of interior cells.
  if (!edge && x % 5 === 2 && z % 5 === 2 && gr <= ROOF) {
    put(x, PARAPET, z, "smooth_stone");
    put(x, PARAPET + 1, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
