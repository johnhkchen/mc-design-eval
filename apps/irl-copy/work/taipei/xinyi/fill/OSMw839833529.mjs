import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833529";
const W = 22, D = 32, H = 52;
const ROOF = 40;            // roof slab top, about 40 blocks above lowest ground
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// Outward faces: normal direction, facing name, index along the wall, pane connection props
const FACES = [
  { name: "north", dx: 0, dz: -1, along: (x, z) => x, pane: { north: "false", south: "false", east: "true", west: "true" }, inward: [0, 1] },
  { name: "south", dx: 0, dz: 1, along: (x, z) => x, pane: { north: "false", south: "false", east: "true", west: "true" }, inward: [0, -1] },
  { name: "west", dx: -1, dz: 0, along: (x, z) => z, pane: { north: "true", south: "true", east: "false", west: "false" }, inward: [1, 0] },
  { name: "east", dx: 1, dz: 0, along: (x, z) => z, pane: { north: "true", south: "true", east: "false", west: "false" }, inward: [-1, 0] },
];
const facesOf = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Shopfront door: middle cell of the street (south) facade, falling back to other faces
let doorKey = null, doorFace = null;
const edgeCells = cells.filter(([x, z]) => facesOf(x, z).length > 0);
for (const name of ["south", "north", "east", "west"]) {
  const f = FACES.find((q) => q.name === name);
  const cand = edgeCells
    .filter(([x, z]) => facesOf(x, z).some((q) => q.name === name))
    .sort((a, b) => f.along(a[0], a[1]) - f.along(b[0], b[1]));
  if (cand.length) {
    const [x, z] = cand[Math.floor(cand.length / 2)];
    doorKey = `${x},${z}`;
    doorFace = f;
    break;
  }
}

// Main shell: foundation, floor slabs, facade rows, roof
for (const [x, z, g] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  const fs = facesOf(x, z);
  const edge = fs.length > 0;

  for (let y = g; y < ROOF; y++) {
    const k = Math.floor(y / STOREY);
    // Base course at ground level
    if (y === g) {
      put(x, y, z, edge ? "stone_bricks" : "white_concrete");
      continue;
    }
    // Floor slab / storey line
    if (y % STOREY === 0) {
      put(x, y, z, edge ? "smooth_quartz" : "white_concrete");
      continue;
    }
    // Interior air behind the facade
    if (!edge) continue;

    const base = k === 0 ? g : STOREY * k;
    const rel = y - base;
    const isWin = rel >= 1 && rel <= 3;

    // Shopfront door and lintel
    if (doorKey === `${x},${z}` && fs.includes(doorFace)) {
      const props = { facing: doorFace.name, hinge: "left", open: "false", powered: "false" };
      if (y === g + 1) { put(x, y, z, "oak_door", { ...props, half: "lower" }); continue; }
      if (y === g + 2) { put(x, y, z, "oak_door", { ...props, half: "upper" }); continue; }
      if (y === g + 3) { put(x, y, z, "smooth_quartz"); continue; }
    }

    // Corner pillars
    if (fs.length >= 2) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }

    const f = fs[0];
    if (!isWin) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    const idx = f.along(x, z);
    if (idx % 3 === 0) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    put(x, y, z, "cyan_stained_glass_pane", { ...f.pane, waterlogged: "false" });

    // Warm light behind some windows, placed in the interior cell
    if (rel === 2 && idx % 6 === 2 && k % 2 === 0) {
      const ix = x + f.inward[0], iz = z + f.inward[1];
      if (has(ix, iz) && facesOf(ix, iz).length === 0 && gnd(ix, iz) <= y) {
        put(ix, y, iz, "glowstone");
      }
    }
  }

  // Roof slab over the whole footprint
  put(x, ROOF, z, "light_gray_concrete");

  // Parapet on the edge
  if (edge) {
    put(x, ROOF + 1, z, "smooth_quartz");
    put(x, ROOF + 2, z, "smooth_quartz");
  }
}

// Roof-level helper: only on footprint cells that reach that height
const roofPut = (x, y, z, id, props) => {
  if (!has(x, z) || gnd(x, z) > y) return;
  put(x, y, z, id, props);
};

// Mechanical penthouse with roof slab
for (let x = 8; x <= 13; x++) {
  for (let z = 12; z <= 19; z++) {
    const perim = x === 8 || x === 13 || z === 12 || z === 19;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (perim) roofPut(x, y, z, "smooth_quartz");
    }
    roofPut(x, ROOF + 4, z, "light_gray_concrete");
  }
}
// Penthouse glazing and a warm light on the south side
for (let x = 9; x <= 12; x++) roofPut(x, ROOF + 2, 19, "cyan_stained_glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
roofPut(10, ROOF + 2, 18, "glowstone");

// Water tank on the roof
for (let x = 16; x <= 17; x++) {
  for (let z = 22; z <= 23; z++) {
    for (let y = ROOF + 1; y <= ROOF + 4; y++) roofPut(x, y, z, "light_gray_concrete");
  }
}

// Lightning rod on top of the penthouse
roofPut(10, ROOF + 5, 15, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

vox.save(`${DIR}/${ID}.nbt`);
