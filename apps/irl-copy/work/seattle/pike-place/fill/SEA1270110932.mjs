// TwoPine (formerly Broadacres Building), 1601 2nd Ave: a 1920s commercial office block of eleven storeys with a
// granite base, a brick grid of piers and glass, cream terra-cotta spandrels, a stone cornice and parapet, and a
// ground-floor shopfront with a striped awning and a recessed entrance. The roof has a set-back penthouse and units.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${DIR}/SEA1270110932.cells.json`, "utf8"));

const CORNICE = 56;   // cream terra-cotta cornice course, also the roof deck level inside
const PARAPET = 57;   // top course of the parapet
const SIZE = [10, 69, 37];

// Footprint lookup: ground height per cell, and the outward normals of the cell's exposed faces.
const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const has = (x, z) => ground.has(`${x},${z}`);
const NORMALS = { "+x": [1, 0], "-x": [-1, 0], "+z": [0, 1], "-z": [0, -1] };
const exposed = (x, z) => Object.keys(NORMALS).filter((n) => !has(x + NORMALS[n][0], z + NORMALS[n][1]));

// Storey bands from the cornice down: upper storeys are 5 blocks (spandrel, three glass rows, header).
// The ground storey runs from each cell's ground up to row 5 (base course, glass, awning row).
const UPPER = [6, 11, 16, 21, 26, 31, 36, 41, 46, 51];

const V = new Voxels(SIZE);
const pane = (n) => (n[1] === 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }   // face normal ±x: runs along z
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }); // face normal ±z: runs along x

// Interior depth (blocks in from the nearest exposed face), for placing the roof plant.
const depth = new Map();
let frontier = [...ground.keys()].filter((k) => exposed(...k.split(",").map(Number)).length);
for (const k of frontier) depth.set(k, 0);
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const k of frontier) {
    const [x, z] = k.split(",").map(Number);
    for (const [dx, dz] of Object.values(NORMALS)) {
      const nk = `${x + dx},${z + dz}`;
      if (has(x + dx, z + dz) && !depth.has(nk)) { depth.set(nk, d); next.push(nk); }
    }
  }
  frontier = next;
}

// Foundation under every footprint cell, then the walls, glazing and floors.
for (const [x, z, g] of cells) {
  for (let y = 0; y < g; y++) V.set(x, y, z, "stone_bricks");
}

for (const [x, z, g] of cells) {
  const ex = exposed(x, z);
  const shell = ex.length > 0;

  // Interior: floor slabs only (the air gap is left as air).
  if (!shell) {
    for (const f of [g, ...UPPER, CORNICE]) V.set(x, f, z, "smooth_stone");
    continue;
  }

  // A cell faces the street through the exposed face that continues along the wall (a stair step of the
  // diagonal wall has one); only a cell with no continuing face is a corner (quoins).
  const runs = (n) => (n[1] === "x" ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]])
    .some(([a, b]) => has(x + a, z + b) && exposed(x + a, z + b).includes(n));
  const primary = ex.filter(runs);
  const corner = ex.length > 1 && primary.length === 0;
  const n = primary[0] ?? ex[0];
  const along = n[1] === "x" ? z : x;               // position along the face, for the bay grid
  const pier = corner || along % 3 === 0;
  const [nx, nz] = NORMALS[n];

  for (let y = g; y <= PARAPET; y++) {
    let block = null, state = null, glass = false;

    if (y === g) block = "polished_granite";                                       // base course
    else if (y === PARAPET) block = "stone_bricks";                                 // parapet cap
    else if (y === CORNICE) block = "white_terracotta";                             // cornice
    else if (y <= 5) {                                                              // ground storey
      if (x === 9 && z >= 9 && z <= 11 && (y === g + 1 || y === g + 2)) {
        // entrance: granite jambs beside the door, the door on the middle cell
        if (z === 10) { block = "dark_oak_door"; state = { facing: "east", hinge: "left", open: "false", powered: "false", half: y === g + 1 ? "lower" : "upper" }; }
        else block = "polished_granite";
      } else if (x === 9 && z >= 9 && z <= 11 && y === g + 3) {
        block = "glass_pane"; state = pane(NORMALS[n]); glass = true;             // transom over the door
      } else if (y === 5) {
        block = corner ? "smooth_stone" : (along % 2 ? "red_wool" : "white_wool"); // striped awning
      } else if (y === g + 1 && !corner) {
        block = "polished_granite";                                                 // shopfront bulkhead
      } else if (pier) block = "polished_granite";                                  // granite shop piers
      else { block = "glass_pane"; state = pane(NORMALS[n]); glass = true; }
    } else {                                                                        // upper storeys
      const band = UPPER.findLast((b) => y >= b);
      const r = y - band;
      if (r === 0) block = "white_terracotta";                                      // spandrel
      else if (r === 4) block = "smooth_stone";                                     // header
      else if (corner) block = "stone_bricks";                                      // quoins
      else if (pier) block = "bricks";                                              // brick piers
      else { block = "glass_pane"; state = pane(NORMALS[n]); glass = true; }
    }
    V.set(x, y, z, block, state);

    // Warm light in some windows: one block inside the glass, in the air gap.
    if (glass && (x * 7 + y * 3 + z * 5) % 5 === 0) {
      const ix = x - nx, iz = z - nz;
      if (has(ix, iz) && !exposed(ix, iz).length && !UPPER.includes(y) && y !== g) {
        V.set(ix, y, iz, y < 5 ? "glowstone" : "shroomlight");
      }
    }
  }
}

// A lantern hangs in the shop, under the floor slab above the entrance.
V.set(8, 5, 10, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant: a three-by-three penthouse set back from the street at depth >= 3, two units on depth-2 cells.
const deep = [...depth].filter(([, d]) => d >= 3).map(([k]) => k.split(",").map(Number));
let best = null;
for (const [cx, cz] of deep) {
  const block = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) block.push([cx + dx, cz + dz]);
  if (block.every(([x, z]) => depth.get(`${x},${z}`) >= 3)) {
    const d = Math.hypot(cx - 4.5, cz - 18);
    if (!best || d < best.d) best = { cx, cz, d };
  }
}
if (best) {
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    for (let y = PARAPET; y <= PARAPET + 2; y++) V.set(best.cx + dx, y, best.cz + dz, "bricks");
    V.set(best.cx + dx, PARAPET + 3, best.cz + dz, "white_terracotta");
  }
  // a glazed face on the penthouse so it reads as an occupied floor, not a block
  for (let dz = -1; dz <= 1; dz++) V.set(best.cx - 1, PARAPET + 1, best.cz + dz, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
}
const units = [...depth].filter(([k, d]) => d === 2 && !(best && Math.abs(+k.split(",")[0] - best.cx) < 3 && Math.abs(+k.split(",")[1] - best.cz) < 3)).map(([k]) => k.split(",").map(Number));
for (const [x, z] of units.filter((_, i) => i % 9 === 4).slice(0, 2)) V.set(x, PARAPET, z, "iron_block");

const out = V.save(`${DIR}/SEA1270110932.nbt`);
console.log(`built SEA1270110932: ${out.blocks} blocks, ${out.palette} palette entries`);
