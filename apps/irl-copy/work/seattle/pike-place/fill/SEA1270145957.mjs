import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// PIER 62 PARK ARBOR (c. 1975-2017 waterfront park pavilion, Park/Public Zoo-Arbor, Pike Place waterfront): a one-storey
// covered pavilion, roof about 4 blocks above its lowest ground, which is level here. A stone base course, timber posts
// (stripped spruce) between glass panes on the walls, a stone cornice lip, a flat built-up roof with two steel HVAC
// units, and two timber doors on the long faces. The shell is closed by the roof; the interior is air behind the glass
// with a floor slab, hanging lanterns from the roof, and warm shroomlights/glowstone behind some panes. Each cell's
// ground is the third number: anything below it is filled as foundation (none here, every cell is at 0).
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/seattle/pike-place/fill";
const cells = JSON.parse(readFileSync(`${DIR}/SEA1270145957.cells.json`, "utf8"));

const BASE = 0, WALL_TOP = 2, ROOF = 3, CORNICE = 4;   // y 0 base course/floor, y 1-2 walls, y 3 roof deck, y 4 cornice/equipment
const g = new Voxels([13, 16, 14]);
const gnd = new Map(cells.map(([x, z, h]) => [`${x},${z}`, h]));
const has = (x, z) => gnd.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outward = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([n]) => n);

// Foundation: solid from y 0 up to each cell's ground (a no-op on this flat lot, kept so a sloped record builds right).
for (const [x, z, h] of cells) for (let y = 0; y < h; y++) g.set(x, y, z, "stone_bricks");

const ring = new Set(cells.filter(([x, z]) => outward(x, z).length).map(([x, z]) => `${x},${z}`));
const isRing = (x, z) => ring.has(`${x},${z}`);
const interior = cells.filter(([x, z]) => !isRing(x, z)).map(([x, z]) => [x, z]);

// Doors: the middle ring cell of the west-facing and the east-facing edges (outward faces at x min and x max).
const pickDoor = (face) => {
  const c = cells.filter(([x, z]) => outward(x, z).includes(face)).sort((a, b) => a[1] - b[1]);
  return c[Math.floor(c.length / 2)];
};
const doors = new Map([[pickDoor("west").join(), "west"], [pickDoor("east").join(), "east"]]);

// Glass panes connect to any neighbouring wall cell (pillar, pane, or base course), not to a door or open air.
const paneState = (x, z) => {
  const s = { waterlogged: "false" };
  for (const [n, [dx, dz]] of Object.entries(DIRS)) s[n] = String(isRing(x + dx, z + dz) && !doors.has(`${x + dx},${z + dz}`) && has(x + dx, z + dz));
  return s;
};

const glassCells = [];
for (const [x, z] of cells) {
  if (!isRing(x, z)) continue;
  // Base course and cornice band everywhere on the ring.
  g.set(x, BASE, z, "stone_bricks");
  g.set(x, ROOF, z, "stone_bricks");
  g.set(x, CORNICE, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  const door = doors.get(`${x},${z}`);
  if (door) {
    g.set(x, 1, z, "spruce_door", { facing: door, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 2, z, "spruce_door", { facing: door, half: "upper", hinge: "left", open: "false", powered: "false" });
    continue;
  }
  if ((x + z) % 3 === 0) {
    // Timber post between the panes, full height of the walls.
    for (let y = 1; y <= WALL_TOP; y++) g.set(x, y, z, "stripped_spruce_log", { axis: "y" });
  } else {
    // Window: glass pane with a frame of stone on top and the base course below.
    for (let y = 1; y <= WALL_TOP; y++) g.set(x, y, z, "glass_pane", paneState(x, z));
    glassCells.push([x, z]);
  }
}

// Deck and floor inside the shell: a smooth floor slab at y 0, a roof deck over the interior at y 3.
for (const [x, z] of interior) {
  g.set(x, BASE, z, "smooth_stone");
  g.set(x, ROOF, z, "smooth_stone");
}

// Hanging lanterns from the roof deck, shroomlights and glowstone just inside some windows.
for (const [x, z] of interior) if ((x * 3 + z * 5) % 7 === 0) g.set(x, 2, z, "lantern", { hanging: "true", waterlogged: "false" });
glassCells.forEach(([x, z], i) => {
  if (i % 3 !== 0) return;
  const inward = Object.values(DIRS).map(([dx, dz]) => [x + dx, z + dz]).find(([a, b]) => has(a, b) && !isRing(a, b));
  if (!inward) return;
  g.set(inward[0], 1, inward[1], i % 2 === 0 ? "shroomlight" : "glowstone");
});

// Roof: two steel HVAC units and a small roof-edge cornice lip already set above.
const roofIn = interior.filter(([x, z]) => (x + z) % 5 === 0);
for (const [x, z] of roofIn.slice(0, 2)) g.set(x, CORNICE, z, "iron_block");

g.save(`${DIR}/SEA1270145957.nbt`);
