import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826989981";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 38, D = 17;
const TOP = 26;          // parapet course; roof slab sits at y 25
const ROOF = 25;
const g = new Voxels([W, H, D]);

// footprint: key "x,z" -> ground height (clamped to a sane foundation range)
const G = new Map();
const list = [];
for (const [x, z, gr] of cells) {
  const h = Math.max(0, Math.min(24, Math.round(gr)));
  G.set(`${x},${z}`, h);
  list.push([x, z, h]);
}
const has = (x, z) => G.has(`${x},${z}`);

function put(x, y, z, block, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

function paneProps(axis) {
  // axis 'x': pane runs east-west along a north/south facing wall
  return axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// exposure of each footprint cell
function exposure(x, z) {
  const exposedX = !has(x - 1, z) || !has(x + 1, z); // east/west faces exposed
  const exposedZ = !has(x, z - 1) || !has(x, z + 1); // north/south faces exposed
  return { exposedX, exposedZ, perim: exposedX || exposedZ, corner: exposedX && exposedZ };
}

// front entrance: on the minimum-z face, nearest the middle of the footprint
const xs = list.map(c => c[0]);
const zs = list.map(c => c[1]);
const minZ = Math.min(...zs);
const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
const frontCands = list
  .filter(([x, z]) => z === minZ)
  .sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX));
const door = frontCands.length ? frontCands[0] : null;

for (const [x, z, gr] of list) {
  const { exposedZ, corner, perim } = exposure(x, z);
  // run of the facade this cell belongs to
  const runAxis = exposedZ ? "x" : "z";
  const c = runAxis === "x" ? x : z;
  const pillar = corner || c % 4 === 0;

  // foundation below ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP; y++) {
    if (y === TOP) {
      if (perim) put(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === ROOF) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    const F = 5 * Math.floor(y / 5);
    const j = y - F; // 0 = floor line, 1..4 = storey body
    if (j === 0 || y === gr) {
      // floor slab (or bottom course when the building starts off a floor line)
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    if (!perim) {
      // interior: air gap, floor slabs only, a few warm lights
      if (j === 2 && (x * 5 + z * 3 + F) % 7 === 0) put(x, y, z, "glowstone");
      continue;
    }
    // perimeter facade
    if (j === 4) {
      put(x, y, z, "white_concrete"); // spandrel
      continue;
    }
    if (pillar) {
      put(x, y, z, "white_concrete"); // mullion / pier
      continue;
    }
    if (F === 0) {
      // shopfront
      if (j === 1) put(x, y, z, "stone_bricks");
      else put(x, y, z, "glass");
      continue;
    }
    // upper storeys: glazing with frames
    put(x, y, z, "light_blue_stained_glass_pane", paneProps(runAxis));
  }
}

// main entrance (two-high door) on the front face
if (door) {
  const [dx, dz, dg] = door;
  const dy = Math.max(1, dg);
  put(dx, dy, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, dy + 1, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // lanterns flanking the entrance, just inside the glass
  put(dx, dy + 2, dz, "white_concrete");
}

// roof plant: a penthouse core, a service box and an antenna
const ph = list.filter(([x, z]) => x >= 8 && x <= 17 && z >= 5 && z <= 11);
for (const [x, z] of ph) {
  put(x, ROOF + 1, z, "white_concrete");
  put(x, ROOF + 2, z, "white_concrete");
  put(x, ROOF + 3, z, "smooth_quartz");
}
// glazed penthouse band
for (const [x, z] of ph) {
  if (x === 8 || x === 17 || z === 5 || z === 11) {
    put(x, ROOF + 2, z, "light_blue_stained_glass_pane", paneProps(x === 8 || x === 17 ? "z" : "x"));
  }
}
// service box on the western roof
for (const [x, z] of list) {
  if (x >= 2 && x <= 4 && z >= 2 && z <= 3) {
    put(x, ROOF + 1, z, "stone_bricks");
    put(x, ROOF + 2, z, "stone_bricks");
  }
}
// antenna over the penthouse centre
const cx = 13, cz = 8;
if (has(cx, cz)) {
  for (let y = ROOF + 4; y <= ROOF + 8; y++) {
    put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
