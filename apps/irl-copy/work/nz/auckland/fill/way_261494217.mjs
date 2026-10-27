// A 1930s stripped-classical brick commercial block, four storeys over a shopfront, with a lower three-storey wing on its
// west side and a small plant room on the roof. Built from the footprint cells only: [x, z, ground, roof] per cell.
// Brick walls, cream render for the storey bands, the cornice and the piers' quoins; glass in the windows, a glass
// shopfront with a striped awning on the street face, and warm light behind some windows and inside the shop.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const raw = JSON.parse(readFileSync(`${DIR}/way_261494217.cells.json`, "utf8"));

// the lidar roof wobbles by a block or two: snap it to the two flat tiers (the 4-storey block and the lower wing)
const snap = (r) => (r >= 16 ? 17 : 14);
const cells = raw.map(([x, z, ground, roof]) => ({ x, z, ground, roof: snap(roof) }));
const byXZ = new Map(cells.map((c) => [`${c.x},${c.z}`, c]));
const inF = (x, z) => byXZ.has(`${x},${z}`);
// the outward faces of a cell: a face is outward where the neighbour is off the footprint
const faces = (x, z) => ({ N: !inF(x, z - 1), S: !inF(x, z + 1), W: !inF(x - 1, z), E: !inF(x + 1, z) });
const isPerim = (x, z) => Object.values(faces(x, z)).some(Boolean);

const g = new Voxels([17, 30, 21]);

// the street front: the south face on the far (z >= 19) edge; its middle cell is the entrance
const front = cells.filter((c) => faces(c.x, c.z).S && c.z >= 19).sort((a, b) => a.x - b.x);
const isFront = (c) => front.includes(c);
const door = front[Math.floor(front.length / 2)];

const lamps = [];
for (const c of cells) {
  const { x, z, ground, roof } = c;
  const base = ground + 1, top = roof - 1;             // walls start on the foundation, the roof slab sits at top
  const f = faces(x, z);
  const corner = (f.N || f.S) && (f.E || f.W);
  const pier = (f.N || f.S) ? x % 3 === 1 : z % 3 === 1; // pilasters between window pairs, along the face
  const perim = isPerim(x, z);

  for (let y = 0; y <= ground; y++) g.set(x, y, z, "stone_bricks");   // foundation: solid down to the ground

  for (let y = base; y <= top; y++) {
    const rel = y - base, k = Math.floor(rel / 4), row = rel % 4;     // a storey is a slab row then three air rows
    let b = null;
    if (!perim) {
      if (y === top || row === 0) b = "smooth_stone";                   // floor slabs and roof, air between
    } else if (y === top) b = "smooth_quartz";                          // cornice
    else if (row === 0) b = y === base ? "stone_bricks" : "smooth_quartz"; // base course, then string courses
    else if (row === 3) b = isFront(c) && k === 0 ? (x % 2 ? "red_concrete" : "white_concrete") : "bricks";  // brick head over each window
    else if (isFront(c) && k === 0) b = "glass";                        // shopfront glazing, no piers
    else if (corner) b = "smooth_quartz";
    else if (pier) b = "bricks";
    else b = "glass_pane";
    if (b) g.set(x, y, z, b);

    // a warm light behind some upper windows: on the inside cell, one block in from the wall
    if (perim && row === 2 && b === "glass_pane" && (x + 2 * z + k) % 4 === 0) {
      const [dx, dz] = f.N ? [0, 1] : f.S ? [0, -1] : f.W ? [1, 0] : [-1, 0];
      const ic = byXZ.get(`${x + dx},${z + dz}`);
      if (ic && !isPerim(ic.x, ic.z) && ic.roof - 1 > y) lamps.push([ic.x, y, ic.z, "glowstone"]);
    }
  }

  // the roof: a parapet one block above the cornice
  if (perim) g.set(x, roof, z, "smooth_quartz");
}

// shopfront: lanterns just inside the glass, and the entrance door (two blocks high) in the middle of the front
for (const c of front) {
  if (c.x % 3 !== 0 || c === door) continue;
  const ic = byXZ.get(`${c.x},${c.z - 1}`);
  if (ic && !isPerim(ic.x, ic.z)) lamps.push([ic.x, c.ground + 2, ic.z, "lantern", { hanging: "false" }]);
}
for (const [x, y, z, block, state] of lamps) g.set(x, y, z, block, state);
const doorState = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(door.x, door.ground + 2, door.z, "oak_door", { ...doorState, half: "lower" });
g.set(door.x, door.ground + 3, door.z, "oak_door", { ...doorState, half: "upper" });

// roof plant room: a 4 x 4 box of stone bricks on the flat 17-tier roof, nearest the middle of the block
const inner = (x, z) => inF(x, z) && !isPerim(x, z);
let pr = null;
for (const c of cells) {
  if (c.roof !== 17) continue;
  const block = [];
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) block.push([c.x + dx, c.z + dz]);
  if (!block.every(([x, z]) => inner(x, z) && byXZ.get(`${x},${z}`).roof === 17)) continue;
  const d = Math.abs(c.x + 1.5 - 8) + Math.abs(c.z + 1.5 - 10);
  if (!pr || d < pr.d) pr = { x: c.x, z: c.z, d };
}
if (pr) {
  const R = 17;
  for (let dx = 0; dx < 4; dx++) for (let dz = 0; dz < 4; dz++) {
    const edge = dx === 0 || dx === 3 || dz === 0 || dz === 3;
    const corner = (dx === 0 || dx === 3) && (dz === 0 || dz === 3);
    g.set(pr.x + dx, R + 3, pr.z + dz, "smooth_quartz");                      // roof cap
    if (!edge) continue;                                                        // the inside stays air
    g.set(pr.x + dx, R, pr.z + dz, "stone_bricks");
    g.set(pr.x + dx, R + 1, pr.z + dz, corner ? "stone_bricks" : "glass_pane");
    g.set(pr.x + dx, R + 2, pr.z + dz, "stone_bricks");
  }
}

const out = `${DIR}/way_261494217.nbt`;
console.log(g.save(out), { door: [door.x, door.z], plantRoom: pr && [pr.x, pr.z] });
