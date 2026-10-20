import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764468217";
const W = 17, H = 62, D = 41;
const ROOF = 50;      // roof deck level (lidar: ~50 above lowest ground)
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(Math.round(gr), ROOF - 5)));
}
const inFp = (x, z) => ground.has(key(x, z));
const footprint = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});

const FACES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exteriorFaces = (x, z) =>
  Object.keys(FACES).filter((f) => {
    const [dx, dz] = FACES[f];
    return !inFp(x + dx, z + dz);
  });

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Palette: 1990s-2000s Taipei office tower - white concrete and tile, pale
// frames, blue-green reflective glass, granite base, gray roof.
const FACADE = "white_concrete";
const FRAME = "light_gray_concrete";
const GLASS = "cyan_stained_glass_pane";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const ROOFMAT = "gray_concrete";
const COPING = "smooth_stone_slab";

// ---- 1. foundations, floor slabs, roof deck (interior + everything) ----------
for (const { x, z, gr } of footprint) {
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
  for (let b = gr; b < ROOF; b += STOREY) put(x, b, z, FRAME);
  put(x, ROOF, z, ROOFMAT);
}

// ---- 2. perimeter walls: base course, window bays, spandrels ------------------
const perim = footprint.filter((c) => exteriorFaces(c.x, c.z).length > 0);

for (const { x, z, gr } of perim) {
  // base course at the first storey slab
  put(x, gr, z, BASE);
}

for (const { x, z, gr } of perim) {
  const ex = exteriorFaces(x, z);
  const corner =
    (ex.includes("north") || ex.includes("south")) &&
    (ex.includes("east") || ex.includes("west"));
  const face = ex[0];
  const alongX = face === "north" || face === "south"; // wall runs east-west
  const idx = alongX ? x : z;
  const pane = alongX ? PANE_EW : PANE_NS;
  const mullion = corner || idx % 3 === 0;

  for (let b = gr; b < ROOF; b += STOREY) {
    const top = Math.min(b + STOREY - 1, ROOF - 1);
    for (let y = b + 1; y <= top; y++) {
      const r = y - b;
      if (r === STOREY - 1) {
        put(x, y, z, FACADE); // spandrel / storey line
      } else if (mullion) {
        put(x, y, z, FRAME);  // mullion / pillar
      } else {
        put(x, y, z, GLASS, pane);
      }
    }
  }
}

// ---- 3. entrance on the north (street) face near the middle --------------------
const doorCands = perim.filter((c) => exteriorFaces(c.x, c.z).includes("north"));
if (doorCands.length) {
  doorCands.sort((a, b) => Math.abs(a.x - 8) - Math.abs(b.x - 8) || a.z - b.z);
  const d = doorCands[0];
  const dx = d.x, dz = d.z, dgr = d.gr;
  put(dx, dgr + 1, dz, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(dx, dgr + 2, dz, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // canopy / entrance lintel over the door, along the north face
  for (const c of doorCands) {
    if (Math.abs(c.x - dx) <= 2) {
      put(c.x, c.gr + 3, c.z, "dark_oak_slab", { type: "top", waterlogged: "false" });
    }
  }
}

// ---- 4. warm lights behind some glass (inside the air gap) ---------------------
for (const { x, z, gr } of perim) {
  const ex = exteriorFaces(x, z);
  if (ex.length !== 1) continue; // skip corners
  const face = ex[0];
  const [fdx, fdz] = FACES[face];
  const ix = x - fdx, iz = z - fdz; // inward neighbour
  if (!inFp(ix, iz) || exteriorFaces(ix, iz).length) continue;
  for (let b = gr; b < ROOF; b += STOREY) {
    const y = b + 2;
    if (y >= ROOF - 1) continue;
    if ((x + z + b) % 4 === 0 && (x % 3 !== 0 || (face === "east" || face === "west") && z % 3 !== 0)) {
      put(ix, y, iz, "glowstone");
    }
  }
}

// ---- 5. parapet and coping on the roof edge ----------------------------------
for (const { x, z } of perim) {
  put(x, ROOF + 1, z, FACADE);
  put(x, ROOF + 2, z, FACADE);
  put(x, ROOF + 3, z, COPING, { type: "bottom", waterlogged: "false" });
}

// ---- 6. roof plant penthouse, set back from the edges ------------------------
const PH = { x0: 4, x1: 12, z0: 12, z1: 28, y0: ROOF + 1, y1: ROOF + 6, cap: ROOF + 7 };
let phOk = true;
for (let x = PH.x0; x <= PH.x1; x++)
  for (let z = PH.z0; z <= PH.z1; z++)
    if (!inFp(x, z)) phOk = false;

if (phOk) {
  for (let x = PH.x0; x <= PH.x1; x++) {
    for (let z = PH.z0; z <= PH.z1; z++) {
      const edge = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
      for (let y = PH.y0; y <= PH.y1; y++) {
        if (edge) {
          const louvre = y >= PH.y0 + 1 && y <= PH.y1 - 1 && (x + z + y) % 2 === 0;
          put(x, y, z, louvre ? GLASS : "smooth_quartz",
            louvre ? (x === PH.x0 || x === PH.x1 ? PANE_NS : PANE_EW) : undefined);
        }
      }
      put(x, PH.cap, z, "smooth_quartz");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
