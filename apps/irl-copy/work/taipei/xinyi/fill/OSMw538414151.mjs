import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538414151";
const W = 23, H = 23, D = 20;

// Two-storey late-20th-century Xinyi commercial block: granite plinth, shopfront
// with glass and quartz piers, red terracotta fascia, white upper storey with
// glass-pane window bands, quartz coping and a light grey roof deck (top at y 10).
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
function outward(x, z) {
  const m = [];
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) m.push(name);
  }
  return m;
}

const g = new Voxels([W, H, D]);

// Pane connections: connect along the facade to neighbouring wall cells.
function paneProps(x, z, face) {
  const ns = face === "west" || face === "east";
  const ew = face === "north" || face === "south";
  return {
    north: ns && has(x, z - 1) ? "true" : "false",
    south: ns && has(x, z + 1) ? "true" : "false",
    east: ew && has(x + 1, z) ? "true" : "false",
    west: ew && has(x - 1, z) ? "true" : "false",
    waterlogged: "false",
  };
}

const isPier = (face, corner, x, z) => {
  if (corner) return true;
  const t = face === "north" || face === "south" ? x : z;
  return t % 3 === 0;
};

// Pass 1: foundation, storeys, roof
for (const [x, z, gr] of cells) {
  const base = gr;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  const m = outward(x, z);
  const perim = m.length > 0;

  if (!perim) {
    // Interior: floor slabs and roof deck only (air gap otherwise)
    g.set(x, base, z, "smooth_stone");
    g.set(x, base + 5, z, "smooth_stone");
    g.set(x, base + 10, z, "light_gray_concrete");
    continue;
  }

  const face = m[0];
  const corner = m.length >= 2;
  const pier = isPier(face, corner, x, z);

  // Ground storey (base .. base+4)
  g.set(x, base, z, "polished_granite");          // base course
  g.set(x, base + 4, z, "red_terracotta");        // fascia band

  for (let y = base + 1; y <= base + 3; y++) {
    const isEntrance = face === "north" && x >= 10 && x <= 12 && y <= base + 2;
    if (isEntrance) {
      g.set(x, y, z, "glass");
    } else if (pier) {
      g.set(x, y, z, "smooth_quartz");
    } else {
      g.set(x, y, z, "glass_pane", paneProps(x, z, face));
    }
  }

  // Storey line and upper storey (base+5 .. base+10)
  g.set(x, base + 5, z, "smooth_quartz");
  g.set(x, base + 6, z, "white_concrete");        // spandrel
  for (let y = base + 7; y <= base + 8; y++) {
    if (pier) g.set(x, y, z, "smooth_quartz");
    else g.set(x, y, z, "glass_pane", paneProps(x, z, face));
  }
  g.set(x, base + 9, z, "smooth_quartz");         // cornice ring
  g.set(x, base + 10, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); // coping
}

// Pass 2: warm light behind some upper-storey windows
for (const [x, z, gr] of cells) {
  const m = outward(x, z);
  if (m.length !== 1) continue;
  const face = m[0];
  const t = face === "north" || face === "south" ? x : z;
  if (t % 6 !== 1 || t % 3 === 0) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz; // interior neighbour
  if (!has(ix, iz)) continue;
  if (outward(ix, iz).length > 0) continue;
  const ib = ground.get(`${ix},${iz}`);
  g.set(ix, ib + 7, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
