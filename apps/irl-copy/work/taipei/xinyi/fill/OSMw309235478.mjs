import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 雙雄世貿大樓: a two-storey 1990s commercial block in Xinyi.
// White concrete frame with light-blue glass bays, granite base, quartz cornice, grey roof deck.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309235478";
const W = 34, H = 23, D = 60;
const ROOF = 11;          // roof deck block row (about 11 blocks above lowest ground)
const PARAPET = 11;       // parapet row, same plane as the piers
const COPING = 12;        // continuous coping slab on top of the parapet

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.min(Math.max(0, Math.round(gr)), ROOF));
const has = (x, z) => G.has(`${x},${z}`);
const gAt = (x, z) => G.get(`${x},${z}`);

// Edge info: which face a cell sits on, its index along that face, and whether it is a pier.
function edgeInfo(x, z) {
  const missing = [];
  if (!has(x, z - 1)) missing.push("north");
  if (!has(x, z + 1)) missing.push("south");
  if (!has(x - 1, z)) missing.push("west");
  if (!has(x + 1, z)) missing.push("east");
  if (missing.length === 0) return null;
  const face = missing[0];
  const along = (face === "north" || face === "south") ? x : z;
  const corner = missing.length > 1;
  const pier = corner || along % 4 === 0;
  const inward = {
    north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0],
  }[face];
  return { face, along, pier, inward, corner };
}

const keys = [...G.keys()].map(k => k.split(",").map(Number));
const EDGE = new Map();
for (const [x, z] of keys) EDGE.set(`${x},${z}`, edgeInfo(x, z));

const g = new Voxels([W, H, D]);

// Bounding box centre for the rooftop plant.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of keys) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = Math.round((minX + maxX) / 2);
const cz = Math.round((minZ + maxZ) / 2);

// Foundations, facade, floors and roof, column by column.
for (const [x, z] of keys) {
  const gg = G.get(`${x},${z}`);
  const info = EDGE.get(`${x},${z}`);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gg; y++) g.set(x, y, z, "polished_andesite");

  if (info) {
    for (let y = gg; y <= COPING; y++) {
      let id;
      if (y === gg) id = "polished_granite";                                             // base course
      else if (y <= 4) id = info.pier ? "polished_granite" : "light_blue_stained_glass"; // shopfront
      else if (y === 5) id = "white_concrete";                                           // floor line
      else if (y <= 9) id = info.pier ? "white_concrete" : "light_blue_stained_glass";   // upper windows
      else if (y === 10) id = "quartz_block";                                            // cornice
      else if (y === PARAPET) id = "white_concrete";                                     // parapet
      else id = null;
      if (id) g.set(x, y, z, id);
    }
    // Coping: a bottom-half slab on the parapet, so the top reads as one continuous line.
    g.set(x, COPING, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior: ground floor slab, upper floor slab, roof deck. Air between.
    g.set(x, gg, z, "smooth_stone");
    if (5 >= gg) g.set(x, 5, z, "smooth_stone");
    g.set(x, ROOF, z, "gray_concrete");
  }
}

// Main entrance on the south face, nearest the middle of the frontage.
let door = null;
for (const [x, z] of keys) {
  const info = EDGE.get(`${x},${z}`);
  if (!info || info.face !== "south") continue;
  if (!door || Math.abs(x - cx) < Math.abs(door.x - cx)) door = { x, z };
}
if (door) {
  const dg = gAt(door.x, door.z);
  const hinge = "left";
  if (dg + 2 <= 4) {
    // Quartz pillars frame the door bay on either side.
    for (const dx of [-1, 1]) {
      const px = door.x + dx;
      if (!has(px, door.z) || !EDGE.get(`${px},${door.z}`)) continue;
      for (let y = dg + 1; y <= dg + 3; y++) {
        g.set(px, y, door.z, y <= dg + 2 ? "quartz_pillar" : "polished_granite", y <= dg + 2 ? { axis: "y" } : undefined);
      }
    }
    g.set(door.x, dg + 1, door.z, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
    g.set(door.x, dg + 2, door.z, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
  }
  // Lintel across the entrance bay, kept inside the wall line.
  if (dg + 3 <= 4) {
    for (let x = door.x - 1; x <= door.x + 1; x++) {
      if (!has(x, door.z)) continue;
      g.set(x, dg + 3, door.z, "polished_granite");
    }
  }
}

// Warm lights behind some glass: glowstone in the shopfront, shroomlight upstairs.
for (const [x, z] of keys) {
  const info = EDGE.get(`${x},${z}`);
  if (!info || info.pier) continue;
  const gg = gAt(x, z);
  const [dx, dz] = info.inward;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || EDGE.get(`${ix},${iz}`)) continue;   // inner cell must be interior
  const ig = gAt(ix, iz);
  if (info.along % 6 === 1 && gg + 2 <= 4 && ig <= gg + 2) {
    g.set(ix, gg + 2, iz, "glowstone");
  }
  if (info.along % 3 === 1 && ig <= 7) {
    g.set(ix, 7, iz, "shroomlight");
  }
}

// Rooftop plant: a small grey mechanical box on the deck, set back from the parapet.
for (const [x, z] of keys) {
  if (EDGE.get(`${x},${z}`)) continue;
  if (Math.abs(x - cx) <= 5 && Math.abs(z - cz) <= 8) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
  }
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 5) {
    g.set(x, ROOF + 2, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
