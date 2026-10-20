import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265937";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 11 x 17 footprint, roof about 21 blocks above lowest ground:
// a 1980s-style four-storey Taipei office/retail block: pale tiled concrete,
// blue-tinted glazing, white storey bands, shopfront ground floor, rooftop plant.
const W = 11, H = 33, D = 17;
const ROOF = 20;   // top of the solid body (roof slab layer)
const TOP = 21;    // parapet course above the roof slab

const k2 = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(k2(x, z), Math.max(0, Math.min(ROOF, Math.round(gr))));
}

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const dirs = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

function outDirs(x, z) {
  return dirs.filter((d) => !ground.has(k2(x + d.dx, z + d.dz)));
}

function cellInfo(x, z) {
  const G = ground.get(k2(x, z));
  const out = outDirs(x, z);
  const facade = out.length > 0;
  const corner = out.length >= 2;
  const face = out.length ? out[0].n : null;
  let tt = 0;
  if (face === "north" || face === "south") tt = x - minX;
  else if (face === "east" || face === "west") tt = z - minZ;
  const spanX = maxX - minX;
  const entrance = !corner && face === "south" && tt === Math.floor(spanX / 2);
  return { x, z, G, out, facade, corner, face, tt, entrance };
}

function paneProps(face) {
  if (face === "north" || face === "south") {
    return { north: "false", south: "false", east: "true", west: "true" };
  }
  return { north: "true", south: "true", east: "false", west: "false" };
}

// Returns [id, props?] for a facade block at height y.
function facadeBlock(info, y) {
  const { G, corner, face, tt, entrance } = info;
  if (entrance && y === G) {
    return ["dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
  }
  if (entrance && y === G + 1) {
    return ["dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
  }
  if (y === G) return ["polished_andesite"];          // base course at grade
  if (y === ROOF) return ["white_concrete"];          // cornice
  const k = y % 5;
  const s = Math.floor(y / 5);
  if (s === 0 && y === 4) return ["gray_concrete"];   // shopfront fascia
  if (k === 0 || k === 4 || corner) return ["white_concrete"]; // storey lines and piers
  if (tt % 2 === 0) return ["light_gray_concrete"];   // window frames / mullions
  return ["light_blue_stained_glass_pane", paneProps(face)];
}

const g = new Voxels([W, H, D]);

// Pass 1: foundations, facades, interiors (air) with floor slabs, roof and plant.
const infos = [];
for (const [x, z] of cells) {
  const info = cellInfo(x, z);
  infos.push(info);
  const G = info.G;

  // Foundation fill from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone");

  if (!info.facade) {
    // Interior: air behind the glass, floor slabs per storey, roof slab.
    for (let y = G; y <= ROOF; y++) {
      if (y === ROOF) g.set(x, y, z, "light_gray_concrete");
      else if (y > 0 && y % 5 === 0) g.set(x, y, z, "light_gray_concrete");
    }
    // Rooftop plant room and a smaller tier on top of it.
    if (x >= 3 && x <= 7 && z >= 5 && z <= 11) {
      for (let y = TOP; y <= TOP + 2; y++) g.set(x, y, z, "light_gray_concrete");
      if (x >= 4 && x <= 6 && z >= 7 && z <= 9) {
        g.set(x, TOP + 3, z, "light_gray_concrete");
      }
    }
  } else {
    // Facade: base course, shopfront, storey bands, piers, window grid.
    for (let y = G; y <= ROOF; y++) {
      const [id, props] = facadeBlock(info, y);
      if (props) g.set(x, y, z, id, props);
      else g.set(x, y, z, id);
    }
    // Parapet course around the roof edge.
    g.set(x, TOP, z, "white_concrete");
  }
}

// Pass 2: warm light behind some upper-floor windows (glowstone on the interior slab).
const facadeAt = new Map(infos.map((i) => [k2(i.x, i.z), i]));
for (const info of infos) {
  if (!info.facade || info.corner || !info.face) continue;
  const d = info.out[0];
  for (let s = 1; s <= 3; s++) {
    const y = 5 * s + 1; // first glass row above the storey slab
    if (y < info.G || y > ROOF - 1) continue;
    if (info.tt % 2 === 0) continue; // mullion, not glass
    if (((info.tt + s + info.x + info.z) % 4) !== 0) continue;
    const xi = info.x - d.dx;
    const zi = info.z - d.dz;
    const inner = facadeAt.get(k2(xi, zi));
    if (!ground.has(k2(xi, zi))) continue;
    if (inner && inner.facade) continue;
    const Gi = ground.get(k2(xi, zi));
    const slabY = 5 * s;
    if (slabY < Gi) continue; // no floor slab under this interior cell
    g.set(xi, y, zi, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
