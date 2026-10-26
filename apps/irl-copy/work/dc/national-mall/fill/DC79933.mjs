// DC79933: Hotel-Large, 2015 Massachusetts Ave NW (Dupont Circle, Embassy Row). A Beaux-Arts / Renaissance Revival
// hotel of the 1910s-20s: a buff stone (smooth sandstone) body on a stone-brick base, a courtyard-plan block with a
// taller west wing and a 14-block tower core, a rusticated ground floor with a central entrance, and a stone cornice.
// Storeys are two blocks: a glass zone on the odd rows, a stone band on the even rows (a floor line / lintel).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79933.cells.json", "utf8"));
const W = 18, D = 20, H = 26;

const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, r });
const inF = (x, z) => foot.has(`${x},${z}`);

// Lidar roof heights -> flat tiers: the 3-block lobby, the 11 wings, the 12 main body, the 14 tower core.
// 13s are lidar noise on the 12 body, so they fold into 12.
const tierOf = (r) => (r <= 5 ? 3 : r <= 11 ? 11 : r <= 13 ? 12 : 14);

// Per-cell facts: foundation depth g, roof top T, the exterior face (if any), and a setback: a 14 tier keeps only
// the cells surrounded by footprint, so the tower steps in from its outer ring to the 12 body.
const cell = new Map();
for (const [key, { g, r }] of foot) {
  const [x, z] = key.split(",").map(Number);
  let T = tierOf(r);
  const open = [];
  if (!inF(x, z - 1)) open.push("north");
  if (!inF(x, z + 1)) open.push("south");
  if (!inF(x - 1, z)) open.push("west");
  if (!inF(x + 1, z)) open.push("east");
  if (T === 14 && open.length) T = 12;
  cell.set(key, { x, z, g, T, open, perim: open.length > 0 });
}

const v = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);

// The entrance: a door on the north face (z=0) at x=8, with piers at x=7 and x=9.
const DOOR_X = 8;

for (const c of cell.values()) {
  const { x, z, g, T, open, perim } = c;

  // Foundation: solid from y 0 up to the cell's ground, so nothing floats on the slope.
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  for (let y = g; y < T; y++) {
    const cap = y === T - 1;
    const even = y % 2 === 0;

    if (cap) {
      // The top course: a cornice on the outer ring, a flat stone roof deck inside.
      put(x, y, z, perim ? "smooth_sandstone" : "stone");
      continue;
    }

    if (even) {
      // Storey bands (floor lines, lintels, the base course at y 0): stone on the outside, slab inside.
      put(x, y, z, perim ? (y === 0 ? "stone_bricks" : "smooth_sandstone") : "stone");
      continue;
    }

    // Glass zone (odd rows). Interior cells are air behind the glass; the perimeter carries the facade.
    if (!perim) continue;

    // Corners (two exposed faces) are piers.
    if (open.length > 1) { put(x, y, z, "smooth_sandstone"); continue; }

    const face = open[0];
    const along = face === "north" || face === "south" ? x : z;   // the index along the wall
    const ground = y === 1;

    if (face === "north" && z === 0 && ground) {
      // Shopfront: glass in the ground-floor bays, the door opening at x=8 with piers either side.
      if (x === DOOR_X) {
        put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (x === DOOR_X - 1 || x === DOOR_X + 1) {
        put(x, y, z, "smooth_sandstone");
      } else {
        put(x, y, z, "glass");
      }
      continue;
    }

    if (along % 3 === 0) { put(x, y, z, "smooth_sandstone"); continue; }   // piers between the bays

    // A window pane, connected to its neighbours along the wall.
    const alongX = face === "north" || face === "south";
    put(x, y, z, "glass_pane", {
      north: String(!alongX && inF(x, z - 1)),
      south: String(!alongX && inF(x, z + 1)),
      west: String(alongX && inF(x - 1, z)),
      east: String(alongX && inF(x + 1, z)),
      waterlogged: "false",
    });
  }

  // The door's upper half, and a hanging lantern above it.
  if (z === 0 && x === DOOR_X) {
    put(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Warm light behind some windows: a glowstone or shroomlight in the air cell just inside the glass.
for (const c of cell.values()) {
  const { x, z, g, T, open, perim } = c;
  if (!perim || open.length !== 1) continue;
  const face = open[0];
  const [dx, dz] = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[face];
  const inner = cell.get(`${x + dx},${z + dz}`);
  if (!inner || inner.perim) continue;
  for (let y = Math.max(g, 1); y < T - 1; y += 2) {
    if (y === 1 && face === "north" && z === 0) continue;
    if (y % 2 === 0) continue;
    if ((x * 3 + z * 5 + y) % 11 !== 0) continue;   // a scatter, not every window
    put(x + dx, y, z + dz, "glowstone");
  }
}

// Rooftop plant on the tower core, sitting on the roof deck.
for (const [x, z] of [[3, 6], [4, 4]]) {
  const c = cell.get(`${x},${z}`);
  if (c && c.T === 14) put(x, 14, z, "iron_block");
}

const r = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79933.nbt");
console.log("saved", r);
