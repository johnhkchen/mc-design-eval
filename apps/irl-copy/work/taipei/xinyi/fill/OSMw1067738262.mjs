import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738262";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 33, D = 22;
const ROOF = 20;          // roof slab sits at ground + 20 (roof ~21 above lowest ground)
const STOREYS = 4;        // 4 storeys x 5 blocks
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gr] of cells) groundOf.set(key(x, z), gr);
const has = (x, z) => groundOf.has(key(x, z));

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Outward neighbours: [dx, dz, facing name]
const SIDES = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const missingSides = (x, z) => SIDES.filter(([dx, dz]) => !has(x + dx, z + dz));
const isPerimeter = (x, z) => missingSides(x, z).length > 0;
const isCorner = (x, z) => missingSides(x, z).length >= 2;

// Entrance: a non-corner perimeter cell on the south face nearest the middle, else any face.
let doorCell = null;
{
  const southFace = cells.filter(([x, z]) => isPerimeter(x, z) && !isCorner(x, z)
    && missingSides(x, z).some(([, dz, n]) => n === "south"));
  const pool = southFace.length ? southFace
    : cells.filter(([x, z]) => isPerimeter(x, z) && !isCorner(x, z));
  if (pool.length) {
    const mean = pool.reduce((s, c) => s + c[0], 0) / pool.length;
    doorCell = pool.reduce((best, c) =>
      Math.abs(c[0] - mean) < Math.abs(best[0] - mean) ? c : best);
  }
}

// Penthouse footprint box in the middle of the roof (interior cells only).
const inPenthouse = (x, z) => Math.abs(x - 10) <= 4 && z >= 8 && z <= 13 && !isPerimeter(x, z);

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab at the base of every storey, and the roof slab.
  for (let k = 0; k < STOREYS; k++) put(x, gr + 5 * k, z, "smooth_stone");
  put(x, gr + ROOF, z, "light_gray_concrete");

  if (!isPerimeter(x, z)) {
    // Interior: air gap behind the glass, with warm glowstone in some bays.
    continue;
  }

  const corner = isCorner(x, z);
  const [, , outName] = missingSides(x, z)[0];
  const outSide = missingSides(x, z)[0];
  const [nx, nz] = [outSide[0], outSide[1]];
  const along = nz !== 0 ? x : z;                // index along the facade
  const paneProps = nz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let k = 0; k < STOREYS; k++) {
    const b = gr + 5 * k;
    const ground = k === 0;
    const pier = ground ? "polished_granite" : "white_concrete";

    // Spandrel / base course at the storey line.
    put(x, b, z, ground ? "polished_granite" : "light_gray_concrete");
    // Storey belt at the top of each storey.
    put(x, b + 4, z, "light_gray_concrete");

    for (let dy = 1; dy <= 3; dy++) {
      const y = b + dy;
      const isWindow = !corner && along % 3 !== 0;
      if (isWindow) put(x, y, z, "glass_pane", paneProps);
      else put(x, y, z, pier);
    }

    // Warm light behind some glass: glowstone in the interior cell inside this bay.
    if (!corner && along % 3 !== 0 && along % 6 === 2 && k % 2 === 0) {
      const ix = x - nx, iz = z - nz;
      if (has(ix, iz) && !isPerimeter(ix, iz)) put(ix, b + 2, iz, "glowstone");
    }
  }

  // Parapet cap above the roof line.
  put(x, gr + ROOF + 1, z, "white_concrete");
}

// Entrance: dark oak door with a stone surround and lintel.
if (doorCell) {
  const [dx, dz, gr] = doorCell;
  const outFacing = (() => {
    const m = missingSides(dx, dz)[0];
    return m[2];
  })();
  const doorProps = (half) => ({
    facing: outFacing, half, hinge: "left", open: "false", powered: "false",
  });
  put(dx, gr + 1, dz, "dark_oak_door", doorProps("lower"));
  put(dx, gr + 2, dz, "dark_oak_door", doorProps("upper"));
  put(dx, gr + 3, dz, "smooth_stone");
}

// Rooftop plant penthouse with a glazed band.
for (const [x, z, gr] of cells) {
  if (!inPenthouse(x, z)) continue;
  const ring = x === 6 || x === 14 || z === 8 || z === 13;
  for (let dy = 1; dy <= 3; dy++) {
    const y = gr + ROOF + dy;
    if (dy === 2 && ring) {
      const pp = (x === 6 || x === 14)
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      put(x, y, z, "glass_pane", pp);
    } else {
      put(x, y, z, ring ? "white_concrete" : "light_gray_concrete");
    }
  }
  put(x, gr + ROOF + 4, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
