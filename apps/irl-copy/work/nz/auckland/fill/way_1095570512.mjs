// Way 1095570512: a two-storey brick shop with a stone cornice and parapet, from the lidar record (roof 6 above y 0
// on every footprint cell, ground flat at 0). Built as a shell: a one-cell brick wall with an air gap behind every
// window, a smooth floor slab at y 3 and a roof deck at the top of the roof height. The front (south and east edges)
// gets a stone-pillared shopfront with a door; quoins mark the corners; warm lanterns stand behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1095570512.cells.json`, "utf8"));

const [X, Y, Z] = [9, 19, 7];
const g = new Voxels([X, Y, Z]);

const FLOOR = 3;                                   // storey line / upper floor slab (y)
const FACES = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];
const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => foot.has(`${x},${z}`);
const exposed = (x, z) => FACES.filter(([, dx, dz]) => !inF(x + dx, z + dz));
const edge = (x, z) => exposed(x, z).length > 0;

// the shopfront door sits on the middle of the south-facing run
const southRun = [...foot.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => exposed(x, z).some(([f]) => f === "south")).sort((a, b) => a[0] - b[0]);
const [doorX, doorZ] = southRun[Math.floor(southRun.length / 2)];

const plan = new Map();                            // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const lantern = { hanging: "false", waterlogged: "false" };

const windows = [];                                // { x, y, z, face } to be given pane connections once all is placed

for (const [key, { ground: G, roof: R }] of foot) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposed(x, z);
  const isEdge = faces.length > 0;
  const front = faces.some(([f]) => f === "south" || f === "east");
  const deck = R - 1;
  const along = faces.length === 1 ? (["north", "south"].includes(faces[0][0]) ? x : z) : -1;
  const [ix, iz] = faces.length === 1 ? [x - faces[0][1], z - faces[0][2]] : [0, 0];
  const windowable = faces.length === 1 && inF(ix, iz) && !edge(ix, iz) && along % 2 === 1;

  // foundation: solid from y 0 up to this cell's ground (flat here, so nothing to fill)
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  for (let y = G; y < R; y++) {
    if (!isEdge) {
      if (y === G || y === FLOOR || y === deck) put(x, y, z, "smooth_stone");
      if (y === G + 1 && y < FLOOR && (x + z) % 4 === 0) put(x, y, z, "lantern", lantern); // interior lantern on the floor
      continue;
    }
    if (y === G || y === deck || y === FLOOR) { put(x, y, z, "stone_bricks"); continue; }  // plinth, cornice, string course
    const ground = y < FLOOR;
    if (ground && front && x === doorX && z === doorZ && (y === 1 || y === 2)) {
      const half = y === 1 ? "lower" : "upper";
      put(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (windowable && ground && front && (y === 1 || y === 2)) {
      if (along % 4 === 1 && y === 1) put(ix, y, iz, "lantern", lantern);    // warm light behind the shop glass
      put(x, y, z, "glass_pane"); windows.push({ x, y, z, face: faces[0][0] });
      continue;
    }
    if (ground && front && (y === 1 || y === 2)) { put(x, y, z, "stone_bricks"); continue; }  // shopfront pillar
    if (windowable && (ground || y > FLOOR)) {
      if (along % 4 === 1 && y === G + 1 && ground) put(ix, y, iz, "lantern", lantern);
      if (along % 4 === 1 && y === FLOOR + 1) put(ix, y, iz, "lantern", lantern);
      put(x, y, z, "glass_pane"); windows.push({ x, y, z, face: faces[0][0] });
      continue;
    }
    put(x, y, z, "bricks");
  }

  // parapet: one course above the roof deck on the outer edge, with a chiselled merlon every third cell
  if (isEdge) put(x, R, z, along % 3 === 0 ? "chiseled_stone_bricks" : "stone_bricks");
}

// pane connections: a pane joins the neighbours along its wall (panes and solid blocks), never across the air gap
const solid = (x, y, z) => plan.has(`${x},${y},${z}`);
for (const { x, y, z, face } of windows) {
  const along = ["north", "south"].includes(face)
    ? { east: solid(x + 1, y, z), west: solid(x - 1, y, z), north: false, south: false }
    : { north: solid(x, y, z - 1), south: solid(x, y, z + 1), east: false, west: false };
  const state = Object.fromEntries(Object.entries(along).map(([k, v]) => [k, String(v)]));
  plan.get(`${x},${y},${z}`).state = { ...state, waterlogged: "false" };
}

for (const [k, { block, state }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const { blocks, palette } = g.save(`${DIR}/way_1095570512.nbt`);
console.log(`way_1095570512.nbt: ${blocks} blocks, palette ${palette}`);
