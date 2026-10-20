import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise late-20th-century Xinyi commercial block: stone-clad base,
// white precast-concrete piers and spandrels, blue-tinted glazing, a
// lit shopfront with a canopy-fronted entrance, a flat roof with a
// parapet and a small mechanical penthouse. Roof deck at y=20 (21 blocks).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280235";
const W = 20, H = 33, D = 16;
const ROOF = 20;          // top course of the building shell (roof deck / parapet)
const STOREY = 5;         // blocks per storey
const SHOP = 4;           // ground-storey band height

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const G = new Map();
for (const [x, z, gr] of cells) G.set(key(x, z), gr);
const lowest = Math.min(...G.values());
const ground = (x, z) => G.get(key(x, z)) - lowest;
const has = (x, z) => G.has(key(x, z));

// Which outward faces this cell sits on (neighbour missing from footprint).
const faceOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};
// Position along the face (x for north/south walls, z for east/west walls).
const tpos = (face, x, z) => (face === "north" || face === "south" ? x : z);
// Step from a perimeter cell toward the building interior.
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Entrance: middle cell of the south (z-max) face.
const southCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => faceOf(x, z).includes("south"))
  .sort((a, b) => a[0] - b[0]);
const doorCell = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;
const doorT = doorCell ? doorCell[0] : null;
const isDoor = (x, z) => doorCell && x === doorCell[0] && z === doorCell[1];

// Pass 1: foundations, interior floors and roof deck.
for (const [cx, cz, raw] of cells) {
  const x = cx, z = cz;
  const gr = raw - lowest;
  const faces = faceOf(x, z);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (faces.length === 0) {
    // Interior: floor slab at grade and each storey line; roof deck on top.
    for (let y = gr; y <= ROOF; y++) {
      if (y === ROOF) put(x, y, z, "light_gray_concrete");
      else if (y === gr || y % STOREY === 0) put(x, y, z, "smooth_stone");
    }
  }
}

// Pass 2: facade on perimeter cells.
for (const [cx, cz] of cells) {
  const x = cx, z = cz;
  const faces = faceOf(x, z);
  if (faces.length === 0) continue;
  const gr = ground(x, z);
  const face = faces[0];
  const corner = faces.length > 1;
  const t = tpos(face, x, z);
  const pillar = corner || t % 3 === 0;

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, "white_concrete"); continue; }

    // Shopfront storey.
    if (y < gr + SHOP) {
      if (isDoor(x, z) && (y === gr || y === gr + 1)) {
        const half = y === gr ? "lower" : "upper";
        put(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      // Canopy over the entrance.
      if (face === "south" && doorT !== null && y === gr + 3 && Math.abs(t - doorT) <= 1) {
        put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      if (y === gr + 3) { put(x, y, z, "light_gray_concrete"); continue; }
      put(x, y, z, pillar ? "polished_granite" : "glass");
      continue;
    }

    // Upper storeys: spandrel, transom, and window bays between white piers.
    const r = y % STOREY;
    if (r === 0) put(x, y, z, "white_concrete");
    else if (r === 4) put(x, y, z, "light_gray_concrete");
    else {
      if (pillar) { put(x, y, z, "white_concrete"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      // Warm light just inside some lit windows.
      if (((x * 7 + z * 13 + y * 3) % 11) === 0) {
        const [dx, dz] = inward[face];
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && faceOf(ix, iz).length === 0) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Pass 3: rooftop mechanical penthouse on the interior roof deck.
for (const [cx, cz] of cells) {
  const x = cx, z = cz;
  if (faceOf(x, z).length) continue;
  if (x >= 7 && x <= 12 && z >= 5 && z <= 10) {
    put(x, ROOF + 1, z, "gray_concrete");
    put(x, ROOF + 2, z, "gray_concrete");
    put(x, ROOF + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
