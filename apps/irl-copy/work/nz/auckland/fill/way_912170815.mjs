// Way 912170815: a two-storey brick shop on Mt Eden village's commercial strip, 7 x 5 blocks with an L-shaped
// footprint. Record: lidar ground 0 everywhere, roof top at y 6 (the parapet), so 7 blocks tall: a polished base
// course (y 0), a 3-block shopfront storey (y 1-3), a stone belt course (y 4), an upper storey of brick with sash
// panes (y 5) and a stone parapet (y 6). The shell is hollow: exterior cells are the walls; interior cells are air
// behind the glass, with a floor slab at y 4 and a roof deck at y 6 carried by the walls.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_912170815.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inF = (x, z) => F.has(key(x, z));
const interior = (x, z) => inF(x - 1, z) && inF(x + 1, z) && inF(x, z - 1) && inF(x, z + 1);
const exposed = (x, z) => ({ N: !inF(x, z - 1), S: !inF(x, z + 1), W: !inF(x - 1, z), E: !inF(x + 1, z) });

const g = new Voxels([7, 19, 5]);

// Plan: which exterior cells carry glass (checkerboard on the upper storey, so the rhythm reads from the air),
// and which ground-floor cells are the shopfront and the door (the south street face, z = 3).
const DOOR = [2, 3];
const SHOP = [[1, 3], [3, 3]];
const isShop = (x, z) => SHOP.some(([a, b]) => a === x && b === z);
const isDoor = (x, z) => x === DOOR[0] && z === DOOR[1];
const glassUpper = (x, z) => (x + z) % 2 === 0;
const glassGround = (x, z) => (x + z) % 2 === 0 && !isShop(x, z) && !isDoor(x, z);

// A pane's connection states: along the wall it sits in; a corner cell connects all four ways.
function paneState(x, z) {
  const e = exposed(x, z);
  const ns = e.N || e.S, ew = e.E || e.W;
  if (ns && ew) return { north: "true", south: "true", east: "true", west: "true" };
  if (ns) return { north: "false", south: "false", east: "true", west: "true" };
  return { north: "true", south: "true", east: "false", west: "false" };
}

for (const [k, { ground, roof }] of F) {
  const [x, z] = k.split(",").map(Number);
  const t = roof;                    // parapet / roof deck
  const belt = t - 2;                // stone belt course and floor slab
  const upper = t - 1;               // upper storey: sash panes in brick
  const gs = ground + 1, gTop = belt - 1;   // shopfront storey, y 1..3

  // base course and roof deck run the whole footprint
  g.set(x, ground, z, "polished_andesite");
  g.set(x, t, z, interior(x, z) ? "smooth_stone" : "stone_bricks");

  if (interior(x, z)) {
    // air behind the glass; a floor slab on the belt level
    g.set(x, belt, z, "smooth_stone");
    continue;
  }

  // exterior shell: brick storeys, stone belt course and parapet
  for (let y = gs; y <= gTop; y++) g.set(x, y, z, "bricks");
  g.set(x, belt, z, "stone_bricks");
  g.set(x, upper, z, "bricks");

  // shopfront and door on the street face
  if (isShop(x, z)) {
    g.set(x, gs, z, "dark_oak_planks");
    g.set(x, gs + 1, z, "glass_pane", paneState(x, z));
    g.set(x, gTop, z, "dark_oak_planks");
  } else if (isDoor(x, z)) {
    const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
    g.set(x, gs, z, "dark_oak_door", { ...door, half: "lower" });
    g.set(x, gs + 1, z, "dark_oak_door", { ...door, half: "upper" });
    g.set(x, gTop, z, "dark_oak_planks");
  } else if (glassGround(x, z)) {
    // ground-floor sash with stone sill and lintel
    g.set(x, gs, z, "stone_bricks");
    g.set(x, gs + 1, z, "glass_pane", paneState(x, z));
    g.set(x, gTop, z, "stone_bricks");
  }

  // upper sash panes on the checkerboard
  if (glassUpper(x, z)) g.set(x, upper, z, "glass_pane", paneState(x, z));
}

// warm light: lanterns standing on the base course behind the shopfront, and hanging from the roof deck in the
// upper rooms (their chains reach the deck above, nothing floats)
const standing = [[2, 2], [4, 3]];
const hanging = [[1, 1], [4, 2], [5, 3]];
for (const [x, z] of standing) g.set(x, 1, z, "lantern", { hanging: "false" });
for (const [x, z] of hanging) g.set(x, 5, z, "lantern", { hanging: "true" });

g.save(`${dir}/way_912170815.nbt`);
