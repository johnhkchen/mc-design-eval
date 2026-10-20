import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397503";
const W = 25, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Outward normals and wall lengths per face
const DX = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const LEN = { north: W, south: W, west: D, east: D };
const faceList = (x, z) =>
  Object.keys(DX).filter((f) => !has(x + DX[f][0], z + DX[f][1]));

const set = (x, y, z, id, props) => g.set(x, y, z, id, props);

for (const [x, z, b] of cells) {
  if (b + 11 >= H) throw new Error(`cell ${x},${z} ground ${b} too high for canvas`);

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < b; y++) set(x, y, z, "stone_bricks");

  const faces = faceList(x, z);
  const wall = faces.length > 0;

  if (!wall) {
    // Interior: floor slabs per storey and roof slab; air between
    set(x, b, z, "smooth_stone");
    set(x, b + 5, z, "smooth_stone");
    set(x, b + 10, z, "smooth_stone");
    // Roof equipment: small plant boxes
    if (x % 6 === 3 && z % 5 === 2) set(x, b + 11, z, "iron_block");
    continue;
  }

  const face = faces[0];
  const onSouth = faces.includes("south");
  const u = face === "north" || face === "south" ? x : z;
  const L = LEN[face];
  const corner = faces.length > 1 || u === 0 || u === L - 1;
  const pier = corner || u % 4 === 0;
  const door = onSouth && u === 12;
  const canopy = onSouth && u >= 10 && u <= 14;

  // Pane connections run along the wall line
  const paneProps =
    face === "north" || face === "south"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Base course
  set(x, b, z, "stone_bricks");

  // Ground storey (shopfront)
  if (door) {
    const doorProps = {
      facing: "south",
      hinge: "left",
      open: "false",
      powered: "false",
    };
    set(x, b + 1, z, "dark_oak_door", { ...doorProps, half: "lower" });
    set(x, b + 2, z, "dark_oak_door", { ...doorProps, half: "upper" });
  } else {
    for (let rel = 1; rel <= 2; rel++) {
      set(x, b + rel, z, pier ? "white_concrete" : "glass");
    }
  }
  if (canopy) {
    set(x, b + 3, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
  } else {
    set(x, b + 3, z, pier ? "white_concrete" : "glass");
  }
  set(x, b + 4, z, "white_concrete");

  // Slab / cornice line between storeys
  set(x, b + 5, z, "light_gray_concrete");

  // Upper storey: spandrels top and bottom, windows between
  set(x, b + 6, z, "light_gray_concrete");
  for (let rel = 7; rel <= 8; rel++) {
    if (pier) {
      set(x, b + rel, z, "white_concrete");
    } else {
      set(x, b + rel, z, "light_blue_stained_glass_pane", paneProps);
    }
  }
  set(x, b + 9, z, "light_gray_concrete");

  // Cornice and parapet
  set(x, b + 10, z, "light_gray_concrete");
  set(x, b + 11, z, "white_concrete");

  // Corner lanterns on the parapet
  if (faces.length > 1) {
    set(x, b + 12, z, "lantern", { hanging: "false" });
  }

  // Warm light behind some upper windows
  if (!pier && u % 8 === 2) {
    const ix = x - DX[face][0];
    const iz = z - DX[face][1];
    if (has(ix, iz) && faceList(ix, iz).length === 0) {
      set(ix, b + 7, iz, "glowstone");
    }
  }

  // Warm light behind shopfront glass
  if (!door && !pier && u % 8 === 5) {
    const ix = x - DX[face][0];
    const iz = z - DX[face][1];
    if (has(ix, iz) && faceList(ix, iz).length === 0) {
      set(ix, b + 1, iz, "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
