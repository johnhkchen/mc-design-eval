import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011411";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 38, D = 21;
const g = new Voxels([W, H, D]);

// Record: roof about 26 blocks above lowest ground, ~5 blocks per storey.
// Era: late-1990s/early-2000s Xinyi mid-rise commercial-office block:
// pale tiled/concrete facade, tinted glass bays, granite plinth, quartz storey bands,
// cornice, and a set-back mechanical penthouse.
const ROOF = 26;
const PENT_TOP = 31;

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.min(gr, 20));
const inside = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// Which sides of a footprint cell face outside the footprint.
function exposed(x, z) {
  return {
    N: !inside(x, z - 1), // z-face, min z
    S: !inside(x, z + 1), // z-face, max z
    W: !inside(x - 1, z), // x-face, min x
    E: !inside(x + 1, z), // x-face, max x
  };
}

const isPerim = (x, z) => {
  const e = exposed(x, z);
  return e.N || e.S || e.W || e.E;
};

// Ground-floor entrance: centre of the north (min z) face.
const northXs = cells.filter(([, z]) => z === Math.min(...cells.map((c) => c[1])))
  .map(([x]) => x).sort((a, b) => a - b);
const entranceX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : null;
const entranceZ = Math.min(...cells.map((c) => c[1]));

// Glass cell registry for pane connections.
const glass = new Set();
const gkey = (x, y, z) => `${x},${y},${z}`;

// Pass 1: foundation, roof, walls, storey lines, windows, entrance.
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const gr = groundAt(x, z);
  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  const base = gr + 1;
  const perim = isPerim(x, z);
  const e = exposed(x, z);

  // Roof deck (interior) and cornice cap (perimeter).
  g.set(x, ROOF, z, perim ? "smooth_quartz" : "gray_concrete");

  for (let y = base; y < ROOF; y++) {
    const r = (ROOF - y) % 5; // 0 = storey line, 1-3 = glazing, 4 = spandrel
    if (!perim) {
      // Floor slab per storey inside; air elsewhere.
      if (r === 0) g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === base) { g.set(x, y, z, "polished_granite"); continue; }
    if (y === ROOF - 1) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (r === 0) { g.set(x, y, z, "smooth_quartz"); continue; }

    const zFace = e.N || e.S;
    const xFace = e.W || e.E;
    const along = zFace && !xFace ? x : (xFace && !zFace ? z : null);
    const corner = zFace && xFace;

    // Entrance: two-high door on the north face.
    if (e.N && !xFace && x === entranceX && (y === base || y === base + 1)) {
      if (y === base) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else {
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
        });
      }
      continue;
    }

    if (r === 4) { g.set(x, y, z, "white_concrete"); continue; } // spandrel
    if (corner || along === null) { g.set(x, y, z, "smooth_quartz"); continue; }

    const isWindow = along % 3 !== 0 && r >= 1 && r <= 3 && y <= ROOF - 2 && y >= base + 1;
    if (isWindow) {
      g.set(x, y, z, "cyan_stained_glass_pane", {
        north: "false", south: "false", east: "false", west: "false",
      });
      glass.add(gkey(x, y, z));
    } else {
      // Piers between bays.
      g.set(x, y, z, r >= 1 && r <= 3 ? "smooth_quartz" : "white_concrete");
    }
  }
}

// Pass 2: pane connections and warm lights behind some windows.
for (const k of glass) {
  const [x, y, z] = k.split(",").map(Number);
  const e = exposed(x, z);
  const zFace = e.N || e.S;
  const props = { north: "false", south: "false", east: "false", west: "false" };
  if (zFace) {
    if (glass.has(gkey(x - 1, y, z))) props.west = "true";
    if (glass.has(gkey(x + 1, y, z))) props.east = "true";
  } else {
    if (glass.has(gkey(x, y, z - 1))) props.north = "true";
    if (glass.has(gkey(x, y, z + 1))) props.south = "true";
  }
  g.set(x, y, z, "cyan_stained_glass_pane", props);

  // Warm light in the air gap behind some windows.
  if ((x * 7 + z * 3 + y) % 4 === 0) {
    let ix = x, iz = z;
    if (e.N) iz = z + 1;
    else if (e.S) iz = z - 1;
    else if (e.W) ix = x + 1;
    else if (e.E) ix = x - 1;
    if (inside(ix, iz)) g.set(ix, y, iz, "glowstone");
  }
}

// Pass 3: set-back mechanical penthouse, cells at least 3 in from every edge.
const pentInner = (x, z) => {
  for (let dx = -3; dx <= 3; dx++)
    for (let dz = -3; dz <= 3; dz++)
      if (!inside(x + dx, z + dz)) return false;
  return true;
};
const pent = cells.map(([x, z]) => [x, z]).filter(([x, z]) => pentInner(x, z));
const pentSet = new Set(pent.map(([x, z]) => `${x},${z}`));
const pentEdge = (x, z) => !pentSet.has(`${x - 1},${z}`) || !pentSet.has(`${x + 1},${z}`) ||
  !pentSet.has(`${x},${z - 1}`) || !pentSet.has(`${x},${z + 1}`);

for (const [x, z] of pent) {
  for (let y = ROOF + 1; y <= PENT_TOP - 1; y++) {
    if (pentEdge(x, z)) {
      // Louvred plant screen: solid walls with a glazed band.
      const band = y >= ROOF + 2 && y <= ROOF + 3 && (x + z) % 2 === 0;
      g.set(x, y, z, band ? "iron_bars" : "white_concrete");
    }
  }
  g.set(x, PENT_TOP, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
