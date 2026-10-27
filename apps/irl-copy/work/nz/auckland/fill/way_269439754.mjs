import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A two-storey Edwardian/inter-war brick commercial block on Mt Eden Road-style frontage:
// a shopfront storey on the street, an upper storey of sash windows, a smooth-stone cornice, and a
// taller stair/plant tower (roof >= 9) on the high side. Footprint from the lidar cell list.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439754.cells.json", "utf8"));
const g = new Voxels([28, 23, 54]);

const key = (x, z) => `${x},${z}`;
const fp = new Map(cells.map(([x, z, gd, rf]) => [key(x, z), { g: gd, r: rf }]));
const inFp = (x, z) => fp.has(key(x, z));

// 5x5 mean of the lidar roof over the footprint: smooths noise into flat tiers (main roof 8, tower 10)
const MAIN = 8, TOWER = 10;
const smoothR = (x, z) => { let s = 0, n = 0; for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const c = fp.get(key(x + dx, z + dz)); if (c) { s += c.r; n++; } } return s / n; };

const FACES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const cellsOut = [];
for (const [x, z, G] of cells.map(([x, z, gd]) => [x, z, gd])) {
  const sr = smoothR(x, z), tier = sr >= 9;
  const R = Math.max(tier ? TOWER : MAIN, G + 4), T = R - 1;             // T = top course (cornice / deck)
  const exposed = Object.keys(FACES).filter(f => !inFp(x + FACES[f][0], z + FACES[f][1]));
  cellsOut.push({ x, z, G, T, tier, exposed });
}
const byKey = new Map(cellsOut.map(c => [key(c.x, c.z), c]));
const tierCount = cellsOut.filter(c => c.tier).length;

const ROLE = (y, G, T) => {
  if (y === T) return "cap";
  const rel = y - G;
  if (rel === 0) return "base";
  if (rel <= 2) return "shop";
  if (rel === 3) return "fas";
  if (rel === 4) return "sill";
  if (rel <= 6) return "upper";
  if (rel === 7) return "lint";
  return "wall";
};

// the entrance: on the north (street) face, the exposed cell nearest the middle of the frontage
const doorCell = cellsOut.filter(c => c.exposed.includes("N") && !c.tier)
  .sort((a, b) => Math.abs(a.x - 14) - Math.abs(b.x - 14))[0];

// foundation, floors, roof deck, storey walls
for (const c of cellsOut) {
  const { x, z, G, T, tier, exposed } = c;
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");                  // plinth down to the lowest ground
  if (exposed.length === 0) {
    for (let y = G; y <= T; y++) {
      if (tier) g.set(x, y, z, "stone_bricks");                                // the tower is a solid core: nothing floats
      else if (ROLE(y, G, T) === "base" || ROLE(y, G, T) === "sill" || y === T) g.set(x, y, z, "smooth_stone");   // floor slabs + roof deck
    }
    continue;
  }
  for (let y = G; y <= T; y++) {
    const role = ROLE(y, G, T);
    const corner = exposed.length > 1;
    // along-face index: x on N/S faces, z on E/W faces
    const face = exposed[0], i = face === "N" || face === "S" ? x : z;
    let glass = false;
    if (!corner && role === "shop") glass = i % 4 !== 0;
    if (!corner && role === "upper") glass = i % 3 !== 0;
    if (glass) {
      const pane = face === "N" || face === "S"
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, "glass_pane", pane);
      // a warm lamp in some windows, set just inside the glass
      const [dx, dz] = FACES[face].map(v => -v), ix = x + dx, iz = z + dz;
      if (inFp(ix, iz) && (x * 31 + z * 17 + y * 7) % 5 === 0 && !byKey.get(key(ix, iz))?.tier) {
        g.set(ix, y, iz, (x + y) % 2 ? "glowstone" : "shroomlight");
      }
      continue;
    }
    if (role === "cap") g.set(x, y, z, "smooth_sandstone_slab", { type: "top", waterlogged: "false" });
    else if (role === "base") g.set(x, y, z, "polished_blackstone");          // volcanic basalt base course
    else if (role === "shop") g.set(x, y, z, "stripped_dark_oak_log", { axis: "y" });    // timber shop piers
    else if (role === "fas") g.set(x, y, z, "smooth_sandstone");   // cream stringcourse over the shopfronts
    else if (role === "sill") g.set(x, y, z, "smooth_sandstone_slab", { type: "bottom", waterlogged: "false" });
    else if (role === "lint") g.set(x, y, z, "smooth_sandstone");
    else g.set(x, y, z, "bricks");
  }
}

// entrance door (two-high) with a dark-oak fascia canopy over it, on the street face
if (doorCell) {
  const { x, z, G } = doorCell;
  g.set(x, G + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, G + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) if (inFp(x + dx, z)) g.set(x + dx, G + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}

// roof plant rooms (3x3 solid boxes, two high, capped with a slab) on the flat main roof, spaced apart
const roofOK = (x0, z0) => { for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) { const c = byKey.get(key(x0 + dx, z0 + dz)); if (!c || c.exposed.length || c.tier || c.T !== MAIN - 1) return false; } return true; };
const plant = [];
for (const c of cellsOut) if (plant.length < 3 && roofOK(c.x, c.z) && !plant.some(([px, pz]) => Math.abs(px - c.x) < 7 && Math.abs(pz - c.z) < 7)) plant.push([c.x, c.z]);
for (const [x0, z0] of plant) {
  const T = MAIN - 1;
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 3; dx++) {
    g.set(x0 + dx, T + 1, z0 + dz, "stone_bricks");
    g.set(x0 + dx, T + 2, z0 + dz, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269439754.nbt");
console.log(JSON.stringify({ footprint: cells.length, tower: tierCount, door: doorCell ? [doorCell.x, doorCell.z] : null, plant, ...stats }));
