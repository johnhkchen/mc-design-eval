// 1155 14th St NW: a 1920s brick-and-limestone office block. A four-storey body (lidar ~15) on a stone base,
// a one-storey hall on its south-east flank (lidar 2-3), and a setback core one storey up (lidar 17-18) set back
// from the body's walls. Walls are brick with calcite string courses and cornice; windows are glass panes with
// an air gap behind, floor slabs per storey, a door with a canopy on the 14th St (north) front, warm lights behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86685.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86685.nbt";

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const B = new Map();
const k = (x, z) => `${x},${z}`;
const at = (x, z) => B.get(k(x, z));
// roof 0 is open ground (a light well), so it is not building: its neighbours' faces become exposed walls
for (const [x, z, g, r] of cells) if (r > 0) B.set(k(x, z), { x, z, g, r, H: 15 });
for (const c of B.values()) {
  if (c.r <= 4) c.H = 3;                                                                          // one-storey hall
  else if (c.r >= 17 && NB.every(([dx, dz]) => at(c.x + dx, c.z + dz))) c.H = 18;                 // setback core
  else c.H = 15;                                                                                  // four-storey body
}
// a face is exposed where the neighbour is missing or lower: walls stand there, nowhere else
const exposed = (c) => NB.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.H < c.H; });

// per tier: window rows, string-course/cap rows (calcite outside), floor rows (slab inside)
const SPEC = {
  3: { win: [1], band: [2], floor: [0], cap: 2 },
  15: { win: [1, 2, 5, 6, 8, 9, 11, 12], band: [4, 7, 10, 14], floor: [0, 4, 7, 10, 13], cap: 14 },
  18: { win: [15, 16], band: [17], floor: [], cap: 17 },
};

const g = new Voxels([16, 30, 17]);
const lightSpots = [];
for (const c of B.values()) {
  const ex = exposed(c), S = SPEC[c.H], H = c.H;
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, "stone_bricks");                             // foundation to the ground
  for (let y = 0; y < H; y++) {
    if (!ex.length) {                                                                              // interior: floor and cap slabs only
      if (S.floor.includes(y) || y === S.cap) g.set(c.x, y, c.z, "smooth_stone");
      continue;
    }
    if (ex.length > 1) {                                                                           // corner pier
      g.set(c.x, y, c.z, y === 0 ? "stone_bricks" : S.band.includes(y) || y === S.cap ? "calcite" : "bricks");
      continue;
    }
    const [dx, dz] = ex[0], along = dx !== 0 ? c.z : c.x;
    if (y === 0) g.set(c.x, y, c.z, "stone_bricks");                                              // base course
    else if (S.band.includes(y) || y === S.cap) g.set(c.x, y, c.z, "calcite");
    else if (S.win.includes(y)) {
      const door = c.x === 9 && c.z === 0 && dz === -1 && (y === 1 || y === 2);
      if (door) { g.set(c.x, y, c.z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (along % 2 === 1) {
        const onZ = dx !== 0;                                                                    // pane runs along its own wall
        const pane = { east: String(!onZ), west: String(!onZ), north: String(onZ), south: String(onZ) };
        g.set(c.x, y, c.z, "glass_pane", pane);
        if ((c.x + c.z) % 4 === 1 && (y === 1 || y === 5 || y === 8 || y === 11)) {
          const inX = c.x - dx, inZ = c.z - dz, n = at(inX, inZ);
          if (n && n.H === H && !exposed(n).length) lightSpots.push([inX, y, inZ, y === 1 ? "glowstone" : "shroomlight"]);
        }
      } else g.set(c.x, y, c.z, y <= 2 && H === 15 ? "dark_oak_planks" : "bricks");              // shopfront piers / brick piers
    } else g.set(c.x, y, c.z, "bricks");
  }
  if (ex.length) g.set(c.x, H, c.z, "smooth_stone_slab", { type: "bottom" });                    // cornice / parapet course
}

// warm lights behind the panes (air inside, floor under each)
for (const [x, y, z, b] of lightSpots) g.set(x, y, z, b);

// canopy over the entrance on the 14th St front
for (const x of [8, 9, 10]) g.set(x, 3, 0, "dark_oak_slab", { type: "bottom" });

// roof plant: two-high boxes on the body roof, and a penthouse on the setback core
for (const c of B.values()) {
  if (c.H === 15 && !exposed(c).length && c.x % 5 === 2 && c.z % 4 === 1) {
    g.set(c.x, 15, c.z, "light_gray_concrete"); g.set(c.x, 16, c.z, "light_gray_concrete");
  }
}
const pent = [...B.values()].find((c) => c.H === 18 && !exposed(c).length && c.x === 7 && c.z === 6);
if (pent) { g.set(pent.x, 18, pent.z, "light_gray_concrete"); g.set(pent.x, 19, pent.z, "light_gray_concrete"); }

console.log(g.save(OUT));
