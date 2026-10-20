import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Late-1980s/1990s Taipei mid-rise: 6 storeys of 5 blocks, cream tiled
// facade with light-grey floor lines, tinted glass in aluminium-look frames,
// stone-brick base course and shopfront, parapet, water tanks and AC plant on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980201";
const W = 19, H = 43, D = 28;
const ROOF = 31;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inFP = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const outward = (x, z) => {
  const f = [];
  if (!inFP(x, z - 1)) f.push("north");
  if (!inFP(x, z + 1)) f.push("south");
  if (!inFP(x - 1, z)) f.push("west");
  if (!inFP(x + 1, z)) f.push("east");
  return f;
};
const isExt = (x, z) => outward(x, z).length > 0;

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (face) =>
  (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Floor lines sit at y = 1, 6, 11, 16, 21, 26 and the roof at 31.
// Each storey: floor line (r=0), three window rows (r=1..3), spandrel (r=4).
for (const [x, z, gr] of cells) {
  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const faces = outward(x, z);
  const ext = faces.length > 0;
  const face = faces[0];

  for (let y = gr + 1; y <= ROOF; y++) {
    if (y === ROOF) { put(x, y, z, "light_gray_concrete"); continue; }

    const r = (y - 1) % 5;
    const s = Math.floor((y - 1) / 5);
    const floorLine = r === 0 && y <= 26;

    if (!ext) {
      // Interior: only the floor slabs; the rest is an air gap.
      if (floorLine) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Exterior wall
    if (y === 1) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (floorLine) { put(x, y, z, "light_gray_concrete"); continue; } // storey line
    if (s === 0 && y === 5 && face === "north" && z === 0 && x >= 8 && x <= 10) {
      put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // entrance canopy
      continue;
    }
    if (r === 4) { put(x, y, z, "smooth_quartz"); continue; }        // spandrel

    // Window rows r = 1..3
    const u = (face === "north" || face === "south") ? x : z;
    const frame = u % 3 === 0;
    const isEntrance = s === 0 && face === "north" && z === 0 && x >= 8 && x <= 10;
    if (isEntrance) continue;                                        // doorway opening
    if (s === 0) {
      put(x, y, z, frame ? "stone_bricks" : "glass");                // shopfront
    } else {
      put(x, y, z, frame ? "light_gray_concrete" : "gray_stained_glass_pane", frame ? undefined : paneProps(face));
    }
  }
}

// Parapet, entrance lantern and warm lights behind selected windows.
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (isExt(x, z) && ROOF + 1 < H) put(x, ROOF + 1, z, "smooth_quartz");
}

// Lantern just inside the entrance, standing on the ground-floor slab.
if (inFP(9, 1) && gnd(9, 1) <= 1) put(9, 2, 1, "lantern", { hanging: "false", waterlogged: "false" });

// Warm lights: glowstone on the interior floor, behind some upper-storey windows.
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  const faces = outward(x, z);
  if (!faces.length) continue;
  const face = faces[0];
  const u = (face === "north" || face === "south") ? x : z;
  for (let s = 1; s < 6; s++) {
    const b = 1 + 5 * s;
    if (((u + s) % 4) !== 1) continue;
    const [dx, dz] = INWARD[face];
    const ix = x + dx, iz = z + dz;
    if (!inFP(ix, iz) || isExt(ix, iz)) continue;
    if (gnd(ix, iz) > b) continue;
    put(ix, b + 1, iz, "glowstone");
  }
}

// Roof plant: water tank (iron block with a slab cap), AC units, lightning rod.
const tankCells = [];
for (let x = 3; x <= 5; x++) for (let z = 3; z <= 5; z++) if (inFP(x, z)) tankCells.push([x, z]);
if (tankCells.length === 9) {
  for (const [x, z] of tankCells) {
    for (let y = ROOF + 1; y <= ROOF + 3; y++) put(x, y, z, "iron_block");
    put(x, ROOF + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}
for (let x = 13; x <= 14; x++) for (let z = 19; z <= 20; z++) {
  if (inFP(x, z)) put(x, ROOF + 1, z, "light_gray_concrete");
}
if (inFP(16, 4)) put(16, ROOF + 1, 4, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
