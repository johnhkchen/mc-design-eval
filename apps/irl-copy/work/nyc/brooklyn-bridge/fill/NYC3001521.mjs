import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001521";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 1980 two-family red-brick infill, three storeys on a stone base, with
// stone string courses at each floor line, punched window bays, a central
// entrance with pilasters and an entry step, and a stone-brick parapet.
const W = 10, H = 19, D = 5;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellsN = cells.map(c => [Math.round(c[0]), Math.round(c[1]), Math.round(c[2]), Math.round(c[3])]);
const inFoot = new Map();
for (const c of cellsN) inFoot.set(key(c[0], c[1]), c);

const xs = cellsN.map(c => c[0]);
const zs = cellsN.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const midX = (minX + maxX) / 2;
const midZ = (minZ + maxZ) / 2;

// Smooth lidar roof heights: clamp to within 2 blocks of the median so one
// noisy cell cannot stick up as a stray column.
const roofSorted = cellsN.map(c => c[3]).sort((a, b) => a - b);
const roofMed = roofSorted[Math.floor(roofSorted.length / 2)];
for (const c of cellsN) {
  c[3] = Math.min(roofMed + 2, Math.max(roofMed - 2, c[3]));
  if (c[3] < c[2] + 4) c[3] = c[2] + 4; // at least three storeys' worth of wall
}

// Collected voxel operations so later passes can override earlier ones.
const ops = new Map();
function put(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  ops.set(`${x},${y},${z}`, [block, props]);
}

// Exterior faces: N = z-1, S = z+1, W = x-1, E = x+1.
function facesOf(x, z) {
  return {
    N: !inFoot.has(key(x, z - 1)),
    S: !inFoot.has(key(x, z + 1)),
    W: !inFoot.has(key(x - 1, z)),
    E: !inFoot.has(key(x + 1, z)),
  };
}
const faceList = f => ["N", "S", "W", "E"].filter(k => f[k]);
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const outwardFacing = { N: "north", S: "south", W: "east", E: "west" };
outwardFacing.W = "west";
outwardFacing.E = "east";
const opposite = { N: "S", S: "N", W: "E", E: "W" };

// Pass 0: foundations and structure. Interior cells first, perimeter later.
const perimCells = [];
for (const [x, z, gr, rf] of cellsN) {
  const top = rf - 1;
  const f = facesOf(x, z);
  const perim = faceList(f).length > 0;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    for (let y = gr; y <= top; y++) {
      if ((y - gr) % 2 === 0 || y === top) put(x, y, z, "smooth_stone");
    }
  } else {
    perimCells.push({ x, z, gr, top, f });
  }
}

// Entrance: the front face nearest the middle, preferring north then south.
let door = null;
{
  const prio = { N: 0, S: 1, W: 2, E: 3 };
  let best = Infinity;
  for (const p of perimCells) {
    const faces = faceList(p.f);
    if (!faces.length) continue;
    const face = faces.slice().sort((a, b) => prio[a] - prio[b])[0];
    const u = (face === "N" || face === "S") ? p.x : p.z;
    const mid = (face === "N" || face === "S") ? midX : midZ;
    const score = prio[face] * 100 + Math.abs(u - mid);
    if (score < best) {
      best = score;
      door = { x: p.x, z: p.z, gr: p.gr, top: p.top, face };
    }
  }
}

const perimSet = new Set(perimCells.map(p => key(p.x, p.z)));

// Pass 1: perimeter walls, base course, string courses, windows, lights, parapet.
for (const p of perimCells) {
  const { x, z, gr, top, f } = p;
  const faces = faceList(f);

  for (let y = gr; y < top; y++) {
    const off = y - gr;
    if (off === 0) { put(x, y, z, "stone_bricks"); continue; }      // base course
    if (off % 2 === 0) { put(x, y, z, "stone_bricks"); continue; }  // floor-line string course
    put(x, y, z, "bricks");                                         // window row
  }

  // Parapet: stone-brick wall caps that connect to neighbouring parapet cells.
  const conn = {};
  for (const d of ["N", "S", "E", "W"]) {
    const [dx, dz] = inward[d].map(v => -v);
    const nb = key(x + dx, z + dz);
    conn[d === "N" ? "north" : d === "S" ? "south" : d === "E" ? "east" : "west"] =
      perimSet.has(nb) ? "low" : "none";
  }
  put(x, top, z, "stone_brick_wall", { ...conn, up: "true", waterlogged: "false" });

  // Window bays: one exposed face, alternating columns, away from corners.
  if (faces.length === 1) {
    const face = faces[0];
    const u = (face === "N" || face === "S") ? x : z;
    if (u % 2 === 1) {
      const paneProps = (face === "N" || face === "S")
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      for (let y = gr + 1; y < top; y += 2) {
        put(x, y, z, "glass_pane", paneProps);
        const [dx, dz] = inward[face];
        const ix = x + dx, iz = z + dz;
        const isInterior = inFoot.has(key(ix, iz)) && faceList(facesOf(ix, iz)).length === 0;
        if (isInterior && (x + z + y) % 2 === 0) {
          put(ix, y, iz, "glowstone");   // warm light behind the glass
        }
      }
    }
  }
}

// Pass 2: entrance. Door, stone-brick pilasters either side, lintel and a
// warm lantern above, and a stone entry step on the inside.
if (door) {
  const { x, z, gr, face } = door;
  const props = half => ({
    facing: outwardFacing[face], half, hinge: "left", open: "false", powered: "false",
  });
  put(x, gr + 1, z, "oak_door", props("lower"));
  put(x, gr + 2, z, "oak_door", props("upper"));
  put(x, gr + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Pilasters on the wall cells flanking the door (same face, same rows).
  const along = (face === "N" || face === "S") ? [1, 0] : [0, 1];
  for (const s of [-1, 1]) {
    const px = x + along[0] * s, pz = z + along[1] * s;
    if (!perimSet.has(key(px, pz))) continue;
    const pc = perimCells.find(p => p.x === px && p.z === pz);
    if (!pc) continue;
    for (let y = gr + 1; y <= gr + 2; y++) put(px, y, pz, "chiseled_stone_bricks");
  }

  // Entry step inside the door, plus a lantern on the lintel line.
  const [dx, dz] = inward[face];
  const sx = x + dx, sz = z + dz;
  if (inFoot.has(key(sx, sz))) {
    put(sx, gr + 1, sz, "stone_brick_stairs", {
      facing: outwardFacing[opposite[face]] === undefined ? "north" :
        { north: "south", south: "north", east: "west", west: "east" }[outwardFacing[face]],
      half: "bottom", shape: "straight", waterlogged: "false",
    });
  }
  put(x, gr + 2, z, "oak_door", { facing: outwardFacing[face], half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 4, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// Apply all operations.
for (const [k, [block, props]] of ops) {
  const [x, y, z] = k.split(",").map(Number);
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

g.save(`${DIR}/${ID}.nbt`);
