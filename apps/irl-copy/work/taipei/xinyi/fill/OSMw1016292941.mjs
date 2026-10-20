import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016292941";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const W = 24, H = 23, D = 13;
const g = new Voxels([W, H, D]);

// Minecraft facings: north = -z, south = +z, east = +x, west = -x
const FACES = [
  { dx: 1, dz: 0, facing: "east" },
  { dx: -1, dz: 0, facing: "west" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: 0, dz: -1, facing: "north" },
];

const outward = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));

// Door: south face, near the middle of the 24-block front
const DOOR_X = 13;
const DOOR_Z = 12;

function paneProps(f) {
  // glass pane connects along the wall it sits in
  const alongX = f.facing === "east" || f.facing === "west";
  return {
    north: alongX ? "true" : "false",
    south: alongX ? "true" : "false",
    east: alongX ? "false" : "true",
    west: alongX ? "false" : "true",
    waterlogged: "false",
  };
}

function wallProps(f) {
  const alongX = f.facing === "east" || f.facing === "west";
  return {
    up: "true",
    north: alongX ? "low" : "none",
    south: alongX ? "low" : "none",
    east: alongX ? "none" : "low",
    west: alongX ? "none" : "low",
    waterlogged: "false",
  };
}

// Pick the exterior face used for a cell; corners use the first face found.
function faceIndex(x, z, f) {
  return f.facing === "east" || f.facing === "west" ? z : x;
}

// Set one exterior-facing block at relative height rel
function placeFacade(x, z, f, y, gr) {
  const rel = y - gr;
  const idx = faceIndex(x, z, f);
  const bay = idx % 3; // 0 = pier, 1 = window / shopfront, 2 = shopfront or pier
  const onFrontDoor = f.facing === "south" && x === DOOR_X && z === DOOR_Z;

  if (rel === 0) {
    g.set(x, y, z, "stone_bricks");
    return;
  }
  if (onFrontDoor) {
    if (rel === 1) return g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    if (rel === 2) return g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (rel === 3 || rel === 4) return g.set(x, y, z, "dark_oak_planks");
  }
  if (rel >= 1 && rel <= 3) {
    if (bay === 0) return g.set(x, y, z, "white_concrete");
    return g.set(x, y, z, "glass");
  }
  if (rel === 4) return g.set(x, y, z, bay === 0 ? "white_concrete" : "dark_oak_planks");
  if (rel === 5) return g.set(x, y, z, "smooth_stone");
  if (rel >= 6 && rel <= 9) {
    if (bay === 1) return g.set(x, y, z, "glass_pane", paneProps(f));
    return g.set(x, y, z, "white_concrete");
  }
  if (rel === 10) return g.set(x, y, z, "smooth_stone");
  if (rel === 11) return g.set(x, y, z, "stone_brick_wall", wallProps(f));
}

// Foundation fill, then body, storeys, roof
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const faces = outward(x, z);
  for (let rel = 0; rel <= 11; rel++) {
    const y = gr + rel;
    if (faces.length) {
      placeFacade(x, z, faces[0], y, gr);
    } else {
      // interior: floor slabs, roof slab, air between
      if (rel === 0 || rel === 5) g.set(x, y, z, "smooth_stone");
      else if (rel === 10) g.set(x, y, z, "light_gray_concrete");
      else if (rel === 11 && x % 6 === 3 && z % 4 === 1) g.set(x, y, z, "iron_block");
    }
  }
}

// Warm lights behind some upper-floor windows (interior air gap, interior cells only)
for (const [x, z, gr] of cells) {
  const faces = outward(x, z);
  if (!faces.length) continue;
  const f = faces[0];
  const idx = faceIndex(x, z, f);
  if (idx % 3 !== 1 || idx % 2 !== 0) continue;
  const ix = x - f.dx, iz = z - f.dz;
  if (!has(ix, iz) || outward(ix, iz).length) continue;
  g.set(ix, gr + 7, iz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
