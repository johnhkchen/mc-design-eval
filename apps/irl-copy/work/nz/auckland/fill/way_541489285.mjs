// A three-storey 1920s brick commercial block: a stone plinth, rendered (white) string courses and cornice, brick
// walls with timber-look glazing in white mullioned bays, a shopfront ground floor with a central door, and a flat
// roof with two plant boxes. The lidar roof is taken in tiers (14 / 13 / 10 / 8) so the east half rises a storey
// higher and the wings step down; each cell's storeys count from its own ground, so the downhill side shows more.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_541489285.cells.json", "utf8"));
const g = new Voxels([24, 27, 41]);

// lidar roof -> flat tiers; never lower than 4 blocks above its own ground (one storey)
const tier = (r) => (r >= 14 ? 14 : r >= 12 ? 13 : r >= 10 ? 10 : 8);
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(`${x},${z}`, { g: ground, top: tier(roof) });
// one pass of neighbour-majority on the tiers (ties go high): lidar noise makes single-cell teeth otherwise
const raw = new Map([...cell].map(([k, c]) => [k, c.top]));
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  const votes = new Map([[c.top, 1]]);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const t = raw.get(`${x + dx},${z + dz}`); if (t !== undefined) votes.set(t, (votes.get(t) || 0) + 1); }
  const best = [...votes].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  c.top = Math.max(best, c.g + 4);                                       // never lower than one storey above its own ground
}
const at = (x, z) => cell.get(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a side is exposed to air where there is no neighbouring cell, or the neighbour stops below this height
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || y >= n.top; });

// the front (north, low z) entrance: the exposed front cell nearest the middle of the front
const front = [...cell.entries()].filter(([k]) => { const [x, z] = k.split(",").map(Number); return exposed(x, cell.get(k).g + 1, z).some(([dx, dz]) => dz === -1); })
  .map(([k]) => Number(k.split(",")[0]));
const doorX = front.length ? Math.round(front.reduce((a, b) => a + b, 0) / front.length) : 12;
const doorZ = (() => { let best = null; for (const [k, c] of cell) { const [x, z] = k.split(",").map(Number); if (x === doorX && (best === null || z < best)) best = z; } return best; })();
const isDoor = (x, y, z) => x === doorX && z === doorZ && (y === at(x, z).g + 1 || y === at(x, z).g + 2);

for (const [k, { g: gr, top }] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");          // foundation up to the ground
  for (let y = gr; y < top; y++) {
    const rel = y - gr, storey = Math.floor(rel / 4), row = rel % 4;
    const faces = exposed(x, y, z);
    if (!faces.length) {                                                  // interior: air, floor slab per storey, roof cap
      if (row === 0 || y === top - 1) g.set(x, y, z, "smooth_stone");
      continue;
    }
    const [dx] = faces[0];
    const s = dx !== 0 ? z : x;                                          // position along this face
    if (y === top - 1) { g.set(x, y, z, "white_concrete"); continue; }   // cornice / parapet cap
    if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }          // base course on the ground
    if (row === 0) { g.set(x, y, z, "white_concrete"); continue; }       // string course at each floor line
    if (row === 3) { g.set(x, y, z, "bricks"); continue; }               // spandrel under the next floor line
    if (storey === 0) {                                                  // shopfront: glazed bays between piers
      if (faces[0][1] === -1 && isDoor(x, y, z)) { g.set(x, y, z, "oak_door", { facing: "north", half: row === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      const nearDoor = faces[0][1] === -1 && z === doorZ && Math.abs(x - doorX) <= 1;
      if (nearDoor || s % 4 === 0) { g.set(x, y, z, "stone_bricks"); continue; }
      g.set(x, y, z, "glass_pane"); continue;
    }
    if (s % 4 === 3) { g.set(x, y, z, "bricks"); continue; }            // brick pier between bays
    if (s % 4 === 0) { g.set(x, y, z, "white_concrete"); continue; }    // white window surround
    g.set(x, y, z, "glass_pane");
  }
}

// warm light: a lamp standing on each storey's floor slab just inside some windows
for (const [k, { g: gr, top }] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = gr + 1; y < top - 1; y += 4) {
    const rel = y - gr; if (rel % 4 !== 1) continue;
    for (const [dx, dz] of exposed(x, y, z)) {
      if (!g.get(x, y, z) || g.get(x, y, z).block !== "minecraft:glass_pane") continue;
      if ((x * 7 + y * 3 + z * 5) % 5 !== 0) continue;
      const ix = x - dx, iz = z - dz;
      const inner = at(ix, iz);
      if (inner && y >= inner.g && y < inner.top && !exposed(ix, y, iz).length && !g.get(ix, y, iz)) g.set(ix, y, iz, "glowstone");
      break;
    }
  }
}

// roof plant: two air-conditioning boxes on the top tier, standing on the roof cap
const plant = [...cell].filter(([k, c]) => c.top >= 13 && !exposed(...k.split(",").map(Number), c.top - 1).length)
  .map(([k]) => k.split(",").map(Number)).filter(([x, z]) => x % 5 === 2 && z % 5 === 2).slice(0, 2);
for (const [x, z] of plant) g.set(x, at(x, z).top, z, "iron_block");

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_541489285.nbt");
console.log(JSON.stringify({ blocks, palette, door: [doorX, doorZ], plant: plant.length }));
