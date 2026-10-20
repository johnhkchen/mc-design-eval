import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record has no tags, so this is a two-storey Taipei concrete shophouse:
// white tiled walls, red shop-sign fascia, glazed shopfront, flat roof behind a parapet.
// Roof sits 11 blocks above lowest ground: storeys of 5 blocks, parapet at dy 10.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888747";
const W = 14, H = 23, D = 7;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Exposure of each footprint cell to the outside
const exposure = (x, z) => ({
  n: !has(x, z - 1),
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isFacade = (x, z) => {
  const e = exposure(x, z);
  return e.n || e.s || e.w || e.e;
};

const g = new Voxels([W, H, D]);

const clampY = (y) => Math.max(0, Math.min(H - 1, y));

function glass(x, y, z, alongX) {
  // Panes connect along the wall they sit in
  const props = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  g.set(x, clampY(y), z, "glass_pane", props);
}

// First pass: foundations, floors, roof deck, facades
for (const [x, z, gr] of cells) {
  const base = Math.max(0, gr);
  const ex = exposure(x, z);
  const facade = isFacade(x, z);

  // Foundation from y 0 up to the cell's ground
  for (let y = 0; y < base; y++) g.set(x, clampY(y), z, "stone_bricks");

  // Storey lines and roof deck
  g.set(x, clampY(base), z, facade ? "polished_andesite" : "stone_bricks"); // ground floor base
  g.set(x, clampY(base + 5), z, "smooth_stone");                            // floor slab
  g.set(x, clampY(base + 10), z, "smooth_stone");                           // roof deck / parapet cap

  if (!facade) continue;

  // Primary face and along-wall coordinate
  let face, u, alongX;
  if (ex.n) { face = "n"; u = x; alongX = true; }
  else if (ex.s) { face = "s"; u = x; alongX = true; }
  else if (ex.w) { face = "w"; u = z; alongX = false; }
  else { face = "e"; u = z; alongX = false; }

  const corner = (ex.n || ex.s) && (ex.w || ex.e);
  const pier = corner || u % 3 === 0;

  // Ground floor: shopfront glazing between white piers
  for (let dy = 1; dy <= 3; dy++) {
    const y = base + dy;
    if (pier) g.set(x, clampY(y), z, "white_concrete");
    else glass(x, y, z, alongX);
  }

  // Shop-sign fascia
  g.set(x, clampY(base + 4), z, "red_concrete");

  // Second floor: sill, glazing, head spandrel
  g.set(x, clampY(base + 6), z, pier ? "white_concrete" : "smooth_stone");
  for (let dy = 7; dy <= 8; dy++) {
    const y = base + dy;
    if (pier) g.set(x, clampY(y), z, "white_concrete");
    else glass(x, y, z, alongX);
  }

  // Cornice band and parapet
  g.set(x, clampY(base + 9), z, pier ? "white_concrete" : "smooth_quartz");
  g.set(x, clampY(base + 10), z, "smooth_stone");
}

// Second pass: entrance door on the street face and warm lights behind some windows
const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };
let doorPlaced = false;

for (const [x, z, gr] of cells) {
  if (!isFacade(x, z)) continue;
  const base = Math.max(0, gr);
  const ex = exposure(x, z);

  let face, u;
  if (ex.n) { face = "n"; u = x; }
  else if (ex.s) { face = "s"; u = x; }
  else if (ex.w) { face = "w"; u = z; }
  else { face = "e"; u = z; }

  // Entrance: one bay on the north or south street face
  if (!doorPlaced && (face === "n" || face === "s") && u === 4 && !(ex.n && ex.s)) {
    const facing = face === "n" ? "north" : "south";
    g.set(x, clampY(base + 1), z, "oak_door", {
      facing, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, clampY(base + 2), z, "oak_door", {
      facing, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    doorPlaced = true;
    continue;
  }

  // Warm lights just inside some shopfront and upper-floor windows
  const pier = (ex.n || ex.s) && (ex.w || ex.e) || u % 3 === 0;
  if (pier || u % 6 !== 4) continue;
  const [dx, dz] = inward[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isFacade(ix, iz)) continue;
  g.set(ix, clampY(base + 2), iz, "glowstone");
  g.set(ix, clampY(base + 7), iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
