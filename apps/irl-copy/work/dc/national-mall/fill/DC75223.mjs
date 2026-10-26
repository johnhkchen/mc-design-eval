// DC75223: a 1920s Classical office block in pale limestone (calcite walls, polished granite base, smooth quartz cornice),
// a stepped massing that follows the lidar roof: a 12-block core on an 11-block rim, the east wing at 10, the west at 8-9.
// Walls are one cell thick on the footprint edge and on every step down; interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75223.cells.json", "utf8"));
const [W, H, D] = [14, 24, 11];
const g = new Voxels([W, H, D]);

const byXZ = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const at = (x, z) => byXZ.get(`${x},${z}`);
const inside = (x, z) => at(x, z) !== undefined;
// a side is exposed where the neighbour is outside the footprint or stands lower (a setback step)
const exposedTo = (x, z, roof, dx, dz) => { const n = at(x + dx, z + dz); return !n || n.roof < roof; };

// bays: piers every third column on the long (x) faces and every third row on the short (z) faces
const xPier = (x) => x % 3 === 0 || x === W - 1;
const zPier = (z) => z % 3 === 0 || z === D - 1;
const DOOR_X = 9;                                  // main entrance, north face (z = 0)

const panes = new Set();
const key = (x, y, z) => `${x},${y},${z}`;
const glass = (x, y, z) => { g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" }); panes.add(key(x, y, z)); };

// footprint cells: foundations, then the facade rings, then the floor slabs and roof decks inside
const facade = new Set();
for (const [x, z, ground, roof] of cells) {
  const top = roof - 1;
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
  const nsExp = exposedTo(x, z, roof, 0, -1) || exposedTo(x, z, roof, 0, 1);
  const ewExp = exposedTo(x, z, roof, -1, 0) || exposedTo(x, z, roof, 1, 0);
  const exposed = nsExp || ewExp;
  if (exposed) {
    facade.add(`${x},${z}`);
    const pier = (nsExp && xPier(x)) || (ewExp && zPier(z));
    for (let y = ground; y <= top; y++) {
      const glassRow = y >= 2 && y <= 8 && y % 2 === 0;
      if (y === top) g.set(x, y, z, "smooth_quartz");                               // cornice / parapet
      else if (y === ground) g.set(x, y, z, "polished_granite");                    // base course
      else if (glassRow && !pier) glass(x, y, z);
      else g.set(x, y, z, "calcite");                                               // piers and spandrel bands
    }
  } else {
    // interior: the ground floor slab, a slab per storey above it, and the roof deck; air in between
    for (const y of new Set([ground, 3, 5, 7, 9, top])) if (y >= ground && y <= top) g.set(x, y, z, "smooth_stone");
  }
}

// entrance: dark oak doors in the middle bay of the north face, with a granite hood over them
g.set(DOOR_X, 2, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR_X, 3, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [DOOR_X - 1, DOOR_X, DOOR_X + 1]) g.set(x, 4, 0, "polished_granite");
panes.delete(key(DOOR_X, 2, 0));

// warm light behind some windows: a glowstone in the air cell just inside the glass (only on single-axis faces)
for (const [x, z, ground, roof] of cells) {
  for (const y of [4, 6]) {
    if (!panes.has(key(x, y, z)) || (x + 2 * z + y) % 5 !== 0) continue;
    const nsExp = exposedTo(x, z, roof, 0, -1) || exposedTo(x, z, roof, 0, 1);
    const ewExp = exposedTo(x, z, roof, -1, 0) || exposedTo(x, z, roof, 1, 0);
    if (nsExp === ewExp) continue;
    const [dx, dz] = nsExp ? [0, z === 0 ? 1 : -1] : [x === 0 ? 1 : -1, 0];
    if (!inside(x + dx, z + dz) || facade.has(`${x + dx},${z + dz}`) || y <= at(x + dx, z + dz).ground) continue;
    g.set(x + dx, y, z + dz, "glowstone");
  }
}

// roof plant: two stone-brick boxes on the core (the 12-block cells)
for (const [bx, bz] of [[4, 4], [7, 6]]) for (const dx of [0, 1]) for (const dz of [0, 1]) {
  const c = at(bx + dx, bz + dz);
  if (!c || c.roof !== 12) continue;
  for (const y of [c.roof, c.roof + 1]) g.set(bx + dx, y, bz + dz, "stone_bricks");
}

// glass panes connect to their neighbours in the wall plane (pier, pane or solid) so the grid reads as one frame
for (const k of panes) {
  const [x, y, z] = k.split(",").map(Number);
  const solid = (dx, dz) => g.get(x + dx, y, z + dz) !== null;
  const state = { north: solid(0, -1) ? "true" : "false", south: solid(0, 1) ? "true" : "false", east: solid(1, 0) ? "true" : "false", west: solid(-1, 0) ? "true" : "false", waterlogged: "false" };
  g.set(x, y, z, "glass_pane", state);
}

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75223.nbt");
console.log(JSON.stringify(out));
