// 1899 Pennsylvania Ave NW: a Commercial-Office-Large block in the Romanesque/Beaux-Arts office idiom of the 1890s.
// A brick-faced shell on a stone base with quartz storey bands and a quartz cornice, a shopfront ground storey,
// a central pavilion and a lower south-west wing (the lidar tiers 19 and 18 over the 17 main roof), and a blank brick
// firewall on the east that rises to the lidar's 22. Only the footprint is built; walls are the outer shell, the
// floor slabs are solid, and the storeys between them are air behind the glass.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC53973.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const W = 19, D = 16, H = 34;
const g = new Voxels([W, H, D]);

// Ground (0 or 1) and the lidar roof, read per cell; the roof is smoothed into tiers: 22 on the east firewall column,
// 19 on the central pavilion, 18 on the south-west wing, 17 on the rest (the lidar's 18s are the edge noise between them).
const G = [], R = [], inFp = [];
for (let x = 0; x < W; x++) { G.push([]); R.push([]); inFp.push([]); for (let z = 0; z < D; z++) { G[x].push(0); R[x].push(0); inFp[x].push(false); } }
for (const [x, z, ground] of cells) { inFp[x][z] = true; G[x][z] = ground; }
const tier = (x, z) => {
  if (x === 18) return 22;
  if (x >= 4 && x <= 15 && z >= 1 && z <= 11) return 19;
  if (x <= 6 && z >= 11) return 18;
  return 17;
};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inFp[x][z]) R[x][z] = tier(x, z);

const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && inFp[x][z];
const covers = (x, z, y) => inside(x, z) && G[x][z] <= y && y < R[x][z];
// Which horizontal faces of a body cell at height y are exposed (no neighbour body there).
const exposed = (x, z, y) => {
  const out = [];
  if (!covers(x, z - 1, y)) out.push("N");
  if (!covers(x, z + 1, y)) out.push("S");
  if (!covers(x - 1, z, y)) out.push("W");
  if (!covers(x + 1, z, y)) out.push("E");
  return out;
};

// Storey bands: solid floor slabs (and the top deck) at these heights, window rows between them.
const FLOORS = new Set([5, 8, 11, 14, 16]);
const WINDOW_ROWS = new Set([6, 7, 9, 10, 12, 13, 15, 17]);
const GROUND_TOP = 5;                       // shopfront storey: y below this
const ENTRANCE_X = 9;                       // the door on the north (z = 0) front, on the pier line

const glass = (dirs) => ({ north: dirs.includes("N") ? "true" : "false", south: dirs.includes("S") ? "true" : "false",
  east: dirs.includes("E") ? "true" : "false", west: dirs.includes("W") ? "true" : "false" });
const paneAlong = (face) => (face === "h" ? glass(["E", "W"]) : glass(["N", "S"]));
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inFp[x][z]) continue;
  const gr = G[x][z], top = R[x][z];

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const isFloor = y === gr || y === top - 1 || FLOORS.has(y);
    const shell = exposed(x, z, y);
    if (isFloor) {
      // Floors and the top deck are solid. On the outside they are the base course, storey bands and cornice.
      if (shell.length) g.set(x, y, z, y === gr ? "stone_bricks" : "smooth_quartz");
      else g.set(x, y, z, "stone");
      continue;
    }
    if (!shell.length) continue;                       // interior storey: air behind the glass
    // Firewall on the east column: bricks, no windows.
    if (x === 18) { g.set(x, y, z, "bricks"); continue; }
    // Facade pattern: pier and bay by the face's own index (x on N/S fronts, z on W/E fronts).
    const onH = shell.includes("N") || shell.includes("S");
    const idx = onH ? x : z;
    const pier = idx % 3 === 0;
    const face = onH ? "h" : "v";
    if (y < GROUND_TOP) {
      // Shopfront storey: stone piers, glazed bays with a door at the entrance, brick above the glazing.
      const glazed = !pier && (y === gr + 1 || y === gr + 2);
      if (onH && z === 0 && x === ENTRANCE_X && (y === gr + 1 || y === gr + 2)) {
        g.set(x, y, z, "dark_oak_door", doorState(y === gr + 1 ? "lower" : "upper"));
      } else if (onH && z === 0 && x >= ENTRANCE_X - 1 && x <= ENTRANCE_X + 1 && y === gr + 3) {
        g.set(x, y, z, "smooth_quartz");              // entrance lintel
      } else if (glazed) {
        g.set(x, y, z, "glass_pane", paneAlong(face));
      } else if (pier) {
        g.set(x, y, z, "stone_bricks");
      } else {
        g.set(x, y, z, "bricks");
      }
      continue;
    }
    // Upper storeys: brick piers, glazed bays in the window rows.
    if (pier) g.set(x, y, z, "bricks");
    else if (WINDOW_ROWS.has(y)) g.set(x, y, z, "glass_pane", paneAlong(face));
    else g.set(x, y, z, "bricks");
  }
}

// Warm lights behind some glass: in the air gap, never in the glass itself.
for (const [x, y, z] of [[7, 2, 1], [13, 2, 1], [7, 6, 1], [13, 9, 1], [7, 12, 1], [16, 15, 1]]) g.set(x, y, z, "glowstone");

// Roof plant on the main 17 roof: a 2 x 2 x 2 mechanical housing on the deck.
for (const [x, z] of [[10, 14], [11, 14], [10, 15], [11, 15]]) for (const y of [17, 18]) g.set(x, y, z, "smooth_stone");

const out = `${dir}/DC53973.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries`);
