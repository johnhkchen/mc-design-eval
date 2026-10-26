// 733 10th St NW: a stripped-classical office block (c. 1930s), calcite piers and bands over a granite plinth,
// with a 15-block wing ring, a 17-block core, a 4-block annex and a penthouse. Built from lidar roof heights:
// 3-6 -> annex, 14-15 -> wing, 16-17 -> core (smoothed to flat tiers). Ground is 0 under the whole footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC62696.cells.json`, "utf8"));
const W = 14, D = 27, H = 29;
const g = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => { if (g.inBounds(x, y, z)) g.set(x, y, z, block, state); };

const PLINTH = "polished_granite", STONE = "calcite", CORNICE = "smooth_stone", SLAB = "smooth_stone_slab";
const FLOOR = "smooth_stone", ROOF = "gray_concrete", GLASS = "light_blue_stained_glass", SHOP = "glass", LIGHT = "glowstone";

// the footprint: each cell's ground and its tier top (the lidar roof, smoothed)
const topOf = (roof) => (roof <= 6 ? 4 : roof <= 15 ? 15 : 17);
const base = new Map();
for (const [x, z, gr, roof] of cells) base.set(`${x},${z}`, { gr, top: topOf(roof) });
const cell = (x, z) => base.get(`${x},${z}`);

// the penthouse: a 5 x 8 block set back in the core, bands at 17 and 19, glass at 18, top at 20
const PENT = { x0: 5, x1: 9, z0: 8, z1: 15, y0: 17, top: 20 };
const inPent = (x, z) => x >= PENT.x0 && x <= PENT.x1 && z >= PENT.z0 && z <= PENT.z1;
const inPentY = (x, z, y) => inPent(x, z) && y >= PENT.y0 && y < PENT.top;
const inBase = (x, z, y) => { const c = cell(x, z); return !!c && y >= c.gr && y < c.top; };
const solid = (x, z, y) => inBase(x, z, y) || inPentY(x, z, y);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !solid(x + dx, z + dz, y));
const topOfAt = (x, z) => (inPent(x, z) ? PENT.top : cell(x, z).top);
const isBand = (x, z, y) => (inPentY(x, z, y) ? y !== 18 : y === 3 || (y >= 4 && y % 2 === 0));
const isFloor = (x, z, y) => {
  if (inPentY(x, z, y)) return y === PENT.y0 || y === PENT.top - 1;
  const c = cell(x, z);
  return y === c.gr || y === c.top - 1 || (y >= 4 && y % 2 === 0);
};

// facade material: plinth, shopfront at 1-2, cornice on the top row, calcite bands and piers, glass between piers
const facadeBlock = (x, z, y, faces) => {
  const pent = inPentY(x, z, y);
  const pier = faces.some(([dx, dz]) => (dz === 0 ? z : x) % 3 === 0);
  if (y === topOfAt(x, z) - 1) return CORNICE;
  if (!pent && y === 0) return PLINTH;
  if (!pent && y <= 2) return pier ? PLINTH : SHOP;
  if (isBand(x, z, y)) return STONE;
  return pier ? STONE : GLASS;
};

const counts = { facade: 0, floor: 0, glass: 0, lights: 0 };
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const c = cell(x, z);
  if (c) for (let y = 0; y < c.gr; y++) put(x, y, z, PLINTH);   // foundation (none here: ground is 0)
  for (let y = 0; y < H; y++) {
    if (!solid(x, z, y)) continue;
    const faces = exposed(x, z, y);
    if (faces.length) {
      const block = facadeBlock(x, z, y, faces);
      put(x, y, z, block); counts.facade++;
      if (block === GLASS) counts.glass++;
      // warm light behind some upper windows: the interior cell inside the glass
      if (block === GLASS && (x * 5 + y * 7 + z * 3) % 13 === 0) {
        const [dx, dz] = faces[0], ix = x - dx, iz = z - dz;
        if (solid(ix, iz, y) && !isFloor(ix, iz, y)) { put(ix, y, iz, LIGHT); counts.lights++; }
      }
      // parapet cap on the top row of the outer wall
      if (y === topOfAt(x, z) - 1 && !solid(x, z, y + 1)) put(x, y + 1, z, SLAB, { type: "bottom" });
    } else if (isFloor(x, z, y)) {
      put(x, y, z, y === topOfAt(x, z) - 1 ? ROOF : FLOOR); counts.floor++;
    }
  }
}

// the entrance on the east face at z 7: a dark oak door in the shopfront, with a lintel over it and posts inside
put(13, 1, 7, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
put(13, 2, 7, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const z of [6, 8]) for (const y of [1, 2]) put(12, y, z, PLINTH);
for (const z of [6, 7, 8]) for (const x of [12, 13]) put(x, 3, z, CORNICE);

// rooftop plant on the annex roof (a 2 x 2 x 1 box standing on the annex deck at y 3)
for (const x of [11, 12]) {
  if (cell(x, 25).top !== 4) throw new Error(`annex roof expected at ${x},25`);
  for (const y of [4, 5]) put(x, y, 25, "light_gray_concrete");
}

g.save(`${DIR}/DC62696.nbt`);
console.log(JSON.stringify({ cells: base.size, blocks: g.count(), ...counts }));
