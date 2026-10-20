import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1082022";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 27, D = 5;
const g = new Voxels([W, H, D]);

// ---- footprint lookup ----
const cmap = new Map();
for (const [x, z, ground, roof] of cells) {
  cmap.set(`${x},${z}`, { ground, roof: Math.min(roof, H - 1), top: 0 });
}
const has = (x, z) => cmap.has(`${x},${z}`);
const get = (x, z) => cmap.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

function exposed(x, z) {
  return Object.keys(DIRS).filter((f) => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });
}

function put(x, y, z, b, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// ---- common storey datum: lowest ground of the footprint ----
const G = Math.min(...[...cmap.values()].map((c) => c.ground));

// ---- smooth the lidar roof: median of self + neighbours, then snap to storey lines ----
for (const [key, c] of cmap) {
  const [x, z] = key.split(",").map(Number);
  const vals = [c.roof];
  for (const [dx, dz] of Object.values(DIRS)) {
    if (has(x + dx, z + dz)) vals.push(get(x + dx, z + dz).roof);
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  let t = G + 2 * Math.round((med - G) / 2);
  t = Math.max(G + 4, Math.min(t, H - 1));
  c.top = t;
}

// window bays: odd bays along each face, never at corners
function winEligible(x, z, faces) {
  return faces.some((f) =>
    f === "north" || f === "south"
      ? x % 2 === 1 && x >= 1 && x <= W - 2
      : z % 2 === 1 && z >= 1 && z <= D - 2
  );
}

// ---- pass 1: foundation, walls, floors, cornice ----
for (const [key, c] of cmap) {
  const [x, z] = key.split(",").map(Number);
  const { ground, top } = c;

  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  const faces = exposed(x, z);
  const perim = faces.length > 0;
  const corner = faces.length >= 2;

  for (let y = ground; y < top; y++) {
    if (!perim) {
      const solid =
        y === G ||
        y >= top - 2 ||
        ((y - G) % 2 === 1 && y >= G + 3);
      if (solid) put(x, y, z, y === top - 1 ? "smooth_stone" : "stone_bricks");
      continue;
    }

    if (y === top - 1) {
      put(x, y, z, "smooth_stone");                         // parapet cap
    } else if (y === top - 2) {
      put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // cornice
    } else if (y <= G) {
      put(x, y, z, "stone_bricks");                         // base course
    } else if (y <= G + 1) {
      put(x, y, z, corner ? "stone_bricks" : "glass");      // shopfront glass
    } else if (y === G + 2) {
      put(x, y, z, corner ? "stone_bricks" : "dark_oak_planks"); // fascia
    } else {
      const k = (y - G) % 2;
      const bay = !corner && winEligible(x, z, faces);
      if (k === 1) {
        // spandrel: stone sill/lintel bands in window bays, brick elsewhere
        put(x, y, z, bay ? "stone_bricks" : "bricks");
      } else {
        put(x, y, z, bay ? "glass" : "bricks");
      }
    }
  }
}

// ---- pass 2: entrance door (north face preferred), with pilasters and lintel ----
function pickDoor(face) {
  return cells
    .filter(([x, z]) => {
      const e = exposed(x, z);
      return e.length === 1 && e[0] === face;
    })
    .sort((a, b) => {
      const ga = get(a[0], a[1]).ground, gb = get(b[0], b[1]).ground;
      if (ga !== gb) return ga - gb;
      return Math.abs(a[0] - 2.5) - Math.abs(b[0] - 2.5);
    });
}

let doorCand = pickDoor("north");
let doorFace = "north";
if (doorCand.length === 0) { doorCand = pickDoor("south"); doorFace = "south"; }
if (doorCand.length === 0) {
  const any = cells.find(([x, z]) => exposed(x, z).length === 1);
  if (any) { doorCand = [any]; doorFace = exposed(any[0], any[1])[0]; }
}

let doorInfo = null;
if (doorCand.length > 0) {
  const [dx, dz] = doorCand[0];
  const cell = get(dx, dz);
  const dy = Math.max(G + 1, cell.ground);
  doorInfo = { dx, dz, dy };

  // flanking pilasters and lintel course around the door
  const along = doorFace === "north" || doorFace === "south" ? [1, 0] : [0, 1];
  for (const s of [-1, 1]) {
    const nx = dx + along[0] * s, nz = dz + along[1] * s;
    if (!has(nx, nz)) continue;
    if (!exposed(nx, nz).includes(doorFace)) continue;
    for (let y = dy; y <= dy + 2; y++) put(nx, y, nz, "stone_bricks");
  }
  put(dx, dy + 2, dz, "stone_bricks"); // lintel over door (replaces upper door half next)

  const props = (half) => ({
    facing: doorFace,
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  put(dx, dy, dz, "oak_door", props("lower"));
  put(dx, dy + 1, dz, "oak_door", props("upper"));
}

// ---- pass 3: warm light behind glass in the interior air gap ----
for (const [key, c] of cmap) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposed(x, z);
  if (faces.length === 0) continue;
  for (const f of faces) {
    if (doorInfo && x === doorInfo.dx && z === doorInfo.dz) continue;
    const [ix, iz] = [x + INWARD[f][0], z + INWARD[f][1]];
    if (!has(ix, iz) || exposed(ix, iz).length !== 0) continue;
    const it = get(ix, iz).top;

    // shopfront glow
    if (faces.length === 1 && (x + z) % 2 === 0) {
      put(ix, G + 1, iz, "glowstone");
    }
    // upper window glow, sparse
    for (let y = G + 4; y < it - 2; y += 2) {
      if (winEligible(x, z, [f]) && !(doorInfo && x === doorInfo.dx) && (x + z + y) % 3 === 0) {
        put(ix, y, iz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
