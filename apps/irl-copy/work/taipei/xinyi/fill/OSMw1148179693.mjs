import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw1148179693: no record, so read as a 1990s-2000s Taipei mid-rise
// (4 storeys, about 21 blocks to roof). White concrete frame, pale spandrels,
// tinted glass in vertical bays, a shopfront base, and a rooftop plant core.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1148179693";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 21, H = 33, D = 34;
const g = new Voxels([W, H, D]);

const ROOF = 21;        // roof surface sits 21 blocks above lowest ground
const STOREY = 5;       // blocks per storey
const MAX_GROUND = ROOF - 6;

const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
for (const [x, z, gc] of cells) {
  groundOf.set(key(x, z), Math.max(0, Math.min(MAX_GROUND, Math.round(gc))));
}
const has = (x, z) => groundOf.has(key(x, z));
const groundAt = (x, z) => groundOf.get(key(x, z));

// Outward normals of exposed faces for a footprint cell.
function exposedFaces(x, z) {
  const f = [];
  if (!has(x - 1, z)) f.push([-1, 0]);
  if (!has(x + 1, z)) f.push([1, 0]);
  if (!has(x, z - 1)) f.push([0, -1]);
  if (!has(x, z + 1)) f.push([0, 1]);
  return f;
}

// Front = street face at the minimum z edge; entrance on its median x.
const minZ = Math.min(...cells.map(([, z]) => z));
const frontXs = cells
  .filter(([x, z]) => z === minZ && has(x, z - 1) === false)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : null;

const GLASS = "light_blue_stained_glass_pane";
const PIER = "white_concrete";
const SPANDREL = "light_gray_concrete";
const FLOOR = "smooth_stone";
const CORNICE = "smooth_stone";
const FOUND = "stone_bricks";

// Pass 1: foundations, floors, walls, roof deck.
for (const [x, z] of cells) {
  const ground = groundAt(x, z);
  const faces = exposedFaces(x, z);
  const ext = faces.length > 0;

  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, FOUND);

  // Window bay index runs along the exposed face.
  const alongX = faces.length && faces[0][0] === 0; // face is N/S, index by x
  const idx = ext ? (alongX ? x : z) : 0;

  for (let y = ground; y < ROOF; y++) {
    if (y === ROOF - 1) {
      g.set(x, y, z, ext ? CORNICE : SPANDREL);
      continue;
    }
    const k = Math.min(3, Math.floor(y / STOREY));
    const r = y - STOREY * k;

    if (!ext) {
      // Interior: only floor slabs; the air between them is the storey void.
      if (y === ground || r === 0) g.set(x, y, z, FLOOR);
      continue;
    }

    let block;
    if (r === 0) block = k === 0 ? FLOOR : SPANDREL;             // storey line
    else if (r === 1) block = k === 0 ? FLOOR : PIER;            // sill / plinth
    else if (r === 4) block = k === 0 ? PIER : SPANDREL;         // lintel spandrel
    else {                                                        // r = 2, 3: glazing
      const pier = idx % 3 === 0;
      block = pier ? PIER : GLASS;
    }
    g.set(x, y, z, block);
  }
}

// Pass 2: entrance on the street face (two blocks tall, above the base course).
if (doorX !== null) {
  const dz = minZ;
  const dg = groundAt(doorX, dz);
  for (const [dy, half] of [[dg + 1, "lower"], [dg + 2, "upper"]]) {
    if (dy < ROOF - 1) {
      g.set(doorX, dy, dz, "dark_oak_door", {
        facing: "north",
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
    }
  }
  // Small shopfront canopy-style fascia above the door, sitting on the wall.
  const fy = dg + 3;
  if (fy < ROOF - 1) g.set(doorX, fy, dz, "smooth_stone");
}

// Pass 3: warm light behind some glazing (glowstone one block inside the shell).
for (const [x, z] of cells) {
  const faces = exposedFaces(x, z);
  if (!faces.length) continue;
  const ground = groundAt(x, z);
  const [nx, nz] = faces[0];
  const alongX = nx === 0;
  const idx = alongX ? x : z;
  if (idx % 3 === 0 || idx % 6 !== 1) continue; // only some window bays

  const ix = x - nx, iz = z - nz;
  if (!has(ix, iz) || exposedFaces(ix, iz).length) continue;
  const innerGround = groundAt(ix, iz);

  for (let k = 0; k < 4; k++) {
    if (k % 2 === 1) continue; // every other storey
    const y = STOREY * k + 2;
    if (y <= ground || y <= innerGround || y >= ROOF - 1) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Pass 4: rooftop plant core on the deck, kept inset from the parapet.
const CORE = { x0: 7, x1: 13, z0: 10, z1: 23 };
for (let x = CORE.x0; x <= CORE.x1; x++) {
  for (let z = CORE.z0; z <= CORE.z1; z++) {
    if (!has(x, z)) continue;
    const perim = x === CORE.x0 || x === CORE.x1 || z === CORE.z0 || z === CORE.z1;
    if (perim) {
      g.set(x, ROOF, z, PIER);
      g.set(x, ROOF + 1, z, GLASS);
    }
    g.set(x, ROOF + 2, z, SPANDREL); // plant-room roof slab
  }
}

g.save(`${DIR}/${ID}.nbt`);
