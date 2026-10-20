import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s Taipei shophouse-office: two storeys of white concrete with
// glazed bays, light-grey floor bands, a red parapet cap, a rooftop water tank,
// and a dark-framed entrance on the north (minimum-z) face.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538459506";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 9;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const DOOR_RX = [5, 6];

function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

function paneProps(xAxisFace) {
  return xAxisFace
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

function doorProps(half, hinge) {
  return { facing: "north", half, hinge, open: "false", powered: "false" };
}

for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  const b = gy;
  const rx = x - minX;
  const rz = z - minZ;
  const faces = facesOf(x, z);
  const shell = faces.length > 0;

  if (!shell) {
    // Interior: floor slabs per storey, roof deck, optional rooftop tank. No rooms.
    g.set(x, b, z, "smooth_stone");
    g.set(x, b + 5, z, "smooth_stone");
    g.set(x, b + 10, z, "gray_concrete");
    if (rx >= 7 && rx <= 8 && rz >= 4 && rz <= 5) {
      for (let y = b + 11; y <= b + 13; y++) g.set(x, y, z, "smooth_quartz");
      g.set(x, b + 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  const xAxisFace = faces.includes("N") || faces.includes("S");
  const zAxisFace = faces.includes("W") || faces.includes("E");
  const corner = xAxisFace && zAxisFace;
  const idx = corner ? 0 : (xAxisFace ? rx : rz);
  const pillar = corner || idx % 3 === 0;
  const isDoor = !corner && faces.includes("N") && DOOR_RX.includes(rx);

  // Base course, floor bands, parapet and red cap.
  g.set(x, b, z, "polished_andesite");
  g.set(x, b + 4, z, "light_gray_concrete");
  g.set(x, b + 5, z, "light_gray_concrete");
  g.set(x, b + 9, z, "light_gray_concrete");
  g.set(x, b + 10, z, "white_concrete");
  g.set(x, b + 11, z, "red_nether_brick_slab", { type: "bottom", waterlogged: "false" });

  // Ground storey (b+1..b+3): shopfront glazing, pillars, entrance.
  for (let y = b + 1; y <= b + 3; y++) {
    if (isDoor) {
      if (y === b + 1) g.set(x, y, z, "dark_oak_door", doorProps("lower", rx === 5 ? "left" : "right"));
      else if (y === b + 2) g.set(x, y, z, "dark_oak_door", doorProps("upper", rx === 5 ? "left" : "right"));
      else g.set(x, y, z, "gray_concrete"); // canopy lintel over entrance
    } else if (pillar) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(xAxisFace));
    }
  }

  // Upper storey (b+6..b+8): window grid with pillars.
  for (let y = b + 6; y <= b + 8; y++) {
    if (pillar) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(xAxisFace));
  }

  // Warm light behind some glazed bays (interior neighbour must be non-shell).
  if (!pillar && !isDoor) {
    const f = faces[0];
    const inx = f === "W" ? x + 1 : f === "E" ? x - 1 : x;
    const inz = f === "N" ? z + 1 : f === "S" ? z - 1 : z;
    if (has(inx, inz) && facesOf(inx, inz).length === 0) {
      if (rx % 4 === 2) g.set(inx, b + 2, inz, "glowstone");
      if (rx % 4 === 1) g.set(inx, b + 7, inz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
