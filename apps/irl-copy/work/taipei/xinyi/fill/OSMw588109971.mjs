import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588109971";
const W = 25, H = 38, D = 55;

// Record: roof about 26 blocks above lowest ground; 5 storeys of 5 blocks, roof slab on top.
// Era read: late-1990s/2000s Xinyi commercial-office block, pale tiled concrete with blue-tint glass,
// glazed shopfront at street level, a plain cornice and a rooftop mechanical penthouse.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gd] of cells) G.set(`${x},${z}`, Math.round(gd));

const inFp = (x, z) => G.has(`${x},${z}`);
const gr = (x, z) => G.get(`${x},${z}`);
const b = Math.min(...G.values());          // lowest ground under the footprint
const ROOF_REL = 25;                         // roof slab row (top surface at b+26)

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const GLASS = "light_blue_stained_glass_pane";
const MULLION = "white_concrete";

function per(x, z) {
  return !inFp(x + 1, z) || !inFp(x - 1, z) || !inFp(x, z + 1) || !inFp(x, z - 1);
}

function outward(x, z) {
  if (!inFp(x, z - 1)) return { dx: 0, dz: -1, face: "north" };
  if (!inFp(x, z + 1)) return { dx: 0, dz: 1, face: "south" };
  if (!inFp(x - 1, z)) return { dx: -1, dz: 0, face: "west" };
  return { dx: 1, dz: 0, face: "east" };
}

function adjacentPerimeter(x, z) {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => inFp(x + dx, z + dz) && per(x + dx, z + dz));
}

// Pass 1: foundation, floors, facade, roof, per footprint cell.
for (const [x, z, gd] of cells) {
  const gx = Math.round(gd);

  // Foundation from y 0 up to this cell's ground, with a base course on top.
  for (let y = 0; y < gx; y++) {
    put(x, y, z, y === gx - 1 ? "polished_andesite" : "stone_bricks");
  }

  const isP = per(x, z);
  const o = isP ? outward(x, z) : null;
  const u = o && o.dz !== 0 ? x : z;
  const zFace = o && o.dz !== 0;
  const paneProps = zFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let rel = 0; rel <= ROOF_REL; rel++) {
    const y = b + rel;
    if (y < gx) continue;
    const k = Math.floor(rel / 5);
    const r = rel % 5;

    if (rel === ROOF_REL) {
      put(x, y, z, isP ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }

    // Storey floor band (spandrel on the facade, slab inside).
    if (r === 0) {
      put(x, y, z, isP ? "light_gray_concrete" : "smooth_stone");
      continue;
    }

    if (isP) {
      if (r === 4) {
        put(x, y, z, MULLION);
        continue;
      }
      // Street-face entrance: dark oak double-height door, centred on the north face.
      if (k === 0 && o.face === "north" && u === 14 && r <= 2) {
        const half = r === 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (u % 4 === 0) put(x, y, z, MULLION);
      else put(x, y, z, GLASS, paneProps);
    } else {
      // Interior air; some warm light sitting just behind the glass.
      if (r === 2 && adjacentPerimeter(x, z) && (x + z + 3 * k) % 5 === 0) {
        put(x, y, z, "glowstone");
      }
    }
  }
}

// Pass 2: interior structural columns on a 6-block grid, so the floor slabs are carried.
for (const [x, z, gd] of cells) {
  const gx = Math.round(gd);
  if (per(x, z) || x % 6 !== 3 || z % 6 !== 3) continue;
  for (let rel = 0; rel <= ROOF_REL; rel++) {
    const y = b + rel;
    if (y < gx) continue;
    put(x, y, z, "white_concrete");
  }
}

// Pass 3: rooftop mechanical penthouse centred on the roof (solid core, no floating).
for (let x = 8; x <= 16; x++) {
  for (let z = 20; z <= 34; z++) {
    if (!inFp(x, z)) continue;
    const edge = x === 8 || x === 16 || z === 20 || z === 34;
    put(x, b + 26, z, edge ? MULLION : "smooth_stone");
    if (edge) {
      put(x, b + 27, z, (x + z) % 3 === 0 ? MULLION : "light_blue_stained_glass");
    } else {
      put(x, b + 27, z, "smooth_stone");
    }
    put(x, b + 28, z, "light_gray_concrete");
  }
}

// Antenna on the penthouse.
put(12, b + 29, 27, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
