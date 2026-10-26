// DC86735: a 1930s stripped-classical office block on the Mall's north side. Four storeys of calcite
// (Indiana limestone) over a pink-granite base, an attic band, a 3-block tower at the centre-east and lower
// wings to the north and east. Solid massing, so nothing floats; each window is a glass pane with an air pocket
// (or a warm block) behind it, one storey = 3 blocks with a stringcourse under each.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC86735.cells.json`, "utf8"));
const W = 20, H = 30, D = 18;

// lidar per footprint cell; a cell with at most one footprint neighbour is a stub on the ragged edge, left out
const raw = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const rawAt = (x, z) => raw.has(`${x},${z}`);
const fp = new Map();
for (const [key, v] of raw) {
  const [x, z] = key.split(",").map(Number);
  if ([[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => rawAt(x + dx, z + dz)).length >= 2) fp.set(key, v);
}
const inFp = (x, z) => fp.has(`${x},${z}`);
const cellList = [...fp.keys()].map((k) => k.split(",").map(Number));
const groundOf = (x, z) => fp.get(`${x},${z}`).ground;

// flat tiers from the lidar: the tower (lidar 17-18) on the centre-east, the main block (15), lower wings (12-13)
const TOWER = (x, z) => x >= 11 && x <= 14 && z >= 5 && z <= 14;
const topOf = (x, z) => (TOWER(x, z) ? 18 : fp.get(`${x},${z}`).roof <= 13 ? 12 : 15);
const solid = (x, y, z) => inFp(x, z) && y >= 0 && y < topOf(x, z);
const exposed = (x, y, z) => [[0, -1], [0, 1], [1, 0], [-1, 0]].filter(([dx, dz]) => !solid(x + dx, y, z + dz));

const g = new Voxels([W, H, D]);

// 1. massing: foundation to the ground, then solid to each tier's top; boundary cells are the facade
for (const [x, z] of cellList) {
  const T = topOf(x, z), gr = groundOf(x, z);
  for (let y = 0; y < T; y++) {
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }
    if (!exposed(x, y, z).length) { g.set(x, y, z, "stone"); continue; }
    let block = "calcite";
    if (y === gr || y === T - 1) block = "polished_granite";        // base course and cornice
    else if (y % 3 === 0) block = "smooth_stone";                    // storey stringcourse
    g.set(x, y, z, block);
  }
}

// 2. windows: one glass pane per facade cell in the two rows above each stringcourse, piers every third column,
// an air pocket behind each pane (or a warm block in about one in six)
const panes = [];
for (const [x, z] of cellList) {
  const T = topOf(x, z), gr = groundOf(x, z);
  for (let y = gr + 1; y < T - 1; y++) {
    if (y % 3 === 0) continue;
    const ex = exposed(x, y, z);
    if (ex.length !== 1) continue;
    const [dx, dz] = ex[0];
    const ends = dz !== 0 ? [[x - 1, z], [x + 1, z]] : [[x, z - 1], [x, z + 1]];
    if (!ends.every(([a, b]) => inFp(a, b))) continue;             // corners stay piers
    if ((dz !== 0 ? x : z) % 3 === 0) continue;                    // piers
    if (z === D - 1 && x >= 14 && x <= 16) continue;               // the entrance bay
    const ix = x - dx, iz = z - dz;
    if (!inFp(ix, iz) || !solid(ix, y, iz) || exposed(ix, y, iz).length) continue;
    g.set(x, y, z, "glass_pane");
    panes.push([x, y, z, dz !== 0]);
    const lit = (x * 5 + y * 3 + z * 7) % 6 === 0;
    g.set(ix, y, iz, lit ? (x + z) % 2 ? "glowstone" : "shroomlight" : "air");
  }
}

// 3. entrance on the south face: two lower door blocks in a granite surround with a lintel, pocket behind
g.set(15, 0, 16, "air"); g.set(15, 1, 16, "air");
g.set(15, 0, D - 1, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(15, 1, D - 1, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (let y = 0; y <= 2; y++) for (const x of [14, 16]) g.set(x, y, D - 1, "polished_granite");
g.set(15, 2, D - 1, "polished_granite");

// 4. roof plant: two boxes on the main roof
for (const [x0, z0] of [[3, 3], [14, 2]]) for (let y = 15; y <= 16; y++) for (let x = x0; x <= x0 + 1; x++) for (let z = z0; z <= z0 + 1; z++) g.set(x, y, z, "smooth_stone");

// 5. panes: connect only along their wall, to glass or to the piers either side
for (const [x, y, z, ew] of panes) {
  const side = ew ? [["west", -1, 0], ["east", 1, 0]] : [["north", 0, -1], ["south", 0, 1]];
  const st = { north: "false", south: "false", east: "false", west: "false" };
  for (const [name, dx, dz] of side) st[name] = g.get(x + dx, y, z + dz) ? "true" : "false";
  g.set(x, y, z, "glass_pane", st);
}

const out = `${dir}/DC86735.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries, ${panes.length} panes`);
