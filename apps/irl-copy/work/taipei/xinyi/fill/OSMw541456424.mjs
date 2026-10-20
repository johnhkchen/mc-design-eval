import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541456424.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541456424.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 19, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Normalise ground so y 0 is the lowest ground under the footprint.
const minG = Math.min(...cells.map((c) => c[2]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, gr - minG);

// Record-based design: two storeys of about 5 blocks, parapet roof at y 11.
const FLOOR_Y = 5;      // storey line / upper floor slab
const ROOF_Y = 10;      // roof deck and cornice course
const PARAPET_Y = 11;   // parapet cap

const has = (x, z) => ground.has(x + "," + z);
const gy = (x, z) => ground.get(x + "," + z);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which sides of a footprint cell face outside.
function exposed(x, z) {
  const m = [];
  if (!has(x, z - 1)) m.push("north");
  if (!has(x, z + 1)) m.push("south");
  if (!has(x - 1, z)) m.push("west");
  if (!has(x + 1, z)) m.push("east");
  return m;
}

function inwardCell(x, z, face) {
  switch (face) {
    case "north": return [x, z + 1];
    case "south": return [x, z - 1];
    case "west": return [x + 1, z];
    case "east": return [x - 1, z];
  }
  return [x, z];
}

// Pick the entrance: a south-facing (max z) perimeter cell nearest the centre line.
function pickDoor() {
  const cand = [];
  for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
    if (!has(x, z + 1)) cand.push([x, z]);
  }
  if (!cand.length) return null;
  const maxZ = Math.max(...cand.map((c) => c[1]));
  const row = cand.filter((c) => c[1] === maxZ);
  const meanX = row.reduce((s, c) => s + c[0], 0) / row.length;
  row.sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX));
  return row[0];
}

const door = pickDoor();
const doorKey = door ? door[0] + "," + door[1] : null;

for (const [key, base] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposed(x, z);
  const perim = faces.length > 0;
  const corner = faces.length > 1;
  const face = faces[0] || null;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Ground floor interior slab / base course at the ground surface.
  if (base < H) put(x, base, z, perim ? "polished_andesite" : "smooth_stone");

  // Upper floor slab and roof deck for interior cells.
  if (!perim) {
    if (FLOOR_Y >= base) put(x, FLOOR_Y, z, "smooth_stone");
    put(x, ROOF_Y, z, "light_gray_concrete");
  }

  if (!perim) {
    // Rooftop condenser units on interior roof cells.
    if (x % 6 === 3 && z % 6 === 3) {
      put(x, PARAPET_Y, z, "iron_block");
      put(x, PARAPET_Y + 1, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter wall: columns and bays along the facade.
  let idx = 0;
  if (face === "north" || face === "south") idx = x;
  else if (face === "east" || face === "west") idx = z;
  const pillar = corner || idx % 3 === 0;
  const isDoorCell = key === doorKey;

  for (let y = base; y <= ROOF_Y; y++) {
    if (y === base) {
      put(x, y, z, "polished_andesite");
    } else if (y <= 4) {
      // Ground storey: shopfront glazing with pillars.
      if (isDoorCell && y <= base + 2) {
        const props = { facing: face, hinge: "left", open: "false", powered: "false" };
        if (y === base + 1) put(x, y, z, "dark_oak_door", { ...props, half: "lower" });
        else put(x, y, z, "dark_oak_door", { ...props, half: "upper" });
      } else if (isDoorCell || (door && face && Math.abs(idx - (face === "north" || face === "south" ? door[0] : door[1])) <= 1 && !pillar && y === base + 3)) {
        // Lintel over the entrance bay.
        put(x, y, z, "black_concrete");
      } else if (pillar) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "glass_pane");
      }
    } else if (y === FLOOR_Y) {
      put(x, y, z, "smooth_quartz");
    } else if (y <= 9) {
      // Upper storey: tinted glass bays between white concrete piers.
      if (pillar) put(x, y, z, y === 9 ? "white_concrete" : "smooth_quartz");
      else if (y === 9) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane");
    } else if (y === ROOF_Y) {
      put(x, y, z, "stone_bricks");
    }
  }

  // Parapet cap.
  put(x, PARAPET_Y, z, "stone_brick_wall");

  // Warm lamps standing on the upper floor just inside some windows.
  if (!pillar && !isDoorCell && face) {
    const [ix, iz] = inwardCell(x, z, face);
    if (has(ix, iz) && idx % 6 === 1) {
      put(ix, FLOOR_Y + 1, iz, "lantern", { hanging: "false" });
    }
  }
}

g.save(OUT);
