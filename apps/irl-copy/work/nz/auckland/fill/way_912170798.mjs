// Way 912170798, Eden Terrace / Newton edge: a 1930s brick shop-top block on a basalt plinth, two storeys over a shopfront,
// stepped to the lidar roof heights (10 blocks, with the 8 and 4 corners as lower wings). Walls are the footprint's
// perimeter cells; interior cells are air with floor slabs at ground, first floor and roof, so the glass has air behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_912170798.cells.json`, "utf8"));
const g = new Voxels([10, 23, 8]);

// the footprint: G = the ground under the cell (y of its first block), R = the lidar roof height above y 0
const F = new Map(cells.map(([x, z, G, R]) => [`${x},${z}`, { G, R }]));
const has = (x, z) => F.has(`${x},${z}`);
const openSides = (x, z) => ({ W: !has(x - 1, z), E: !has(x + 1, z), N: !has(x, z - 1), S: !has(x, z + 1) });
const perimeter = (x, z) => { const o = openSides(x, z); return o.W || o.E || o.N || o.S; };
const corner = (x, z) => { const o = openSides(x, z); return (o.W || o.E) && (o.N || o.S); };

// the south face (z = 7) carries the entrance; the door sits on the lowest street-side cell
const DOOR = [2, 7];
// bays along a face: two glass bays, then a brick pier (index % 3 == 0)
const faceIndex = (x, z) => { const o = openSides(x, z); return o.N || o.S ? x : z; };
const isBay = (x, z) => faceIndex(x, z) % 3 !== 0;
// glass panes connect along their own face
const pane = (x, z) => {
  const o = openSides(x, z);
  return o.N || o.S
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

// the facade of a perimeter cell at height y: [block, state] or null for the door (handled apart)
function facade(x, y, z, R) {
  if (y <= 1) return ["polished_basalt"];                      // basalt plinth and shopfront riser
  if (y === R - 1) return corner(x, z) || isBay(x, z) ? ["stone_bricks"] : ["chiseled_stone_bricks"];   // parapet: piers capped in chiselled stone
  if (corner(x, z)) return ["stone_bricks"];                    // quoins, full height
  if (y === 2 || y === 3 || y === 6 || y === 7) return isBay(x, z) ? ["glass_pane", pane(x, z)] : ["bricks"];
  if (y === 5) return isBay(x, z) ? ["white_concrete"] : ["smooth_stone"];                // string course; painted sills under the bays
  if (y === 4 || y === 8) return ["smooth_stone"];                                       // fascia and head course, unbroken
  return null;
}

for (const [key, { G, R }] of F) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < G; y++) g.set(x, y, z, "polished_basalt");   // foundation fill up to the ground

  if (!perimeter(x, z)) {
    // inside: a floor slab per storey and the roof slab; air between, no interior
    g.set(x, G, z, "smooth_stone");
    if (R - 2 > 5) g.set(x, 5, z, "smooth_stone");
    g.set(x, R - 2, z, "light_gray_concrete");   // roof membrane, light enough not to read as a hole where it shows over a lower wing
    continue;
  }

  for (let y = G; y < R; y++) {
    if (x === DOOR[0] && z === DOOR[1] && (y === 2 || y === 3)) {
      const half = y === 2 ? "lower" : "upper";
      g.set(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (x === DOOR[0] && z === DOOR[1] && y === 4) { g.set(x, y, z, "smooth_stone"); continue; }  // entrance lintel
    const f = facade(x, y, z, R);
    if (f) g.set(x, y, z, f[0], f[1]);
  }
}

// warm light behind some glass: a lantern standing on the inside floor, in the air gap behind the pane
const LANTERN = { hanging: "false", waterlogged: "false" };
for (const [key, { R }] of F) {
  const [x, z] = key.split(",").map(Number);
  if (!perimeter(x, z) || corner(x, z) || !isBay(x, z) || (x === DOOR[0] && z === DOOR[1])) continue;
  const o = openSides(x, z);
  const [ix, iz] = o.N ? [x, z + 1] : o.S ? [x, z - 1] : o.W ? [x + 1, z] : [x - 1, z];
  if (!has(ix, iz) || perimeter(ix, iz)) continue;
  const inner = F.get(`${ix},${iz}`);
  if ((x + z) % 3 === 0) g.set(ix, inner.G + 1, iz, "lantern", LANTERN);                   // ground-floor shop light
  else if ((x + z) % 3 === 1 && inner.R - 2 > 6) g.set(ix, 6, iz, "lantern", LANTERN);     // first-floor light
}

// roof plant on the tall interior cells: an air-cooled plant box and a stair core over the parapet line
for (const [x, z] of [[3, 3], [4, 3]]) if (has(x, z) && !perimeter(x, z) && F.get(`${x},${z}`).R === 10) g.set(x, 9, z, "light_gray_concrete");
if (has(6, 3) && !perimeter(6, 3)) { g.set(6, 9, 3, "stone_bricks"); g.set(6, 10, 3, "stone_bricks"); }

const out = g.save(`${DIR}/way_912170798.nbt`);
console.log(`way_912170798: ${cells.length} footprint cells, ${out.blocks} blocks, ${out.palette} palette entries`);
