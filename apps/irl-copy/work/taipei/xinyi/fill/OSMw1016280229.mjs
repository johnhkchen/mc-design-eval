import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Lidar roof ~40 blocks above lowest ground, 33 x 23 footprint.
// Read as an 8-storey 1990s Xinyi office block: pale tiled concrete frame,
// blue-tinted glass bands, dark granite base, rooftop mechanical penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280229";
const W = 33, H = 52, D = 23;
const ROOF = 40;            // top of the 8th storey (8 x 5 blocks)
const PARAPET_TOP = 41;
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const GROUND = new Map();
for (const [x, z, gr] of cells) GROUND.set(key(x, z), gr);
const has = (x, z) => GROUND.has(key(x, z));

// Outward faces of a footprint cell (a face is outward when its neighbour is missing).
function outward(x, z) {
  const d = [];
  if (!has(x, z - 1)) d.push("north");
  if (!has(x, z + 1)) d.push("south");
  if (!has(x - 1, z)) d.push("west");
  if (!has(x + 1, z)) d.push("east");
  return d;
}
const isPerim = (x, z) => outward(x, z).length > 0;
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// Pick the entrance: a single-face south-facing (else north) perimeter cell nearest the mean x of that face.
let door = null;
for (const face of ["south", "north"]) {
  const cand = cells.filter(([x, z]) => {
    const o = outward(x, z);
    return o.length === 1 && o[0] === face;
  });
  if (cand.length) {
    const mx = cand.reduce((s, c) => s + c[0], 0) / cand.length;
    const best = cand.reduce((a, c) => (Math.abs(c[0] - mx) < Math.abs(a[0] - mx) ? c : a));
    door = { x: best[0], z: best[1], g: best[2], face };
    break;
  }
}

// Body of each cell.
const windowLights = []; // [inwardX, y, inwardZ]
for (const [x, z, gr] of cells) {
  const o = outward(x, z);

  if (o.length === 0) {
    // Interior: air gap, floor slabs per storey, roof surface on top.
    for (let y = gr; y <= ROOF; y++) {
      if (y === gr || y % STOREY === 0) g.set(x, y, z, "smooth_quartz");
    }
    continue;
  }

  const corner = o.length > 1;
  const isDoor = door && door.x === x && door.z === z && !corner;
  const u = o[0] === "north" || o[0] === "south" ? x : z;

  for (let y = gr; y <= PARAPET_TOP; y++) {
    // Parapet above the roof line.
    if (y >= ROOF) { g.set(x, y, z, "white_concrete"); continue; }

    if (isDoor && (y === gr || y === gr + 1)) continue; // door set below

    if (corner) {
      g.set(x, y, z, y === gr ? "polished_granite" : "white_concrete");
      continue;
    }
    if (y === gr) { g.set(x, y, z, "polished_granite"); continue; }   // base course
    if (isDoor && y === 4) { g.set(x, y, z, "black_concrete"); continue; } // fascia over entrance
    if (u % 3 === 1) { g.set(x, y, z, "light_gray_concrete"); continue; } // mullion
    if (y % STOREY === 0) { g.set(x, y, z, "light_gray_concrete"); continue; } // storey line
    if (y % STOREY === 4) { g.set(x, y, z, "white_concrete"); continue; }      // spandrel
    const storey = Math.floor(y / STOREY);
    g.set(x, y, z, storey === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");
    if (storey >= 0 && (u + storey) % 2 === 0) {
      const [dx, dz] = inward[o[0]];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !isPerim(ix, iz) && y > GROUND.get(key(ix, iz))) {
        windowLights.push([ix, y, iz]);
      }
    }
  }

  // Parapet cap.
  g.set(x, PARAPET_TOP + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance doors (two halves).
if (door) {
  const props = { facing: door.face, hinge: "left", open: "false", powered: "false" };
  g.set(door.x, door.g, door.z, "dark_oak_door", { ...props, half: "lower" });
  g.set(door.x, door.g + 1, door.z, "dark_oak_door", { ...props, half: "upper" });
}

// Warm light behind some windows.
for (const [x, y, z] of windowLights) g.set(x, y, z, "glowstone");

// Rooftop mechanical penthouse on the roof slab, fully inside the footprint.
const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / cells.length);
const cz = Math.round(cells.reduce((s, c) => s + c[1], 0) / cells.length);
let box = null;
for (let hw = 6; hw >= 2 && !box; hw--) {
  for (let hd = 4; hd >= 2 && !box; hd--) {
    let ok = true;
    for (let x = cx - hw; x <= cx + hw && ok; x++)
      for (let z = cz - hd; z <= cz + hd && ok; z++)
        if (!has(x, z) || isPerim(x, z)) ok = false;
    if (ok) box = { x0: cx - hw, x1: cx + hw, z0: cz - hd, z1: cz + hd };
  }
}
if (box) {
  const { x0, x1, z0, z1 } = box;
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      g.set(x, 45, z, "smooth_quartz"); // penthouse roof
      const ring = x === x0 || x === x1 || z === z0 || z === z1;
      if (!ring) continue;
      g.set(x, 41, z, "light_gray_concrete");
      g.set(x, 42, z, "light_blue_stained_glass");
      g.set(x, 43, z, "light_gray_concrete");
      g.set(x, 44, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
