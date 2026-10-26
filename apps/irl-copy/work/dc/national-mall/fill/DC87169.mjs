import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87169.cells.json`, "utf8"));

const W = 37, H = 25, D = 67;
const g = new Voxels([W, H, D]);

// Treasury: granite plinth, pale limestone walls, belt courses per storey,
// punched window grids with stone piers, a columned north portico with a stepped brow.
const WALL = "calcite";
const PLINTH = "polished_granite";
const BELT = "smooth_stone";
const PARAPET = "stone_brick_wall";
const TRIM = "polished_granite";

const key = (x, z) => x + "," + z;
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) {
  const G = Math.max(0, Math.min(20, Math.round(gr)));
  let R = Math.round(rf);
  R = Math.max(G + 4, Math.min(22, R));
  cellMap.set(key(x, z), { x, z, G, R });
}

function exposed(x, z) {
  const out = [];
  if (!cellMap.has(key(x, z - 1))) out.push("N");
  if (!cellMap.has(key(x, z + 1))) out.push("S");
  if (!cellMap.has(key(x - 1, z))) out.push("W");
  if (!cellMap.has(key(x + 1, z))) out.push("E");
  return out;
}

const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// North face (min z) entrance position
let entranceX = null, entranceZ = null;
{
  let minZ = Infinity;
  for (const c of cellMap.values()) minZ = Math.min(minZ, c.z);
  const xs = [];
  for (const c of cellMap.values()) if (c.z === minZ) xs.push(c.x);
  if (xs.length) {
    entranceX = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
    entranceZ = minZ;
  }
}

// Pass 1: plinth, walls, floors, windows, parapet, roof housings
for (const c of cellMap.values()) {
  const { x, z, G, R } = c;

  for (let y = 0; y < G; y++) g.set(x, y, z, PLINTH);

  const faces = exposed(x, z);

  if (faces.length > 0) {
    for (let y = G; y <= R - 1; y++) g.set(x, y, z, WALL);
    g.set(x, G, z, TRIM);                                   // base course
    for (let y = G + 4; y < R - 1; y += 4) g.set(x, y, z, BELT); // storey belts
    g.set(x, R, z, PARAPET);                                // parapet

    for (const f of faces) {
      const alongX = f === "N" || f === "S";
      const idx = alongX ? x : z;
      for (let y = G + 1; y <= R - 2; y++) {
        const o = (y - G) % 4;
        if (o !== 1 && o !== 2) continue;   // two glass rows per storey
        if (idx % 3 !== 1) continue;         // stone piers between bays
        const warm = ((idx * 7 + y * 3) % 11) === 0;
        if (warm) g.set(x, y, z, "glowstone");
        else g.set(x, y, z, "glass_pane", alongX ? paneX : paneZ);
      }
    }
  } else {
    // Interior: floor slabs at storey lines, air gap, solid top storey
    const topFloor = G + 4 * Math.floor((R - 1 - G) / 4);
    for (let y = G; y <= R - 1; y++) {
      if (y > G && y >= topFloor) g.set(x, y, z, WALL);
      else if (y > G && (y - G) % 4 === 0) g.set(x, y, z, BELT);
    }
    // Rooftop plant housings on a sparse grid, set on the solid roof
    if (x % 8 === 3 && z % 8 === 3 && R + 1 < H) {
      g.set(x, R, z, "smooth_stone");
      g.set(x, R + 1, z, "smooth_stone");
    }
  }
}

// Pass 2: north portico: quartz pilasters, granite lintel, stepped brow, bronze-lit lanterns, dark-oak door
if (entranceX !== null) {
  const c = cellMap.get(key(entranceX, entranceZ));
  if (c) {
    const G = c.G;

    // Door
    g.set(entranceX, G + 1, entranceZ, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(entranceX, G + 2, entranceZ, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });

    // Pilasters flanking the door
    for (const dx of [-2, 2]) {
      const xx = entranceX + dx;
      if (!cellMap.has(key(xx, entranceZ))) continue;
      for (let y = G + 1; y <= G + 3; y++) {
        g.set(xx, y, entranceZ, "quartz_pillar", { axis: "y" });
      }
    }

    // Granite lintel across the portico
    for (let dx = -3; dx <= 3; dx++) {
      const xx = entranceX + dx;
      if (cellMap.has(key(xx, entranceZ))) g.set(xx, G + 3, entranceZ, TRIM);
    }

    // Stepped brow above the lintel (stairs facing out)
    for (let dx = -2; dx <= 2; dx++) {
      const xx = entranceX + dx;
      if (!cellMap.has(key(xx, entranceZ))) continue;
      g.set(xx, G + 4, entranceZ, "stone_brick_stairs", {
        facing: "north", half: "bottom", shape: "straight", waterlogged: "false",
      });
    }

    // Lanterns beside the door, on the wall face
    for (const dx of [-1, 1]) {
      const xx = entranceX + dx;
      if (cellMap.has(key(xx, entranceZ))) {
        g.set(xx, G + 1, entranceZ, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/DC87169.nbt`);
