// Way 326735507 (Auckland, Mt Eden view): no OSM tags, so the record is the lidar footprint and roof heights.
// Read as a 1930s stripped-classical commercial block: three storeys of cream render on a bluestone plinth, pilasters
// between window bays, a cornice and parapet, a shopfront with a central entrance on the street (+x, +z) side, and roof plant.
// Tiers: lidar roof >= 16 is the main block (parapet to 17); lower cells (15) are wings that stop at 14.
// Interior is an air gap behind every window; floor slabs stand on columns on a 6-cell grid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_326735507.cells.json`, "utf8"));

const X = 25, Y = 30, Z = 18;
const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
const inFp = (x, z) => raw.has(key(x, z));
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const ext = (x, z) => N4.filter(([dx, dz]) => !inFp(x + dx, z + dz));           // outward faces of a footprint cell
const isEdge = (x, z) => ext(x, z).length > 0;
const cellsArr = [...raw.values()];

// tiers: a cell follows the majority of itself and its neighbours, so the skyline steps in clean tiers, not per-cell noise
const main = new Set();
for (const c of cellsArr) {
  let votes = c.roof >= 16 ? 1 : 0, total = 1;
  for (const [dx, dz] of N4) { const n = raw.get(key(c.x + dx, c.z + dz)); if (n) { total++; if (n.roof >= 16) votes++; } }
  if (votes * 2 > total || (votes * 2 === total && c.roof >= 16)) main.add(key(c.x, c.z));
}

// columns on a 6-cell grid carry the storey slabs over the interior air
const isColumn = (x, z) => [6, 12, 18].includes(x) && [6, 12].includes(z) && inFp(x, z) && !isEdge(x, z);

// street side: the +x / +z faces. The entrance is a window-bay cell nearest the middle of that frontage.
const frontageAlong = (c) => (c.faces[0][0] ? c.z : c.x);
const edgeCells = cellsArr.filter((c) => isEdge(c.x, c.z)).map((c) => ({ ...c, faces: ext(c.x, c.z) }));
const street = edgeCells.filter((c) => c.faces.length === 1 && (c.faces[0][0] === 1 || c.faces[0][1] === 1));
const mid = street.reduce((s, c) => s + frontageAlong(c), 0) / Math.max(1, street.length);
const entrance = street
  .filter((c) => frontageAlong(c) % 4 !== 0)
  .sort((a, b) => Math.abs(frontageAlong(a) - mid) - Math.abs(frontageAlong(b) - mid))[0];
const entranceKey = entrance ? key(entrance.x, entrance.z) : null;

// roof plant: a 4 x 3 block of interior main-roof cells nearest the centre
let plant = null;
for (let x0 = 0; x0 < X - 3 && !plant; x0++) {
  for (let z0 = 0; z0 < Z - 2; z0++) {
    const ok = [...Array(4).keys()].every((i) => [...Array(3).keys()].every((j) => {
      const x = x0 + i, z = z0 + j;
      return inFp(x, z) && !isEdge(x, z) && main.has(key(x, z)) && !isColumn(x, z);
    }));
    if (ok) { const d = Math.abs(x0 + 1.5 - 12) + Math.abs(z0 + 1 - 8); if (!plant || d < plant.d) plant = { x0, z0, d }; }
  }
}
const plantCell = (x, z) => plant && x >= plant.x0 && x < plant.x0 + 4 && z >= plant.z0 && z < plant.z0 + 3;

const storeys = [3, 7, 11];               // floor slab layers; each storey's interior is the three layers above
const lights = [];                        // [x, y, z, block, state], set after the walls, before the columns

for (const c of cellsArr) {
  const { x, z, ground } = c;
  const isMain = main.has(key(x, z));
  const faces = ext(x, z);
  const edge = faces.length > 0;
  const corner = faces.length >= 2;

  // foundation to grade, then a bluestone plinth up to the ground-floor slab (no floating cell)
  for (let y = 0; y < 3; y++) put(x, y, z, y < ground ? "stone" : "stone_bricks");

  // floor slabs: quartz string courses on the edge, smooth stone inside
  for (const s of storeys) put(x, s, z, edge ? "smooth_quartz" : "smooth_stone");

  for (const s of storeys) {
    const ground1 = s === 3;
    if (!edge) {
      if (!isMain && s === 11) put(x, 14, z, "smooth_stone");      // wing roof deck (lidar 15 tier)
      if (isMain && s === 11) put(x, 15, z, "smooth_stone");       // main roof deck, carries the plant
      continue;
    }
    const [dx, dz] = faces[0];
    const alongZ = dx !== 0;                                       // normal ±x runs along z
    const along = alongZ ? z : x;
    const pier = corner || (ground1 ? along % 4 === 0 : along % 3 === 0);
    const isEntrance = ground1 && key(x, z) === entranceKey;

    if (isEntrance) {
      const facing = dx === 1 ? "east" : dx === -1 ? "west" : dz === 1 ? "south" : "north";
      const door = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
      put(x, s + 1, z, "dark_oak_door", door("lower"));
      put(x, s + 2, z, "dark_oak_door", door("upper"));
      put(x, s + 3, z, "stone_bricks");                           // canopy band over the door
      continue;
    }
    if (pier) {
      for (let y = s + 1; y <= s + 3; y++) put(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }
    const st = alongZ
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    put(x, s + 1, z, "glass_pane", st);
    put(x, s + 2, z, "glass_pane", st);
    put(x, s + 3, z, "stone_bricks");                             // lintel

    // warm light behind every fourth window, in the air gap inside the glass
    const ix = x - dx, iz = z - dz;
    if (inFp(ix, iz) && !isEdge(ix, iz) && !isColumn(ix, iz) && (x * 5 + z * 3 + s) % 4 === 0) {
      lights.push([ix, s + 1, iz, ground1 ? "lantern" : "glowstone", ground1 ? { hanging: "false", waterlogged: "false" } : undefined]);
    }
  }

  // main block: cornice and parapet on the edge; the roof deck inside is at 15, the air above is walkable
  if (edge && isMain) {
    put(x, 15, z, "smooth_quartz");
    put(x, 16, z, "stone_bricks");
  }
}

for (const [x, y, z, block, state] of lights) put(x, y, z, block, state);

// columns hold the slabs over the interior (interior cells only, between slab layers)
for (const c of cellsArr) {
  const { x, z } = c;
  if (!isColumn(x, z)) continue;
  const top = main.has(key(x, z)) ? 14 : 13;
  for (let y = 4; y <= top; y++) if (![7, 11].includes(y)) put(x, y, z, "quartz_pillar", { axis: "y" });
}

// roof plant on the main roof: a 2-high box in the centre of the interior roof
if (plant) for (let x = plant.x0; x < plant.x0 + 4; x++) for (let z = plant.z0; z < plant.z0 + 3; z++) {
  if (!plantCell(x, z)) continue;
  put(x, 16, z, "smooth_stone");
  put(x, 17, z, "smooth_stone");
}

const info = g.save(`${DIR}/way_326735507.nbt`);
console.log(JSON.stringify({ footprint: cells.length, main: main.size, entrance: entranceKey, plant, lights: lights.length, ...info }));
