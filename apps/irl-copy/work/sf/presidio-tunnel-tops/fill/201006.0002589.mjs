// 3550 W Pacific Ave: a two-storey Mixed-Use block in the Presidio Heights stucco idiom. Stone base course,
// white stucco walls, a shopfront with two dark-oak doors and red-tile canopies on the street (north) face, paired
// upper windows with quartz piers, a red-tile coping and a flat roof with a skylight, HVAC box and pergola.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0002589.cells.json`, "utf8"));

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const inside = (x, z) => ground.has(`${x},${z}`);
const NEIGH = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const FACES = ["north", "south", "west", "east"];   // the street front is north
const openFaces = (x, z) => FACES.filter((f) => !inside(x + NEIGH[f][0], z + NEIGH[f][1]));

// Depth from outside: 1 = wall ring, 2 = air gap behind the glass, 3+ = rooms (floor slabs).
const depth = new Map();
let frontier = [];
for (const [x, z] of cells) if (openFaces(x, z).length) { depth.set(`${x},${z}`, 1); frontier.push([x, z]); }
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of Object.values(NEIGH)) {
    if (inside(x + dx, z + dz) && !depth.has(`${x + dx},${z + dz}`)) { depth.set(`${x + dx},${z + dz}`, d + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}

// Two front doors on the longest north-facing run, placed on the x%3==1 rhythm (between the posts).
const rows = new Map();
for (const [x, z] of cells) if (depth.get(`${x},${z}`) === 1 && openFaces(x, z)[0] === "north") rows.set(z, [...(rows.get(z) ?? []), x]);
const [doorZ, doorRow] = [...rows].sort((a, b) => b[1].length - a[1].length)[0];
const cand = doorRow.sort((a, b) => a - b).filter((x) => x % 3 === 1);
const doorXs = [cand[Math.floor(cand.length * 0.3)], cand[Math.floor(cand.length * 0.7)]].filter((x) => x !== undefined);

const g = new Voxels([24, 16, 23]);
const panes = [];
const DOOR = (x, z, half) => g.set(x, half === "lower" ? 1 : 2, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
const CANOPY = { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" };
const PANE = (x, y, z) => { g.set(x, y, z, "glass_pane"); panes.push([x, y, z]); };

for (const [x, z, gr] of cells) {
  const d = depth.get(`${x},${z}`);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");          // foundation up to this cell's ground
  if (d >= 2) { g.set(x, 0, z, "smooth_stone"); g.set(x, 4, z, "stone"); }   // ground slab, roof deck
  if (d >= 3) g.set(x, 2, z, "smooth_stone");                            // upper floor slab
  if (d === 2) {                                                         // air gap behind the glass
    if ((x * 3 + z * 5) % 6 === 0) g.set(x, 1, z, "glowstone");          // warm light behind the shop glass
    else if ((x + z * 2) % 7 === 0) g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    continue;
  }
  if (d !== 1) continue;

  // The wall ring: stone base, storey lines, paired windows, red-tile coping.
  const face = openFaces(x, z)[0];
  const p = face === "north" || face === "south" ? x : z;
  const door = face === "north" && z === doorZ && doorXs.includes(x);
  const canopy = face === "north" && z === doorZ && doorXs.some((dx) => Math.abs(dx - x) === 1);
  g.set(x, 0, z, "stone_bricks");
  g.set(x, 4, z, "red_sandstone_slab", { type: "bottom", waterlogged: "false" });
  if (door) {
    DOOR(x, z, "lower"); DOOR(x, z, "upper");
    g.set(x, 3, z, "red_sandstone_stairs", CANOPY);
    continue;
  }
  if (p % 3 === 0) {                                                     // piers (posts on the ground storey)
    g.set(x, 1, z, "dark_oak_log", { axis: "y" });
    g.set(x, 2, z, "smooth_quartz");
    g.set(x, 3, z, "white_concrete");
  } else {                                                               // glazing, ground storey and upper
    PANE(x, 1, z); PANE(x, 2, z); PANE(x, 3, z);
  }
  if (canopy) g.set(x, 3, z, "red_sandstone_stairs", CANOPY);
}

// Panes join their neighbours in the wall plane, as vanilla panes do.
const JOIN = new Set(["glass_pane", "dark_oak_log", "white_concrete", "smooth_quartz", "stone_bricks"]);
for (const [x, y, z] of panes) {
  const st = {};
  for (const [k, [dx, dz]] of Object.entries(NEIGH)) {
    const b = g.get(x + dx, y, z + dz);
    st[k] = b && JOIN.has(b.block.replace("minecraft:", "")) ? "true" : "false";
  }
  g.set(x, y, z, "glass_pane", st);
}

// Roof: a skylight over a light well, an HVAC box, and a fenced pergola on the south side.
const onRoof = (x, z) => depth.get(`${x},${z}`) >= 3;
for (let x = 11; x <= 13; x++) for (let z = 10; z <= 12; z++) if (onRoof(x, z)) g.set(x, 4, z, "glass");
for (let x = 16; x <= 17; x++) for (let z = 14; z <= 15; z++) if (onRoof(x, z)) g.set(x, 5, z, "iron_block");
for (const [x, z] of [[5, 15], [7, 15], [5, 17], [7, 17]]) if (onRoof(x, z)) {
  g.set(x, 5, z, "dark_oak_fence"); g.set(x, 6, z, "dark_oak_fence");
}
for (let x = 5; x <= 7; x++) for (let z = 15; z <= 17; z++) if (onRoof(x, z)) g.set(x, 7, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

console.log(g.save(`${DIR}/201006.0002589.nbt`));
