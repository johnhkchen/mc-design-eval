// Way 912170799: a two-storey Edwardian brick shop block with a one-storey rear wing, 12 x 7 blocks, roof ~11 above
// its lowest ground. Ground floor is a timber shopfront on the south face (z 5, x 3..8) with a central door; upper storey
// is a brick grid of glass panes with a stone string course, a cornice and a coped parapet. The footprint is hollow:
// each storey is a floor slab over the whole footprint and the rooms behind the glass are air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170799.cells.json", "utf8"));
const g = new Voxels([12, 23, 7]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const top = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => top.has(`${x},${z}`);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];                 // N, S, W, E (z grows south)
const edge = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));

// Window bays: along each exposed face run, piers at the ends and every third cell, glass between.
// A face run of two gets one window; a corner cell takes a window if any of its faces does.
const lines = new Map();
for (const key of top.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (const [dx, dz] of DIRS) if (!inF(x + dx, z + dz)) {
    const k = `${dx},${dz},${dz ? z : x}`;
    if (!lines.has(k)) lines.set(k, []);
    lines.get(k).push({ x, z, dx, dz, a: dz ? x : z });
  }
}
const winFace = new Map();                                       // "x,z" -> the exposed face that carries its window
for (const list of lines.values()) {
  list.sort((p, q) => p.a - q.a);
  let start = 0;
  for (let i = 1; i <= list.length; i++) {
    if (i < list.length && list[i].a === list[i - 1].a + 1) continue;
    const run = list.slice(start, i); start = i; const n = run.length;
    run.forEach((f, j) => {
      const win = n === 2 ? j === 0 : j > 0 && j < n - 1 && j % 3 === 1;
      if (win && !winFace.has(`${f.x},${f.z}`)) winFace.set(`${f.x},${f.z}`, f);
    });
  }
}

// Shopfront on the ground floor of the south run (z 5, x 3..8): piers at the ends, glazing, a door at x 5.
const SHOP = { 3: "pier", 4: "glass", 5: "door", 6: "glass", 7: "glass", 8: "pier" };
const pane = (f) => (f.dz
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });

for (const [key, { ground, roof }] of top) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");   // foundation fill (none: this lot is level at y 0)
  const main = roof >= 10;
  const isEdge = edge(x, z);
  put(x, 0, z, "stone_bricks");                                    // plinth course and ground floor slab
  if (main) {
    put(x, 4, z, "smooth_stone");                                  // first floor slab, the string course at the edge
    put(x, 8, z, isEdge ? "smooth_stone" : "stone");               // cornice at the edge, roof deck inside
    if (isEdge) {
      put(x, 3, z, "smooth_stone");                                // storey line over the ground floor
      for (const y of [1, 2, 5, 6, 7]) put(x, y, z, "bricks");
      put(x, 9, z, "bricks");                                      // parapet
      put(x, 10, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });  // coping
    } else {
      put(x, 9, z, "stone");                                       // roof surface, tar-grey
    }
  } else if (isEdge) {                                             // one-storey wing
    put(x, 3, z, "smooth_stone");
    for (const y of [1, 2]) put(x, y, z, "bricks");
    put(x, 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    put(x, 3, z, "stone");                                         // wing deck
    put(x, 4, z, "stone");                                         // wing roof surface
  }
}

// Openings: windows on the chosen face, shopfront and door on the south run.
for (const [key, { roof }] of top) {
  const [x, z] = key.split(",").map(Number);
  if (!edge(x, z)) continue;
  const main = roof >= 10;
  const wf = winFace.get(key);
  const winRows = main ? [1, 2, 5, 6] : [1, 2];
  if (wf) for (const y of winRows) put(x, y, z, "glass_pane", pane(wf));
  if (z === 5 && SHOP[x]) {
    if (SHOP[x] === "glass") for (const y of [1, 2]) put(x, y, z, "glass");
    if (SHOP[x] === "door") {
      const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
      put(x, 1, z, "dark_oak_door", { ...door, half: "lower" });
      put(x, 2, z, "dark_oak_door", { ...door, half: "upper" });
    }
    put(x, 3, z, "dark_oak_planks");                               // timber fascia over the shopfront
  }
}

// Warm light behind some glass: lanterns on the upper floor, glowstone on the ground floor, all in the air behind a pane.
for (const [key, f] of winFace) {
  const [x, z] = key.split(",").map(Number);
  const ix = x - f.dx, iz = z - f.dz;
  if (!inF(ix, iz) || edge(ix, iz)) continue;
  if ((x + z) % 2 === 0) put(ix, 5, iz, "lantern", { hanging: "false", waterlogged: "false" });
  if ((x + z) % 3 === 0) put(ix, 1, iz, "glowstone");
}
// Shop lights hang from the first-floor slab, visible through the display glass.
for (const x of [4, 7]) put(x, 3, 4, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant: a 2 x 2 housing on the main roof, clear of the parapet.
for (const [x, z] of [[5, 2], [6, 2], [5, 3], [6, 3]]) {
  put(x, 10, z, "light_gray_concrete");
  put(x, 11, z, "light_gray_concrete");
  put(x, 12, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_912170799.nbt";
console.log(g.save(out));
