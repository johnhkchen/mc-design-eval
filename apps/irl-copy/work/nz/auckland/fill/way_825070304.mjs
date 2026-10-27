// way 825070304: a two-storey interwar brick commercial block (c.1920s, Auckland Eden Terrace / Mt Eden main-road
// type): red brick walls, cream plaster bands (lintel, sill belt, cornice, parapet piers), a timber shopfront with a
// door on the downhill NW face. The lidar roof is level at 8 across the footprint (five edge readings of 3-6 are rim
// noise and are flattened), so the massing is one flat tier: two 4-block storeys, a cornice at 7, a brick parapet at 8.
// The slope runs NW (ground 0-1) to SE (ground 3): the foundation fills y 0..ground-1, the downhill side shows both
// storeys and the uphill side is one storey standing on its plinth.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_825070304.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_825070304.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const K = (x, z) => `${x},${z}`;
const XZ = (key) => key.split(",").map(Number);
const groundAt = new Map();
for (const [x, z, ground] of cells) groundAt.set(K(x, z), ground);
const inF = (x, z) => groundAt.has(K(x, z));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "south", S: "north", W: "east", E: "west" };   // a door faces into the building
const outsOf = (x, z) => Object.keys(DIRS).filter((d) => !inF(x + DIRS[d][0], z + DIRS[d][1]));

// Storey lines (absolute, since the roof is level): ground storey 0..3 (floor at the cell's ground), upper storey
// 4..7 (floor slab at 4, roof deck at 7), parapet at 8. Interior air sits between the slabs.
const ROOF = 8, BELT = 4, CORNICE = 7, PARAPET = 8;

// Shopfront: the downhill NW face (ground 0-1) on the outside of the W and N runs.
const shop = new Set();
for (const key of groundAt.keys()) {
  const [x, z] = XZ(key);
  const outs = outsOf(x, z);
  if (outs.length === 1 && groundAt.get(key) <= 1 && (outs[0] === "N" || outs[0] === "W")) shop.add(key);
}
// One entrance, in the middle of the longest shop run (the W face), with lanterns on the bays either side.
const wRun = [...shop].map(XZ).filter(([x, z]) => outsOf(x, z).join() === "W").sort((a, b) => a[1] - b[1]);
const doorCell = wRun.length ? wRun[Math.floor(wRun.length / 2)] : null;
const doorKey = doorCell ? K(...doorCell) : null;
const lanternKeys = new Set(doorCell ? [K(doorCell[0], doorCell[1] - 1), K(doorCell[0], doorCell[1] + 1)] : []);

const g = new Voxels([32, 21, 14]);
const panes = [];   // glass panes: their connections are set once every block is in place
const glazed = [];  // glass cells that may get a warm light set in the air behind them

for (const [key, ground] of groundAt) {
  const [x, z] = XZ(key);
  const outs = outsOf(x, z);

  // foundation: fill from y 0 up to the cell's ground, so nothing floats on the slope
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  if (outs.length === 0) {
    // interior: a floor slab at the cell's ground and at 4, the roof deck at 7, air between
    g.set(x, ground, z, "smooth_stone");
    g.set(x, BELT, z, "smooth_stone");
    g.set(x, CORNICE, z, "stone_bricks");
    // roof plant: a few boxes on the deck
    if ((x * 5 + z * 3) % 13 === 0) g.set(x, ROOF, z, "light_gray_concrete");
    continue;
  }

  const d = outs[0];
  const corner = outs.length > 1;
  const along = d === "N" || d === "S" ? x : z;   // position along the face: the bay pattern
  const pier = corner || along % 4 === 0;         // brick pier between bays
  const mullion = !corner && along % 4 === 2;     // plaster mullion between the two panes of a sash
  const isShop = shop.has(key);
  const isDoor = key === doorKey;
  const isLantern = lanternKeys.has(key);

  g.set(x, ground, z, "polished_andesite");        // base course on the plinth
  for (let y = ground + 1; y <= PARAPET; y++) {
    let block = null, state = null;
    if (y === PARAPET) block = pier ? "smooth_quartz" : "bricks";
    else if (y === CORNICE || y === BELT) block = "smooth_quartz";
    else if (y === 3) block = isShop ? "dark_oak_planks" : "smooth_quartz";   // ground-storey lintel or shop fascia
    else if (corner) block = "smooth_quartz";
    else if (y >= 5 && y <= 6) {                   // upper storey: sash windows between brick piers
      if (pier) block = "bricks";
      else if (mullion) block = "smooth_quartz";
      else block = "glass_pane";
    } else if (y <= 2) {                          // ground storey: shopfront glass or a plain brick wall with glass
      if (isShop) {
        if (isDoor && (y === ground + 1 || y === ground + 2)) {
          block = "dark_oak_door";
          state = { facing: FACING[d], half: y === ground + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
        } else if (isLantern && y === ground + 2) {
          block = "lantern"; state = { hanging: "true", waterlogged: "false" };
        } else if (pier || mullion) block = "dark_oak_planks";
        else block = "glass_pane";
      } else {
        if (pier) block = "bricks";
        else if (mullion) block = "smooth_quartz";
        else block = "glass_pane";
      }
    }
    if (!block) block = "bricks";
    if (block === "glass_pane") {
      panes.push({ x, y, z, d });
      if (y >= 5 || isShop) glazed.push({ x, y, z, d, along });
    }
    g.set(x, y, z, block, state);
  }
}

// Panes connect to the solid or glass cells beside them on their own face, as in the world.
for (const p of panes) {
  const solid = (dx, dz) => (g.get(p.x + dx, p.y, p.z + dz) ? "true" : "false");
  const st = { north: "false", east: "false", south: "false", west: "false", waterlogged: "false" };
  if (p.d === "N" || p.d === "S") { st.east = solid(1, 0); st.west = solid(-1, 0); }
  else { st.north = solid(0, -1); st.south = solid(0, 1); }
  g.set(p.x, p.y, p.z, "glass_pane", st);
}

// Warm light behind some glass: glowstone standing on the floor just inside the pane (the upper lamp sits on the
// storey's floor at 4, the shop lamp on the ground floor), so the lamp is supported and the glow shows through.
for (const c of glazed) {
  if ((c.along * 3 + c.y) % 7 !== 0) continue;
  const [dx, dz] = DIRS[c.d];
  const ix = c.x - dx, iz = c.z - dz;
  if (!inF(ix, iz) || outsOf(ix, iz).length) continue;
  const ly = c.y >= 5 ? 5 : groundAt.get(K(c.x, c.z)) + 1;
  if (g.get(ix, ly, iz)) continue;
  g.set(ix, ly, iz, "glowstone");
}

// Structural check: blocks with nothing under them. Only the interior floor slabs (at the ground and at 4) and the
// roof deck (at 7) have air below, and each spans between the walls it sits on, as the storeys do.
const spans = { floor: 0, other: 0 };
for (let z = 0; z < 14; z++) for (let x = 0; x < 32; x++) for (let y = 1; y < 21; y++) {
  if (!g.get(x, y, z) || g.get(x, y - 1, z)) continue;
  const b = g.get(x, y, z).block;
  if ((b === "minecraft:smooth_stone" && y === BELT) || (b === "minecraft:stone_bricks" && y === CORNICE)) spans.floor++;
  else spans.other++;
}

const stats = g.save(OUT);
console.log(JSON.stringify({ cells: cells.length, shop: shop.size, door: doorKey, panes: panes.length, spans, ...stats }));
