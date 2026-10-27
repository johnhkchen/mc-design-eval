// Way 343886718, Eden Terrace / Mt Eden side: a 2.5-storey 1930s brick commercial block, flat parapet roof at 11 blocks
// (lidar roof 10 + parapet), on a slope falling 3 blocks to the west. Street front on the east face: shopfront with a
// recessed-looking door under a dark canopy. Upper floors: basalt quoins, quartz storey lines, glass-pane window bays
// with quartz sills and heads, brick piers. Foundation below grade; hollow interior (air behind the glass) with a floor
// slab per storey and a roof deck; a few glowstone lamps behind upper windows; two rooftop units on the deck.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_343886718.cells.json`, "utf8"));

const X = 20, Y = 23, Z = 38;
const STOREY = 4;
const key = (x, z) => `${x},${z}`;

// footprint: ground (lidar, lowest y 0) and roof. Roof noise is snapped to flat tiers: the body (9-10) goes to one flat
// roof at 10; the low wing (2-5) to one storey at 4. Ground stays as lidar (it drives the foundation and storey steps).
const F = new Map();
for (const [x, z, ground, roof] of cells) {
  const top = roof >= 9 ? 10 : 4;
  F.set(key(x, z), { ground, top });
}
const inF = (x, z) => F.has(key(x, z));

// perimeter cells: at least one side open to the outside; the exposed faces say which way the facade looks
const FACES = [[1, 0, "E"], [-1, 0, "W"], [0, 1, "S"], [0, -1, "N"]];
const exposed = (x, z) => FACES.filter(([dx, dz]) => !inF(x + dx, z + dz));

// the plan: every block decided first, so the glass panes can read their neighbours before anything is set
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

const SHOP_FACE = "E";
// the street-front door: the middle perimeter cell of the east face
const eastCells = [...F.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => exposed(x, z).some(([, , n]) => n === SHOP_FACE));
const eastMid = eastCells.map(([, z]) => z).sort((a, b) => a - b)[Math.floor(eastCells.length / 2)];
const doorX = Math.max(...eastCells.map(([x]) => x)), doorZ = eastMid;

for (const [k, { ground: g, top: r }] of F) {
  const [x, z] = k.split(",").map(Number);
  const faces = exposed(x, z);
  const perim = faces.length > 0;

  // foundation, below grade, under every footprint cell
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // interior: floor slab at each storey line from the ground up, roof deck on top, air between (no rooms modelled)
    for (let y = g; y < r; y++) {
      const rel = y - g;
      if (y === r - 1 || (rel % STOREY === 0)) put(x, y, z, y === r - 1 ? "stone" : "smooth_stone");
    }
    continue;
  }

  // shell: a one-block wall on the perimeter; windows, piers and bands are decided per face
  // the first open face (E, W, S, N) sets the bays; a stepped outline has cells open on two sides, so no quoin rule
  const face = faces[0];
  const along = face[0] !== 0 ? z : x;           // a face along x (E/W) runs in z, a face along z (N/S) runs in x
  const pier = along % 3 === 0;
  const street = face[2] === SHOP_FACE;

  for (let y = g; y <= r; y++) {
    const rel = y - g;
    const shopfront = street && rel < STOREY;                            // ground storey on the street face
    let b;
    if (y === r) b = "smooth_quartz";                                    // parapet cap: the top of the 11-block roof
    else if (rel === 0) b = "polished_andesite";                         // base course on the grade
    else if (y === r - 1) b = "bricks";                                  // frieze under the parapet
    else if (rel % STOREY === 0) b = "smooth_quartz";                    // storey line
    else if (rel % STOREY === STOREY - 1) b = pier ? "bricks" : "smooth_quartz"; // lintel over the window, brick at piers
    else if (pier) b = shopfront ? "dark_oak_planks" : "bricks";         // piers (shopfront timber on the street)
    else b = "glass_pane";                                               // window rows
    if (b === "glass_pane") put(x, y, z, b, { north: "false", south: "false", east: "false", west: "false" });
    else put(x, y, z, b);
  }

  // the street door and its canopy on the east face
  if (x === doorX && z >= doorZ - 1 && z <= doorZ + 1 && face[2] === SHOP_FACE && g >= 0) {
    if (z === doorZ) {
      put(x, g + 1, z, "dark_oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, g + 2, z, "dark_oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    put(x, g + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// behind some upper-floor windows: a glowstone in the air gap (the interior cell just inside the glass)
for (const [k, { ground: g, top: r }] of F) {
  const [x, z] = k.split(",").map(Number);
  const faces = exposed(x, z);
  if (faces.length !== 1 || faces[0][2] === SHOP_FACE) continue;
  const [dx, dz] = faces[0];
  const along = dx !== 0 ? z : x;
  if (along % 3 === 0 || (x + z) % 3 !== 0) continue;
  const yLamp = g + STOREY + 1;
  if (yLamp >= r - 1 || inF(x - dx, z - dz) === false) continue;
  if (at(x - dx, yLamp, z - dz)) continue;
  put(x - dx, yLamp, z - dz, "glowstone");
}

// glass panes connect to any block in their own wall plane, so the grid reads as a continuous frame
for (const [id, v] of plan) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = id.split(",").map(Number);
  const faces = exposed(x, z);
  const alongZ = faces.some(([dx]) => dx !== 0);               // on an E/W face: runs north-south
  const nb = (dx, dz) => (at(x + dx, y, z + dz) ? "true" : "false");
  v.state = alongZ
    ? { north: nb(0, -1), south: nb(0, 1), east: "false", west: "false" }
    : { north: "false", south: "false", east: nb(1, 0), west: nb(-1, 0) };
}

// rooftop units: two 2x2 plant boxes on the deck, away from the perimeter
for (const [ox, oz] of [[6, 14], [12, 26]]) {
  for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
    const x = ox + dx, z = oz + dz;
    if (!inF(x, z) || exposed(x, z).length) continue;
    const r = F.get(key(x, z)).top;
    put(x, r, z, "iron_block");
    put(x, r + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// write it
const g = new Voxels([X, Y, Z]);
for (const [id, v] of plan) {
  const [x, y, z] = id.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${FILL}/way_343886718.nbt`);
console.log(`way_343886718: ${out.blocks} blocks, ${out.palette} palette entries`);
