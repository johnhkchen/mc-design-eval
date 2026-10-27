// way 269468028: a 1930s stripped-classical commercial block in Auckland, plastered brick under cream render, shopfronts on
// the ground storey, a dark plinth, a quartz string course at every storey line and a parapet over a flat roof with a
// lift overrun. The footprint is the OSM outline; each cell is a column from its own ground (foundation below) to its
// lidar roof, smoothed into flat tiers (min one storey over its ground). The rest is solid mass with one air pocket
// behind each glass pane (lit by glowstone or shroomlight in some), so nothing floats and no interior is modelled.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269468028.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..46, z 0..56

const W = 47, H = 24, D = 57;
const key = (x, z) => x * 1000 + z;
const fp = new Map();                                    // key(x,z) -> { G, R, T }
for (const [x, z, G, R] of cells) fp.set(key(x, z), { G, R, T: 0 });
const has = (x, z) => fp.has(key(x, z));
const at = (x, z) => fp.get(key(x, z));

// roof: median of the roof heights over each cell and its footprint neighbours (lidar noise out), then snapped to flat tiers
const TIERS = [5, 7, 9, 11];
for (const [k, c] of fp) {
  const x = Math.floor(k / 1000), z = k % 1000, vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (has(x + dx, z + dz)) vals.push(at(x + dx, z + dz).R);
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  const tier = TIERS.reduce((best, t) => (Math.abs(t - med) < Math.abs(best - med) ? t : best), TIERS[0]);
  c.T = Math.max(tier, c.G + 3);                          // at least a parapet over its ground (the lidar's low cells are podium edges)
}

// which faces are outside: the neighbours missing in each direction
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([n]) => n);
const isCorner = (x, z) => { const e = exposed(x, z); return (e.includes("north") || e.includes("south")) && (e.includes("east") || e.includes("west")); };

// the main front: the face (north/south/east/west) with the most exposed cells, entrance at its middle window bay
const faceCount = { north: 0, south: 0, east: 0, west: 0 };
for (const k of fp.keys()) { const x = Math.floor(k / 1000), z = k % 1000; if (!isCorner(x, z)) for (const n of exposed(x, z)) faceCount[n]++; }
const frontFace = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0][0];
const frontCells = [...fp.keys()].map((k) => [Math.floor(k / 1000), k % 1000]).filter(([x, z]) => !isCorner(x, z) && exposed(x, z).includes(frontFace));
const along = (x, z, face) => (face === "north" || face === "south" ? x : z);
const frontAlong = frontCells.map(([x, z]) => along(x, z, frontFace)).sort((a, b) => a - b);
const doorAlong = frontAlong[Math.floor(frontAlong.length / 2)];
const doorCell = frontCells.find(([x, z]) => along(x, z, frontFace) === doorAlong) || frontCells[0];

// the block map: key "x,y,z" -> [block, state] (air is absent)
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, [block, state]);
const air = (x, y, z) => B.delete(`${x},${y},${z}`);

const WALL = "smooth_quartz", PIER = "quartz_bricks", PLINTH = "polished_andesite", FOUND = "stone_bricks", INNER = "stone";
const GLASS = "light_blue_stained_glass_pane", ROOF = "smooth_stone", PLANT = "iron_block";

for (const [k, c] of fp) {
  const x = Math.floor(k / 1000), z = k % 1000, { G, T } = c;
  const corner = isCorner(x, z), perim = exposed(x, z).length > 0;
  const single = exposed(x, z);
  for (let y = 0; y < G; y++) {                                         // foundation: nothing floats on the slope
    if (!perim) { put(x, y, z, INNER); continue; }
    if (y === 0) { put(x, y, z, FOUND); continue; }                    // the bottom course in stone
    const cut = (G - y) % 4 === 0;                                     // the downhill side's lower storeys: string courses
    const a = single.length === 1 ? along(x, z, single[0]) % 4 : -1;
    put(x, y, z, cut || [0, 3].includes(a) || corner ? PIER : WALL);
  }
  put(x, G, z, perim ? PLINTH : INNER);                                 // base course
  for (let y = G + 1; y < T - 2; y++) {
    const line = y > G && (y - G) % 4 === 0;                           // a storey line: string course on the outside
    const inner = !perim;
    const pierCol = corner || (perim && [0, 3].includes(along(x, z, exposed(x, z)[0] === "north" || exposed(x, z)[0] === "south" ? "north" : "east") % 4));
    put(x, y, z, inner ? INNER : line ? PIER : pierCol ? PIER : WALL);
  }
  // cornice band and parapet over the roof field; the field is the top solid layer at T-2 (interior) and a parapet at T-1 (outside)
  if (perim) { put(x, T - 2, z, PIER); put(x, T - 1, z, PIER); }
  else put(x, T - 2, z, ROOF);
}

// the windows: a pier at along % 4 in {0,3}, glass at {1,2}; a pocket of air behind each glass pane, one per storey
const litPocket = (x, y, z) => (x * 7 + z * 13 + y * 3) % 4 === 0;
const shroom = (x, y, z) => (x * 5 + z * 11 + y) % 13 === 0;
for (const [k, c] of fp) {
  const x = Math.floor(k / 1000), z = k % 1000, { G, T } = c;
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;                                       // corners and thin cells keep the solid pier
  const face = ex[0];
  const [nx, nz] = DIRS[face];
  const a = along(x, z, face);
  if (![1, 2].includes(a % 4)) continue;
  const bands = [[G + 1, G + 3]];                                      // ground storey: the shopfront, three rows of glass
  for (let L = G + 4; L + 2 < T - 2; L += 4) bands.push([L + 1, L + 2]); // upper storeys: two rows of glass under the spandrel
  for (let L = G - 4; L >= 0; L -= 4) bands.push([L + 1, L + 2]);       // the downhill side's lower storeys, glazed too
  const inward = [x - nx, z - nz];
  const pocketOK = has(inward[0], inward[1]) && exposed(inward[0], inward[1]).length === 0;
  const isFront = face === frontFace && x === doorCell[0] && z === doorCell[1];
  for (const [y0, y1] of bands) {
    for (let y = y0; y <= y1; y++) {
      if (y >= T - 2) continue;
      if (isFront && y <= G + 2 && y >= G + 1) {                       // the entrance: a door, lower and upper halves
        const half = y === G + 1 ? "lower" : "upper";
        const st = { facing: face, half, hinge: "left", open: "false", powered: "false" };
        put(x, y, z, "dark_oak_door", st);
        if (pocketOK) air(inward[0], y, inward[1]);
        continue;
      }
      const pane = nx === 0 ? { north: "true", south: "true", east: "false", west: "false" } : { north: "false", south: "false", east: "true", west: "true" };
      put(x, y, z, GLASS, pane);
    }
    if (pocketOK && !isFront) {
      for (let y = y0; y <= y1; y++) air(inward[0], y, inward[1]);
      if (litPocket(x, y0, z) && y1 - y0 >= 1) put(inward[0], y0 + 1, inward[1], shroom(x, y0, z) ? "shroomlight" : "glowstone");
    }
  }
  if (isFront && pocketOK) { air(inward[0], G + 1, inward[1]); air(inward[0], G + 2, inward[1]); }
}

// the door's lintel reads as a surround: the wall above it is the shopfront's transom, kept glass; the piers beside are pilasters.

// roof plant on the tallest interior roof: a lift overrun and a few air-handling units, each standing on the roof field
const interiorTall = [...fp.keys()].map((k) => [Math.floor(k / 1000), k % 1000]).filter(([x, z]) => exposed(x, z).length === 0 && at(x, z).T >= 11);
if (interiorTall.length) {
  const xs = interiorTall.map(([x]) => x), zs = interiorTall.map(([, z]) => z);
  const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2), cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
  const inOverrun = (x, z) => x >= cx - 3 && x <= cx + 2 && z >= cz - 2 && z <= cz + 1;
  for (let x = cx - 3; x <= cx + 2; x++) for (let z = cz - 2; z <= cz + 1; z++) {
    const c = at(x, z); if (!c || exposed(x, z).length) continue;
    const top = c.T - 2;
    put(x, top + 1, z, "stone_bricks"); put(x, top + 2, z, "stone_bricks");
  }
  // a cluster of four air-handling units beside the overrun, each on the roof field
  for (const [dx, dz] of [[3, 0], [3, 1], [4, 0], [4, 1]]) {
    const x = cx + dx, z = cz + dz, c = at(x, z);
    if (c && !exposed(x, z).length && !inOverrun(x, z)) put(x, c.T - 1, z, PLANT);
  }
}

// write the volume
const g = new Voxels([W, H, D]);
for (const [k, v] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v[0], v[1]);
}
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269468028.nbt");
console.log("cells", fp.size, "blocks", B.size, "front", frontFace, "door", doorCell);
