import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1490 7th St NW: a 1920s red-brick apartment block with limestone bands, a cornice and a parapet. Three storeys on a
// podium (lidar 12), a one-storey wing on the west side and a single-storey shop bay on the east (lidar 5 and 2), and a
// setback penthouse core (lidar 14) in the middle. Every row is a stone band or a window row, so storey lines read.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78916.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78916.nbt";

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const roofOf = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));

// Clean tiers from the lidar roof: 2 (shop bay), 5 (wing), 12 (podium), 14 (core: interior cells at 13+ lidar)
const tier = (x, z) => {
  const r = roofOf.get(`${x},${z}`);
  if (r <= 2) return 2;
  if (r <= 5) return 5;
  const core = r >= 13 && DIRS.every(([dx, dz]) => (roofOf.get(`${x + dx},${z + dz}`) ?? 0) >= 12);
  return core ? 14 : 12;
};
const TOP = new Map(cells.map(([x, z]) => [`${x},${z}`, tier(x, z)]));
// a neighbour outside the footprint has no blocks (top 0), so every row facing it is exterior
const topAt = (x, z) => TOP.get(`${x},${z}`) ?? 0;

const plan = new Map();
const put = (x, y, z, block, state, extra) => plan.set(`${x},${y},${z}`, { x, y, z, block, state, ...extra });
const STRING = new Set([4, 7, 10, 13]);   // floor slabs inside, calcite string courses outside

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const R = TOP.get(`${x},${z}`);
  for (let y = 0; y < R; y++) {
    // faces exposed at this row: outside the footprint, or the neighbour stops below this row
    const E = DIRS.filter(([dx, dz]) => y >= topAt(x + dx, z + dz));
    const shell = E.length > 0;
    if (y === 0) put(x, 0, z, "stone_bricks");                        // plinth at grade
    else if (R === 2) put(x, y, z, "smooth_stone");                   // shop bay roof
    else if (y === 1) put(x, 1, z, shell ? "stone_bricks" : "stone");  // base course / sills
    else if (STRING.has(y)) put(x, y, z, shell ? "calcite" : "smooth_stone");
    else if (y === 11) put(x, y, z, shell ? "stone_bricks" : "stone"); // parapet / roof
    else if (!shell) put(x, y, z, "stone");                           // solid interior, no rooms
    else if (E.length > 1) put(x, y, z, "stone_bricks");              // quoins at the corners
    else {
      const [dx, dz] = E[0];
      const t = dx !== 0 ? z : x;                                      // position along the wall
      const p = t % 4;
      if (p === 0) put(x, y, z, "bricks");                             // pier
      else if (p === 2) put(x, y, z, "glass_pane",
        dz !== 0 ? { east: "true", west: "true", north: "false", south: "false" } : { north: "true", south: "true", east: "false", west: "false" },
        { dir: [dx, dz] });
      else put(x, y, z, "white_concrete");                             // sash frame
    }
  }
}

// Front (z = 0): a pilastered entrance with a lintel, a dark oak door and a small hall behind it
for (const x of [2, 4]) for (const y of [1, 2, 3]) put(x, y, 0, "stone_bricks");
put(3, 3, 0, "calcite");
const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
put(3, 1, 0, "dark_oak_door", { ...door, half: "lower" });
put(3, 2, 0, "dark_oak_door", { ...door, half: "upper" });
put(3, 1, 1, "air");
put(3, 2, 1, "air");
put(3, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });

// Each window has an air gap behind its glass; some bays get a warm light in the gap
const glass = [...plan.values()].filter((p) => p.block === "glass_pane");
for (const p of glass) {
  const [dx, dz] = p.dir;
  const ix = p.x - dx, iz = p.z - dz;
  put(ix, p.y, iz, "air");
  if (![2, 5, 8, 12].includes(p.y) || (p.x * 3 + p.z * 5 + p.y) % 5 !== 0) continue;
  if (p.y === 2) put(ix, 2, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else put(ix, p.y, iz, "glowstone");
}

// Roof equipment on the podium roof and the penthouse roof, each standing on the roof below
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const R = TOP.get(`${x},${z}`);
  const interior = DIRS.every(([dx, dz]) => topAt(x + dx, z + dz) > R - 1);
  if (R === 12 && interior && (x * 3 + z * 7) % 13 === 0) put(x, 12, z, "light_gray_concrete");
  if (R === 14 && interior && (x + z) % 5 === 0) put(x, 14, z, "light_gray_concrete");
}

const g = new Voxels([14, 26, 17]);
for (const p of plan.values()) g.set(p.x, p.y, p.z, p.block, p.state);
console.log(g.save(OUT));
