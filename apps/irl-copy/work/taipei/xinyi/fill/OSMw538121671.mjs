import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538121671";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 25, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Perimeter / facade classification
function classify(x, z) {
  const edgeX = !has(x - 1, z) || !has(x + 1, z);
  const edgeZ = !has(x, z - 1) || !has(x, z + 1);
  const perim = edgeX || edgeZ;
  const corner = edgeX && edgeZ;
  // bay index along the facade the cell belongs to
  let bay = 0;
  if (edgeZ && !edgeX) bay = x; // north/south face, bays run along x
  else if (edgeX && !edgeZ) bay = z; // east/west face, bays run along z
  const pier = corner || (perim && bay % 3 === 0);
  return { perim, corner, bay, pier };
}

// Door: on the lowest-z (north) face, nearest to x = 12
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
let door = null;
for (const [x, z] of cells) {
  if (z !== minZ) continue;
  const c = classify(x, z);
  if (!c.perim || c.corner) continue;
  if (!door || Math.abs(x - 12) < Math.abs(door.x - 12)) door = { x, z };
}

// Main shell, cell by cell
for (const [x, z, gr] of cells) {
  const { perim, bay, pier } = classify(x, z);
  for (let y = 0; y <= 11; y++) {
    // Foundation below the cell's own ground
    if (y < gr) {
      put(x, y, z, "stone_bricks");
      continue;
    }
    // Floor slab / base course at the cell's ground level
    if (y === gr) {
      put(x, y, z, perim ? "polished_granite" : "light_gray_concrete");
      continue;
    }
    // Storey lines (y=5), cornice (y=10) and roof slab (interior y=10)
    if (y === 5) {
      put(x, y, z, perim ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    if (y === 10) {
      put(x, y, z, perim ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    // Interior air (no interiors beyond floor slabs)
    if (!perim) continue;

    // Parapet
    if (y === 11) {
      put(x, y, z, "white_concrete");
      continue;
    }
    // Piers
    if (pier) {
      put(x, y, z, "white_concrete");
      continue;
    }
    // Fascia above the shopfront
    if (y === 4) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    // Lintel above second-floor windows
    if (y === 9) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    // Ground-floor shopfront glazing
    if (y > gr && y <= 3) {
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }
    // Second-floor windows
    if (y >= 6 && y <= 8) {
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }
    put(x, y, z, "white_concrete");
  }
}

// Entrance door (two blocks high), set after the shell so it overrides glazing
if (door) {
  const dg = gnd(door.x, door.z);
  put(door.x, dg + 1, door.z, "iron_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(door.x, dg + 2, door.z, "iron_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Warm light behind some windows
for (const [x, z, gr] of cells) {
  const c = classify(x, z);
  if (!c.perim || c.pier) continue;
  // find the inward neighbour (footprint, non-perimeter)
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let inward = null;
  for (const [dx, dz] of dirs) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !classify(nx, nz).perim) { inward = { x: nx, z: nz, gr: gnd(nx, nz) }; break; }
  }
  if (!inward) continue;
  // second-floor glowstone
  if (c.bay % 4 === 2 && inward.gr < 7) {
    put(inward.x, 7, inward.z, "glowstone");
  }
  // ground-floor shroomlight
  if (c.bay % 5 === 1 && inward.gr < 2) {
    put(inward.x, 2, inward.z, "shroomlight");
  }
}

// Roof equipment: two plant boxes on the roof slab
const plantBoxes = [
  { x0: 6, x1: 8, z0: 5, z1: 6, h: 2 },
  { x0: 15, x1: 17, z0: 11, z1: 12, h: 1 },
];
for (const b of plantBoxes) {
  for (let x = b.x0; x <= b.x1; x++) {
    for (let z = b.z0; z <= b.z1; z++) {
      if (!has(x, z)) continue;
      if (classify(x, z).perim) continue;
      if (gnd(x, z) > 10) continue;
      put(x, 11, z, "gray_concrete");
      if (b.h === 2) put(x, 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${dir}/${id}.nbt`);
