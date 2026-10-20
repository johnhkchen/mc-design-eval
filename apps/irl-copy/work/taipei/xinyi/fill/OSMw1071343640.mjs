import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343640";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, D = 18, H = 23;
const TOP = 11;                       // roof about 11 blocks above lowest ground
const g_ = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const F = new Map();
for (const [x, z, gr] of cells) F.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => F.has(`${x},${z}`);

const ROOF_CAP = "green_glazed_terracotta";  // green roof-tile edge, Taipei accent
const SIDE_IN = {
  north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0],
};

for (const [x, z, gr] of cells) {
  const g = Math.round(gr);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) g_.set(x, y, z, "stone_bricks");

  // Which outward faces this cell exposes
  const outFaces = [];
  if (!has(x, z - 1)) outFaces.push("north");
  if (!has(x, z + 1)) outFaces.push("south");
  if (!has(x + 1, z)) outFaces.push("east");
  if (!has(x - 1, z)) outFaces.push("west");

  // Interior cell: floor slabs at storey lines, roof deck, rooftop plant
  if (outFaces.length === 0) {
    g_.set(x, 5, z, "light_gray_concrete");
    g_.set(x, 10, z, "light_gray_concrete");
    g_.set(x, TOP, z, "gray_concrete");
    if (x >= 8 && x <= 14 && z >= 6 && z <= 11) {
      g_.set(x, TOP + 1, z, "light_gray_concrete");
      g_.set(x, TOP + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // Shell cell: facade
  const face = outFaces[0];
  const alongX = face === "north" || face === "south";
  const idx = alongX ? x : z;
  const corner = outFaces.length > 1;
  const windowable = !corner && idx % 3 === 1;
  const lightOn = windowable && idx % 6 === 1;
  const paneProps = alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const [ix, iz] = SIDE_IN[face];
  const inwardOK = has(x + ix, z + iz);

  for (let y = g; y <= TOP; y++) {
    let b = "white_concrete";
    let props;

    if (y === g) {
      b = "stone_bricks";                          // base course
    } else if (y === 5 || y === 10) {
      b = "smooth_stone";                          // storey lines
    } else if (y === TOP) {
      b = ROOF_CAP;                                // parapet cap
    } else if (y < 5) {
      // Ground storey: shopfront glazing and a door on the south entrance
      if (face === "south" && idx === 11 && (y === g + 1 || y === g + 2)) {
        b = "oak_door";
        props = {
          facing: "south",
          half: y === g + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (windowable && y > g && y <= 3) {
        b = "glass_pane";
        props = paneProps;
      }
    } else {
      // Upper storey: window band at rows 7 and 8
      if (windowable && (y === 7 || y === 8)) {
        b = "glass_pane";
        props = paneProps;
      }
    }

    if (props) g_.set(x, y, z, b, props);
    else g_.set(x, y, z, b);

    // Warm light behind selected glass (interior air cell)
    const glassRow = b === "glass_pane";
    if (glassRow && lightOn && inwardOK && (y === 7 || y === 2)) {
      g_.set(x + ix, y, z + iz, "glowstone");
    }
  }
}

g_.save(`${DIR}/${ID}.nbt`);
