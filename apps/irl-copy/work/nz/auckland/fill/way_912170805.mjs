// Way 912170805: an irregular commercial block on the Mt Eden / Eden Terrace fringe, read as a 1930s stripped-classical
// shop-and-office building: a basalt plinth, a shopfront on the street floor, two upper storeys of plastered piers and
// glazing with stone string courses, a stone parapet, and a plant room on the flat roof. Lidar gives every cell the same
// roof (11 above y 0), so there are no setbacks: the massing is one flat-roofed block with a plant room on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_912170805.cells.json`, "utf8"));

const FLOOR = 1;              // street-level floor; y 0 is the basalt foundation under every cell
const TOP = 10;               // the roof deck and parapet course; the lidar roof (11) is its top surface

const g = new Voxels([8, 24, 10]);
const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inF = (x, z) => foot.has(`${x},${z}`);
// the four sides: dx/dz step out of the footprint through this side; along is the axis a wall on that side runs along
const DIRS = [
  { name: "east", dx: 1, dz: 0, along: "z" },
  { name: "west", dx: -1, dz: 0, along: "z" },
  { name: "south", dx: 0, dz: 1, along: "x" },
  { name: "north", dx: 0, dz: -1, along: "x" },
];
const exposed = (x, z) => DIRS.filter((d) => !inF(x + d.dx, z + d.dz));
const isInterior = (x, z) => inF(x, z) && exposed(x, z).length === 0;
const pos = (d, x, z) => (d.along === "z" ? z : x);

// the entrance: the side with the most single-faced wall cells, its middle cell
const sides = DIRS.map((d) => ({ d, list: cells.filter(([x, z]) => exposed(x, z).length === 1 && exposed(x, z)[0].name === d.name) }));
sides.sort((a, b) => b.list.length - a.list.length);
const side = sides[0].d;
const doorList = sides[0].list.sort((a, b) => pos(side, a[0], a[1]) - pos(side, b[0], b[1]));
const [doorX, doorZ] = doorList[Math.floor(doorList.length / 2)];

// a pane connects to the neighbouring panes along its wall, so a run of glazing reads as one window band
const pane = (d) => {
  const along = d.along === "z";
  return { north: String(along), south: String(along), east: String(!along), west: String(!along), waterlogged: "false" };
};

for (const [x, z, ground] of cells) {
  const ex = exposed(x, z), wall = ex.length > 0, corner = ex.length > 1, d = ex[0];
  const door = x === doorX && z === doorZ;

  // foundation: solid from y 0 up to the floor, so nothing floats on a slope
  for (let y = 0; y < Math.max(FLOOR, ground); y++) g.set(x, y, z, "polished_basalt");
  // storey floors and the roof deck run across the whole footprint; on the walls they are the string courses and parapet
  for (const y of [4, 8, TOP]) g.set(x, y, z, wall ? "stone_bricks" : "smooth_stone");
  if (!wall) { g.set(x, 1, z, "air"); continue; }   // interior: only the foundation and floors; warm lights below

  // piers on corners and every few cells; glazing in between (windows read as bays, not a sheet of glass). The shop
  // bays are wider than the upper bays, so the street floor reads as glass, not as a dark timber wall
  const bays = (n) => corner || pos(d, x, z) % n === 0;
  const glazed = (y, pierBlock, pier) => (pier ? g.set(x, y, z, pierBlock, pierBlock === "quartz_pillar" ? { axis: "y" } : undefined)
    : g.set(x, y, z, "glass_pane", pane(d)));

  if (door) {
    const state = (half) => ({ facing: side.name, half, hinge: "left", open: "false", powered: "false" });
    g.set(x, 1, z, "dark_oak_door", state("lower"));
    g.set(x, 2, z, "dark_oak_door", state("upper"));
    g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });   // hangs from the string course over the door
  } else {
    g.set(x, 1, z, "polished_basalt");                  // stall riser under the shopfront
    glazed(2, "dark_oak_planks", bays(4));              // shopfront: dark timber frames, glass between
    glazed(3, "dark_oak_planks", bays(4));
  }

  glazed(5, "quartz_pillar", bays(3));                  // first upper storey: plaster piers, two-high windows
  glazed(6, "quartz_pillar", bays(3));
  g.set(x, 7, z, "smooth_quartz");                      // lintel band
  glazed(9, "quartz_pillar", bays(3));                  // top storey: one-high clerestory windows under the parapet
  if (corner) g.set(x, 11, z, "smooth_quartz");         // corner pinnacles stand up over the parapet
}

// warm light behind some glazing: a glowstone on the shop floor, lanterns standing on the upper floors; only where
// the cell behind the glass is interior (an air gap), so nothing sits in a wall
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const d = ex[0], ix = x - d.dx, iz = z - d.dz;
  if (!isInterior(ix, iz) || (x === doorX && z === doorZ) || pos(d, x, z) % 3 === 0) continue;
  if ((x * 7 + z * 3) % 3 === 0) g.set(ix, 1, iz, "glowstone");
  else if ((x * 5 + z * 2) % 4 === 0) g.set(ix, 5, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else if ((x + z * 3) % 4 === 1) g.set(ix, 9, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// a plant room (lift overrun and stair housing) on the flat roof, two blocks high
for (const [x, z] of [[3, 4], [4, 4], [3, 5], [4, 5]]) for (const y of [11, 12]) g.set(x, y, z, "light_gray_concrete");

const res = g.save(`${HERE}/way_912170805.nbt`);
console.log(res);
