import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403763";
const W = 21, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const g0 = Math.min(...cells.map(c => c[2]));
const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));

// Storey levels, all relative to the lowest ground.
const G5 = g0 + 5;    // second-floor line / deck
const G7 = g0 + 7;    // lit-window height
const G10 = g0 + 10;  // roof deck / parapet top
const ROOF = g0 + 11; // coping and roof plant base

const S = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Perimeter faces of a footprint cell (direction where the neighbour is missing).
const facesOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};

// Main entrance: centre of the north-most row of footprint cells.
const northRow = cells.filter(c => c[1] === minZ).map(c => c[0]).sort((a, b) => a - b);
const doorX = northRow[Math.floor(northRow.length / 2)];

const glassNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const glassEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const inwardOf = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// 1. Foundations and interior structure.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");
  const f = facesOf(x, z);
  if (f.length === 0) {
    // Interior: ground-floor slab, second-floor slab, roof deck. Air between.
    S(x, gr, z, "smooth_stone");
    if (gr < G5) S(x, G5, z, "smooth_stone");
    if (gr < G10) S(x, G10, z, "light_gray_concrete");
  }
}

// 2. Facade on perimeter cells.
for (const [x, z, gr] of cells) {
  const f = facesOf(x, z);
  if (f.length === 0) continue;

  const corner = f.length > 1;
  const primary = f[0];
  const along = (primary === "N" || primary === "S") ? x - minX : z - minZ;
  const pier = corner || along % 3 === 0;
  const glassProps = (primary === "N" || primary === "S") ? glassNS : glassEW;

  S(x, gr, z, "stone_bricks"); // base course

  for (let y = gr + 1; y <= G10; y++) {
    const groundBand = y <= g0 + 3;
    const upperBand = y >= g0 + 6 && y <= g0 + 8;
    const isGlass = !pier && (groundBand || upperBand) && y !== G10;
    if (isGlass) {
      S(x, y, z, "light_blue_stained_glass_pane", glassProps);
    } else {
      S(x, y, z, "smooth_quartz");
    }
  }

  // Coping on the parapet.
  S(x, ROOF, z, "smooth_stone");

  // Warm light behind some upper-floor windows.
  if (!pier && along % 6 === 1 && primary) {
    const [dx, dz] = inwardOf[primary];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && facesOf(ix, iz).length === 0) {
      S(ix, G7, iz, "glowstone");
    }
  }
}

// 3. Entrance: double-height door in the north row, lanterns either side.
S(doorX, g0, minZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
S(doorX, g0 + 1, minZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dx of [-2, 2]) {
  if (has(doorX + dx, minZ)) {
    S(doorX + dx, g0 + 2, minZ, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 4. Rooftop plant: AC units scattered on the deck and a central stair/lift core.
const cx = Math.floor((minX + maxX) / 2);
const cz = minZ + Math.floor((Math.max(...cells.map(c => c[1])) - minZ) / 2);
for (const [x, z, gr] of cells) {
  if (facesOf(x, z).length) continue;
  if ((x - minX) % 5 === 2 && (z - minZ) % 5 === 2) {
    S(x, ROOF, z, "iron_block");
  }
  if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
    for (let y = ROOF; y <= ROOF + 2; y++) S(x, y, z, "smooth_quartz");
    S(x, ROOF + 3, z, "smooth_stone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
