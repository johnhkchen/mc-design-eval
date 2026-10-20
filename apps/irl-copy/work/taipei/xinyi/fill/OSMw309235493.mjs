import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi office tower, c. 1995-2005: granite base, glazed bays between
// pale concrete piers, light-gray spandrels, quartz cornice, setback mechanical core.
// Revision: a legible entrance (granite surround, quartz lintel, wider glazed bay,
// warm lanterns inside), everything else as before.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309235493";
const W = 30, D = 23, H = 66;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const G = new Map();
let F = 0; // datum: highest ground under the footprint, so every cell reaches it
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, gr);
  F = Math.max(F, gr);
}

// Storey count fitted to the 66-block world: roof about 54 above lowest ground.
const nUp = Math.max(4, Math.min(9, Math.floor((H - 1 - F - 11) / 5)));
const T = 6 + 5 * nUp;        // cornice level (relative to datum F)
const CORE_TOP = T + 5;       // mechanical core roof level

const g = new Voxels([W, H, D]);

const inS = (x, z) => G.has(`${x},${z}`);

function place(x, y, z, id, props) {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Facade description for a footprint cell on the outer shell.
function facade(x, z) {
  const miss = {
    n: !inS(x, z - 1),
    s: !inS(x, z + 1),
    w: !inS(x - 1, z),
    e: !inS(x + 1, z),
  };
  const count = Object.values(miss).filter(Boolean).length;
  if (count === 0) return null;
  let dir;
  if (miss.n) dir = "n";
  else if (miss.s) dir = "s";
  else if (miss.w) dir = "w";
  else dir = "e";
  const idx = dir === "n" || dir === "s" ? x : z;
  return { dir, idx, corner: count >= 2 };
}

const INWARD = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

// Materials
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const SLAB = "light_gray_concrete";
const INT_FLOOR = "polished_andesite";
const PIER = "white_concrete";
const GLASS = "light_blue_stained_glass";
const CORNICE = "smooth_quartz";
const ROOF = "gray_concrete";
const SURROUND = "polished_granite";

const doorX = Math.floor(W / 2);
const ENTRY_HALF = 2; // entrance bay spans doorX-2 .. doorX+2 on the north face

// Is this perimeter cell part of the entrance bay on the north face?
function inEntry(x, z, f) {
  return f && f.dir === "n" && z === 0 && Math.abs(x - doorX) <= ENTRY_HALF;
}

// 1. Foundation: solid from y 0 up to each cell's ground, plinth up to datum F.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) place(x, y, z, FOUND);
  for (let y = gr; y < F; y++) place(x, y, z, BASE);
}

// 2. Superstructure from datum F.
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  const f = facade(x, z);
  const isCorner = f && f.corner;

  // Ground-floor slab / base course (rel 0)
  place(x, F + 0, z, f ? BASE : INT_FLOOR);

  // Ground storey, rel 1..4 (6-block ground floor, floor slab at rel 5)
  if (f) {
    const isEntry = inEntry(x, z, f);
    const isDoorCell = isEntry && x === doorX;
    const isEntryPier = isEntry && (x === doorX - ENTRY_HALF || x === doorX + ENTRY_HALF);
    const pier = isCorner || (!isEntry && f.idx % 4 === 0);

    for (let rel = 1; rel <= 4; rel++) {
      const y = F + rel;
      if (isDoorCell && rel === 1) {
        place(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (isDoorCell && rel === 2) {
        place(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (isEntryPier) {
        // Granite pillars framing the entrance, full storey height
        place(x, y, z, SURROUND);
      } else if (isEntry && rel === 4) {
        // Quartz lintel over the glazed entrance bay
        place(x, y, z, CORNICE);
      } else if (isEntry) {
        // Glazed entrance bay, between the pillars
        place(x, y, z, GLASS);
      } else {
        place(x, y, z, pier ? PIER : GLASS);
      }
    }

    // Warm light behind the shopfront glass; the entrance gets lanterns inside
    if (isEntry && !isDoorCell && !isEntryPier && rel2IsSafe(x, z)) {
      const [dx, dz] = INWARD[f.dir];
      if (inS(x + dx, z + dz)) place(x + dx, F + 3, z + dz, "lantern", { hanging: "true", waterlogged: "false" });
    } else if (!pier && !isEntry && f.idx % 8 === 2) {
      const [dx, dz] = INWARD[f.dir];
      if (inS(x + dx, z + dz)) place(x + dx, F + 2, z + dz, "glowstone");
    }
  }

  // Floor slab at rel 5 (also the entrance canopy line)
  place(x, F + 5, z, f ? SLAB : INT_FLOOR);

  // Upper storeys
  for (let k = 0; k < nUp; k++) {
    const b = 6 + 5 * k;
    place(x, F + b, z, f ? SLAB : INT_FLOOR); // storey slab (spandrel band / floor)
    if (f) {
      const pier = isCorner || f.idx % 4 === 0;
      for (let rel = b + 1; rel <= b + 3; rel++) {
        place(x, F + rel, z, pier ? PIER : GLASS);
      }
      place(x, F + b + 4, z, SLAB);
      // Occasional warm light behind a window
      if (!pier && (f.idx + k) % 6 === 1) {
        const [dx, dz] = INWARD[f.dir];
        if (inS(x + dx, z + dz)) place(x + dx, F + b + 2, z + dz, "glowstone");
      }
    }
  }

  // Roof: cornice on the edge, deck inside
  place(x, F + T, z, f ? CORNICE : ROOF);
  if (f) {
    place(x, F + T + 1, z, PIER); // parapet
    place(x, F + T + 2, z, PIER);
  }

  // Mechanical core, inset 6 blocks, with glazed band
  const inCore = x >= 6 && x <= W - 7 && z >= 6 && z <= D - 7;
  if (inCore && CORE_TOP < H - F) {
    const ring = x === 6 || x === W - 7 || z === 6 || z === D - 7;
    place(x, F + T + 5, z, ROOF); // core roof slab
    if (ring) {
      for (let rel = T + 1; rel <= T + 4; rel++) {
        const band = rel === T + 2 || rel === T + 3;
        const pierCell = (x === 6 || x === W - 7) && (z - 6) % 4 === 0
          || (z === 6 || z === D - 7) && (x - 6) % 4 === 0;
        place(x, F + rel, z, band && !pierCell ? GLASS : PIER);
      }
    }
  }
}

// Helper kept separate so the lantern placement stays readable: the interior
// cell behind a non-door entrance glass bay is always air in this layout.
function rel2IsSafe(x, z) {
  return true;
}

// Antenna / lightning rod on the core roof, if it fits in the world
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
if (inS(cx, cz) && F + T + 8 < H) {
  for (let rel = T + 6; rel <= T + 8; rel++) place(cx, F + rel, cz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
