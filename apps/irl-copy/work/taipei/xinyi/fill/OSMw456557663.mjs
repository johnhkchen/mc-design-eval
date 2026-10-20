import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unknown record, so the building is a plain late-20th-century Xinyi commercial block:
// reinforced-concrete frame, white painted concrete walls, grey pier columns, tinted glass
// window strips, a shopfront at street level, quartz cornice, parapet, and a central
// mechanical penthouse. Four storeys of 5 blocks each, roof deck at ground + 20, parapet
// at ground + 21. Penthouse reaches ground + 23, so this fits H = 33 for grounds up to 9.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw456557663";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 33, D = 18;
const g = new Voxels([W, H, D]);

const k = (x, z) => `${x},${z}`;
const groundOf = new Map(cells.map(([x, z, y]) => [k(x, z), y]));
const isFoot = (x, z) => groundOf.has(k(x, z));
const gnd = (x, z) => groundOf.get(k(x, z));

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const DV = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

const outwardOf = (x, z) => {
  const o = [];
  if (!isFoot(x, z - 1)) o.push("north");
  if (!isFoot(x, z + 1)) o.push("south");
  if (!isFoot(x + 1, z)) o.push("east");
  if (!isFoot(x - 1, z)) o.push("west");
  return o;
};

// Footprint bounds, used to place a pier on each facade's end bays.
const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

const STOREYS = 4, BAY = 5;
const WALL = "white_concrete";
const PIER = "light_gray_concrete";
const BAND = "smooth_quartz";
const GLASS = "light_blue_stained_glass_pane";

// Pick the main entrance: the middle cell of the south face, if the footprint has one.
let southCells = cells
  .filter(([x, z]) => outwardOf(x, z).length === 1 && outwardOf(x, z)[0] === "south")
  .map(([x, z]) => [x, z])
  .sort((a, b) => a[0] - b[0]);
if (southCells.length === 0) {
  southCells = cells
    .filter(([x, z]) => outwardOf(x, z).includes("north"))
    .map(([x, z]) => [x, z])
    .sort((a, b) => a[0] - b[0]);
}
const doorCell = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;
const doorFacing = southCells.length && outwardOf(...doorCell).includes("south") ? "south" : "north";

// Main pass over every footprint cell.
for (const [x, z] of cells) {
  const fg = gnd(x, z);
  const outs = outwardOf(x, z);
  const edge = outs.length > 0;
  const corner = outs.length >= 2;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < fg; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at each storey line, including the ground floor.
  for (let s = 0; s < STOREYS; s++) {
    const f = fg + BAY * s;
    put(x, f, z, edge ? BAND : "light_gray_concrete");
  }

  // Roof deck, cornice and parapet.
  put(x, fg + BAY * STOREYS, z, "gray_concrete");
  if (edge) {
    put(x, fg + BAY * STOREYS, z, BAND);
    put(x, fg + BAY * STOREYS + 1, z, WALL);
  }

  if (!edge) continue;

  // Facade: storeys of pier, glass and spandrel.
  const dir = outs[0];
  const alongZ = dir === "north" || dir === "south"; // z-face, so the line runs along x
  const p = alongZ ? x : z;
  const minP = alongZ ? minX : minZ;
  const maxP = alongZ ? maxX : maxZ;
  const isPier = corner || (p - minP) % 3 === 0 || p === maxP;

  for (let s = 0; s < STOREYS; s++) {
    const f = fg + BAY * s;
    for (let h = 1; h <= 4; h++) {
      const y = f + h;
      if (h === 4) {
        put(x, y, z, isPier ? PIER : WALL);
        continue;
      }
      if (isPier) {
        put(x, y, z, PIER);
        continue;
      }
      // Glass pane, connected along the facade line.
      const props = alongZ
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, GLASS, props);
    }

    // Warm light behind some windows, one cell inside the facade.
    if (!isPier && (x + z + s) % 5 === 0) {
      const [dx, dz] = DV[dir];
      const ix = x - dx, iz = z - dz;
      if (isFoot(ix, iz)) put(ix, f + 2, iz, "glowstone");
    }
  }
}

// Entrance: a dark oak door pair on the main face, with a hanging lantern above.
if (doorCell) {
  const [dx, dz] = doorCell;
  const fg = gnd(dx, dz);
  const base = { facing: doorFacing, hinge: "left", open: "false", powered: "false" };
  put(dx, fg + 1, dz, "dark_oak_door", { ...base, half: "lower" });
  put(dx, fg + 2, dz, "dark_oak_door", { ...base, half: "upper" });
  put(dx, fg + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Roof mechanical penthouse, 6 x 6 cells in the middle of the roof, two storeys tall.
for (const [x, z] of cells) {
  if (x < 6 || x > 11 || z < 6 || z > 11) continue;
  const fg = gnd(x, z);
  const edge = x === 6 || x === 11 || z === 6 || z === 11;
  if (edge) {
    put(x, fg + 21, z, WALL);
    put(x, fg + 22, z, WALL);
  }
  put(x, fg + 23, z, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
