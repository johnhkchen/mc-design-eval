import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// An interwar brick commercial block: three storeys over a shopfront, cream string courses and a cornice, a one-storey
// wing on the low west side, and a stair-and-lift housing on the roof. Storey lines are absolute (y = 0, 4, 8, 12), so
// the downhill (west, ground 0) side shows its full storeys and the uphill (east, ground 2) side buries its shopfront
// in the foundation. Only footprint cells are built. The walls are the ring of cells with a missing neighbour (one
// cell thick); the interior is air between floor slabs, so every window has an air gap behind it.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658677.cells.json", "utf8"));

// lidar roof reads smoothed into flat tiers: anything near the 14-block roof is that roof, a read under 4 is a one-storey wing
const plan = new Map();
for (const [x, z, ground, roof] of cells) plan.set(`${x},${z}`, { ground, top: roof >= 10 ? 14 : Math.max(4, roof) });
const has = (x, z) => plan.has(`${x},${z}`);
const STEP = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const exposed = (x, z) => Object.keys(STEP).filter((d) => !has(x + STEP[d][0], z + STEP[d][1]));
const DOOR = [1, 5];   // the west (street) face
const INWARD = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };

const g = new Voxels([9, 27, 10]);
const pane = (d) => (d === "W" || d === "E"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

for (const [key, { ground, top }] of plan) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposed(x, z), ring = ex.length > 0, corner = ex.length > 1, d = ex[0];
  const street = ex.includes("W") || ex.includes("N");
  const along = d === "W" || d === "E" ? z : x;   // position along the face: odd cells are windows, even cells piers
  const door = !corner && d === "W" && x === DOOR[0] && z === DOOR[1];
  for (let y = 0; y <= top; y++) {
    if (y < ground) g.set(x, y, z, "stone_bricks");                                    // foundation to the lidar ground
    else if (y === top) g.set(x, y, z, ring ? "smooth_sandstone" : "smooth_stone");     // parapet cap / roof
    else if (ring && y === top - 1) g.set(x, y, z, "smooth_sandstone");                 // cornice
    else if (y % 4 === 0) g.set(x, y, z, ring ? "smooth_sandstone" : "smooth_stone");   // storey line / floor slab
    else if (ring) {
      const r = y % 4;
      if (corner) g.set(x, y, z, "stone_bricks");                                       // quoins
      else if (y < 4 && street) {                                                       // shopfront
        if (r === 3) g.set(x, y, z, "dark_oak_planks");                                 // fascia
        else if (door) g.set(x, y, z, "dark_oak_door", { facing: "east", half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        else if (along % 2 === 0) g.set(x, y, z, "stone_bricks");
        else g.set(x, y, z, "glass");
      } else if (along % 2 === 0) g.set(x, y, z, "bricks");                              // upper piers
      else if (r === 3) g.set(x, y, z, "stone_bricks");                                 // window head
      else g.set(x, y, z, "glass_pane", pane(d));
    }
  }
}

// roof housing for the stair and lift: two cells of brick, two high, on the flat roof (a taller one reads as a chimney)
for (const [x, z] of [[6, 2], [7, 2], [6, 3], [7, 3]]) {
  for (let y = 15; y <= 16; y++) g.set(x, y, z, "bricks");
  g.set(x, 17, z, "smooth_sandstone");
}

// warm lights: a lantern standing on the floor just inside some windows (air at its cell, solid below it)
for (const [key, { ground }] of plan) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposed(x, z);
  if (ex.length !== 1) continue;
  const d = ex[0], [dx, dz] = INWARD[d], ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || exposed(ix, iz).length) continue;
  const along = d === "W" || d === "E" ? z : x;
  for (let y = 1; y < 14; y += 4) {
    if ((along + y) % 5 !== 0 || y < ground) continue;
    const win = g.get(x, y, z)?.block;
    if (win !== "glass" && win !== "glass_pane") continue;
    if (g.get(ix, y, iz) !== null || g.get(ix, y - 1, iz) === null) continue;
    g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// nothing floats: every solid block reaches the ground (y 0) through a chain of face-adjacent solid blocks
const seen = new Set(), stack = [];
for (let x = 0; x < 9; x++) for (let z = 0; z < 10; z++) if (g.get(x, 0, z)) { stack.push([x, 0, z]); seen.add(`${x},0,${z}`); }
while (stack.length) {
  const [x, y, z] = stack.pop();
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const n = [x + dx, y + dy, z + dz], k = n.join(",");
    if (n.some((v, i) => v < 0 || v >= g.size[i]) || seen.has(k) || !g.get(...n)) continue;
    seen.add(k); stack.push(n);
  }
}
const floating = [];
for (let x = 0; x < 9; x++) for (let y = 0; y < 27; y++) for (let z = 0; z < 10; z++) if (g.get(x, y, z) && !seen.has(`${x},${y},${z}`)) floating.push(`${x},${y},${z}`);
if (floating.length) throw new Error(`floating blocks: ${floating.slice(0, 10).join(" ")} (${floating.length})`);

console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658677.nbt"));
