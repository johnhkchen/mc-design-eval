// Building way 912170821, Eden Terrace-side street, Auckland: a three-storey brick Edwardian shop-top building.
// Red brick walls on a stone plinth, cream render bands, white sash piers, timber shopfronts on the street faces (south
// and east), a recessed door on the south face with a hanging lantern, and the south-east corner stepped up a storey
// to a flat roof behind a cream parapet. Lidar roof heights are smoothed into three flat tiers (11, 13, 15 blocks).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_912170821.cells.json", "utf8"));   // [x, z, ground, roof]
const W = 10, D = 7, H = 28;

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const NEIGH = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// tiers: roof 14+ is the top tier (15); 13 stands alone; 12 joins the 13 tier if it touches one, else the 11 tier
const top = new Map();
for (const [x, z, , r] of cells) {
  let t = r >= 14 ? 15 : r >= 13 ? 13 : 11;
  if (r === 12) t = NEIGH.some(([dx, dz]) => (raw.get(key(x + dx, z + dz)) ?? 0) >= 13) ? 13 : 11;
  top.set(key(x, z), t);
}
const has = (x, z) => top.has(key(x, z));
const inner = (x, z) => has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);

// faces in priority order (the street sides first for corner cells)
const FACES = [["south", 0, 1], ["east", 1, 0], ["north", 0, -1], ["west", -1, 0]];
const exposed = (x, z, dx, dz, y) => { const n = top.get(key(x + dx, z + dz)); return n === undefined || n <= y; };

const DOOR = { x: 5, z: 6 };   // the south-face entrance; its recess is the air cell at (5, 5)

// one facade block on a face, row y; k runs along the face (x for north/south faces, z for east/west)
function skin(name, k, T, y) {
  const front = name === "south" || name === "east";
  if (y === T - 1) return { b: "smooth_quartz" };                                                     // coping
  if (y === T - 2) return { b: "smooth_quartz_stairs", s: { facing: name, half: "top", shape: "straight", waterlogged: "false" } }; // corbel
  if (y <= 1) return { b: "stone_bricks" };                                                           // base course and plinth
  if (y === 4 || y === 8 || y === 11) return { b: "smooth_quartz" };                                  // storey lines
  if (y === 5 || y === 12) return { b: "bricks" };
  const band = (y <= 3 && front) || (y >= 6 && y <= 7) || (y >= 9 && y <= 10);                        // window rows
  if (!band) return { b: "bricks" };
  if (k % 3 === 0) return { b: y <= 3 ? "dark_oak_planks" : "white_concrete" };                       // piers and shopfront frames
  const ns = name === "north" || name === "south";
  return { b: "glass_pane", glass: true, s: ns ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
                                              : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } };
}

const plan = new Map();   // "x,y,z" -> { b, s } ; anything absent is air
const glass = [];
for (const [x, z] of cells) {
  const T = top.get(key(x, z));
  for (let y = 0; y < T; y++) {
    const faces = FACES.filter(([, dx, dz]) => exposed(x, z, dx, dz, y));
    let cell;
    if (!faces.length) cell = { b: y === T - 1 ? "smooth_stone" : "bricks" };                           // roof membrane / solid core
    else if (y === T - 1) cell = { b: "smooth_quartz" };
    else {
      const [name, dx] = faces[0];
      cell = skin(name, dx !== 0 ? z : x, T, y);
      if (cell.glass) glass.push({ x, z, y, name, dx: faces[0][1], dz: faces[0][2] });
    }
    plan.set(`${x},${y},${z}`, cell);
  }
}

// each pane looks into an air gap one cell in, floored by the storey slab; a warm light sits on that floor in some of them
for (const p of glass) {
  if (p.x === DOOR.x && p.z === DOOR.z) continue;
  const ix = p.x - p.dx, iz = p.z - p.dz;
  if (!inner(ix, iz) || top.get(key(ix, iz)) < p.y + 3) continue;
  const lo = p.y <= 3 ? 2 : p.y <= 7 ? 6 : 9;
  plan.delete(`${ix},${p.y},${iz}`);
  if (p.y === lo && (p.x * 3 + p.z * 5) % 4 === 0) plan.set(`${ix},${p.y},${iz}`, { b: "lantern", s: { hanging: "false", waterlogged: "false" } });
}

// recessed entrance: door on the south face, an air recess behind it, a hanging lantern from the recess head
const door = (half) => ({ b: "dark_oak_door", s: { facing: "south", half, hinge: "left", open: "false", powered: "false" } });
plan.set(`${DOOR.x},1,${DOOR.z}`, door("lower"));
plan.set(`${DOOR.x},2,${DOOR.z}`, door("upper"));
plan.set(`${DOOR.x},3,${DOOR.z}`, { b: "dark_oak_planks" });
for (let y = 1; y <= 3; y++) plan.delete(`${DOOR.x},${y},${DOOR.z - 1}`);
plan.set(`${DOOR.x},3,${DOOR.z - 1}`, { b: "lantern", s: { hanging: "true", waterlogged: "false" } });

// roof plant: an air-conditioning unit on the 11 tier and a short brick flue
plan.set("3,11,3", { b: "iron_block" });
plan.set("3,11,4", { b: "bricks" });
plan.set("3,12,4", { b: "bricks" });
plan.set("3,13,4", { b: "smooth_quartz" });

const g = new Voxels([W, H, D]);
for (const [k, c] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, c.b, c.s);
}
const out = g.save(DIR + "way_912170821.nbt");
console.log(`way_912170821: ${out.blocks} blocks, ${out.palette} palette entries`);
