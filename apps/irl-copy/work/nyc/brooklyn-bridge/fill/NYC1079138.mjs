import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1079138";
const W = 9, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const raw = new Map();
for (const [x, z, gr, roof] of cells) {
  raw.set(`${x},${z}`, { ground: Math.max(0, Math.round(gr)), roofRaw: roof });
}
const has = (x, z) => raw.has(`${x},${z}`);

// Smooth lidar roofs into clean 2-block tiers around the building's median roof
const roofs = [...raw.values()].map(c => c.roofRaw).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
const cell = new Map();
for (const [key, c] of raw) {
  const [x, z] = key.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(`${x + dx},${z + dz}`);
    if (o) { sum += o.roofRaw; n++; }
  }
  const sm = sum / n;
  let roof = Math.round(med + 2 * Math.round((sm - med) / 2));
  roof = Math.max(roof, c.ground + 3);
  roof = Math.min(roof, H - 2);
  cell.set(key, { ground: c.ground, roof });
}

// Outward face of a perimeter cell: N (z-1), S (z+1), W (x-1), E (x+1)
function outFace(x, z) {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const facingOf = { N: "north", S: "south", W: "west", E: "east" };
const alongU = (face, x, z) => (face === "N" || face === "S" ? x : z);

// ---- safe setter ------------------------------------------------------------
function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// ---- main entrance: north-facing wall cell nearest the centre, else any -----
let door = null;
{
  let best = Infinity;
  for (const [key] of cell) {
    const [x, z] = key.split(",").map(Number);
    if (outFace(x, z) === "N") {
      const d = Math.abs(x - (W - 1) / 2);
      if (d < best) { best = d; door = { x, z, face: "N" }; }
    }
  }
  if (!door) {
    for (const [key] of cell) {
      const [x, z] = key.split(",").map(Number);
      const f = outFace(x, z);
      if (f) { door = { x, z, face: f }; break; }
    }
  }
}
const isDoorCell = (x, z, face) =>
  door && x === door.x && z === door.z && face === door.face;

// Pier on every third bay so the window grid reads as wide bays, not checker noise
const isPier = (u) => u % 3 === 0;

// ---- build -------------------------------------------------------------------
for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  const { ground, roof } = c;
  const top = roof - 1;           // last solid course; cornice sits here
  const face = outFace(x, z);     // null for interior cells
  const u = face ? alongU(face, x, z) : 0;

  // foundation fill up to this cell's ground
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  for (let y = ground; y <= top; y++) {
    const r = y - ground;

    // roof deck / cornice
    if (y === top) {
      if (face) put(x, y, z, "smooth_stone");
      else put(x, y, z, "stone_bricks");
      continue;
    }

    // interior: floor slabs and air only (no interiors)
    if (!face) {
      if (r === 0 || (r >= 3 && (r - 3) % 2 === 0)) put(x, y, z, "smooth_stone");
      continue;
    }

    const doorHere = isDoorCell(x, z, face);

    if (r === 0) {
      put(x, y, z, "smooth_stone");                       // base course
    } else if (r <= 2) {
      // ground-floor shopfront: wood-framed glazing, entrance door
      if (doorHere) {
        const facing = facingOf[face];
        if (r === 1) put(x, y, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
        if (r === 2) put(x, y, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (isPier(u)) {
        put(x, y, z, "dark_oak_planks");                   // timber pier
      } else {
        put(x, y, z, "glass_pane");                        // shop glazing
      }
    } else {
      // upper storeys: 2-block pitch with stone storey lines
      if (doorHere && r === 3) {
        put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); // door hood
      } else if ((r - 3) % 2 === 0) {
        put(x, y, z, "smooth_stone");                      // storey line / lintel band
      } else if (isPier(u)) {
        put(x, y, z, "bricks");                            // brick pier
      } else {
        put(x, y, z, "glass_pane");                        // window
        // some windows lit from behind
        if ((u * 5 + r * 3) % 7 === 0) {
          const [dx, dz] = inward[face];
          const ix = x + dx, iz = z + dz;
          if (has(ix, iz) && !outFace(ix, iz)) put(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // continuous brick parapet above the cornice on the street shell
  if (face) put(x, top + 1, z, "bricks");
}

g.save(`${DIR}/${ID}.nbt`);
