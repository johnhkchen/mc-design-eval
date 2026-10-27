// A 1920s brick shop block on a basalt plinth, one storey and a tall stepped parapet, in the stripped-classical style
// the Eden Terrace and Newton main streets were built in: red brick walls, cream plaster (smooth quartz) string
// courses, pilasters and cornice, dark timber shopfronts with glass panes, a central frontispiece over the street door.
// The massing follows the lidar roof read as two flat tiers (6 and 5), each cell standing on its own basalt foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020919.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..18, z 0..18

// footprint: "x,z" -> { gr: ground, r: lidar roof }
const F = new Map();
for (const [x, z, gr, r] of cells) F.set(`${x},${z}`, { gr, r });
const inF = (x, z) => F.has(`${x},${z}`);

// the lidar roof as two flat tiers, then a 3x3 mode over the footprint (ties go up) so the stair-stepped noise reads as clean tiers
const tier = new Map();
for (const [k, c] of F) tier.set(k, c.r >= 6 ? 6 : 5);
const top = new Map();
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = tier.get(`${x + dx},${z + dz}`); if (n !== undefined) votes.set(n, (votes.get(n) || 0) + 1);
  }
  let best = null;
  for (const [t, v] of votes) if (!best || v > best[1] || (v === best[1] && t > best[0])) best = [t, v];
  top.set(k, best[0]);
}

// exposed sides of a footprint cell: N is -z, S is +z, W is -x, E is +x
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));

// the street front is the south face; its door sits on the column nearest the face's middle, with room for door, lantern and canopy
const southFace = [...F.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => faces(x, z).length === 1 && faces(x, z)[0] === "S");
const midX = southFace.reduce((a, [x]) => a + x, 0) / southFace.length;
const doorCandidates = southFace.filter(([x, z]) => top.get(`${x},${z}`) >= F.get(`${x},${z}`).gr + 5);
const [doorX, doorZ] = doorCandidates.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX))[0];

const DOOR_LOWER = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };
const glassState = (face) => (face === "N" || face === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });

const g = new Voxels([19, 19, 19]);
const glazed = [];   // { x, y, z, face, shop } for every glass pane on the outside, to light from inside after

for (const [k, { gr }] of F) {
  const [x, z] = k.split(",").map(Number);
  const t = top.get(k);
  const fc = faces(x, z);

  // basalt foundation up to the ground; the interior floor is the foundation's top, or a floor slab where the ground is 0
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (fc.length === 0) {
    if (gr === 0) g.set(x, 0, z, "stone_bricks");
    g.set(x, t - 1, z, "gray_concrete");                          // roof membrane over the interior
    continue;
  }

  const f0 = fc[0];
  const along = f0 === "N" || f0 === "S" ? "x" : "z";
  const u = along === "x" ? x : z;                                 // position along the face: a pier every 4 blocks
  const corner = fc.some((d) => d === "N" || d === "S") && fc.some((d) => d === "E" || d === "W");
  const pier = corner || u % 4 === 0;
  const isDoor = x === doorX && z === doorZ;

  // the walls, bottom up: base course, shopfront (glass, pilasters, timber transom), string course, upper glass bays
  for (let y = gr; y <= t - 2; y++) {
    const rel = y - gr;
    let b, st, shop = false;
    if (rel === 0) {
      if (isDoor) [b, st] = ["dark_oak_door", DOOR_LOWER];
      else b = ["stone_bricks"];
    } else if (rel === 1) {
      shop = true;
      if (isDoor) [b, st] = ["dark_oak_door", DOOR_UPPER];
      else if (pier) b = ["smooth_quartz"];
      else { b = ["glass_pane"]; st = glassState(f0); }
    } else if (rel === 2) {
      shop = true;
      if (isDoor) [b, st] = ["lantern", { hanging: "true", waterlogged: "false" }];
      else if (pier) b = ["smooth_quartz"];
      else { b = ["glass_pane"]; st = glassState(f0); }
    } else if (rel === 3) {
      b = isDoor ? ["dark_oak_planks"] : ["smooth_quartz"];        // string course, and the canopy fascia over the door
    } else {
      if (pier) b = ["bricks"];
      else { b = ["glass_pane"]; st = glassState(f0); }
    }
    g.set(x, y, z, b[0], st);
    if (b[0] === "glass_pane") glazed.push({ x, y, z, face: f0, shop });
  }

  // a cream cornice course (full blocks, so no gap shows under the parapet), then the brick parapet with cream coping on the piers
  if (t - 1 > gr) g.set(x, t - 1, z, "smooth_quartz");
  g.set(x, t, z, pier ? "smooth_quartz" : "bricks");
}

// frontispiece: the street face's middle three columns rise one more course, with a cream crown over the door
const doorTop = top.get(`${doorX},${doorZ}`);
for (const dx of [-1, 0, 1]) {
  const k = `${doorX + dx},${doorZ}`;
  if (F.has(k) && faces(doorX + dx, doorZ).includes("S")) g.set(doorX + dx, doorTop + 1, doorZ, "bricks");
}
g.set(doorX, doorTop + 2, doorZ, "smooth_quartz");

// warm light: glowstone behind shopfront glass, shroomlight behind upper glass, in some bays only; the room behind is air
let lit = 0;
for (const w of glazed) {
  if ((w.x * 7 + w.z * 5 + w.y * 3) % 4 !== 0) continue;
  const [dx, dz] = DIRS[w.face];
  const ix = w.x - dx, iz = w.z - dz;                             // the cell behind the pane, inside the footprint
  if (!inF(ix, iz) || faces(ix, iz).length) continue;
  if (g.get(ix, w.y, iz)) continue;
  g.set(ix, w.y, iz, w.shop ? "glowstone" : "shroomlight");
  lit++;
}

// rooftop plant room: a 2x2 box of stone with a slab cap, on the roof membrane, in the interior of the flat tier
let plant = null;
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  const cs = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cs.every(([cx, cz]) => inF(cx, cz) && faces(cx, cz).length === 0 && top.get(`${cx},${cz}`) === top.get(k))) continue;
  const d = Math.hypot(x - 9, z - 7);
  if (!plant || d < plant.d) plant = { cs, d, t: top.get(k) };
}
if (plant) {
  for (const [cx, cz] of plant.cs) {
    g.set(cx, plant.t, cz, "stone_bricks");
    g.set(cx, plant.t + 1, cz, "stone_bricks");
    g.set(cx, plant.t + 2, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020919.nbt";
const info = g.save(out);
console.log(JSON.stringify({ cells: cells.length, door: [doorX, doorZ], doorTop, glazed: glazed.length, lit, plant: !!plant, ...info }));
