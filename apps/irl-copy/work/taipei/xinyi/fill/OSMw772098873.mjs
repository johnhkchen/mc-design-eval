import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-century Taipei commercial block (c. 1970s-80s): cream tiled
// facade, concrete piers, shopfront glazing at street level, a band of
// aluminium-framed windows above, parapet with a small rooftop plant room.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw772098873";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 13, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const ROOF = 11;          // roof slab level (lidar: ~11 above lowest ground)
const PARAPET = ROOF + 1; // parapet course on top of the cornice

const key = (x, z) => `${x},${z}`;
const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(key(x, z), Math.round(gr));
const has = (x, z) => groundAt.has(key(x, z));

const maxZ = Math.max(...cells.map(c => c[1]));
const doorCandidates = cells.filter(c => c[1] === maxZ).map(c => c[0]);
const meanDoorX = doorCandidates.reduce((a, b) => a + b, 0) / doorCandidates.length;
const doorX = doorCandidates.reduce((best, x) =>
  Math.abs(x - meanDoorX) < Math.abs(best - meanDoorX) ? x : best, doorCandidates[0]);

const shroomlights = [];
const penthouse = (x, z) => x >= 4 && x <= 8 && z >= 5 && z <= 10;

for (const [cx, cz, gr0] of cells) {
  const gr = Math.round(gr0);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(cx, y, cz, "stone_bricks");

  const N = has(cx, cz - 1), S = has(cx, cz + 1);
  const Wn = has(cx - 1, cz), E = has(cx + 1, cz);
  const perim = !(N && S && Wn && E);
  const corner = (!Wn || !E) && (!N || !S);
  const pier = perim && (corner || cx % 3 === 0 || cz % 3 === 0);

  if (!perim) {
    // Interior: floor slab per storey, air gap otherwise, roof slab on top.
    g.set(cx, gr, cz, "smooth_stone");
    for (let y = gr + 1; y < ROOF; y++) {
      if (y === 5 || y === 10) g.set(cx, y, cz, "smooth_stone");
    }
    g.set(cx, ROOF, cz, "light_gray_concrete");
    if (penthouse(cx, cz)) {
      g.set(cx, ROOF + 1, cz, "smooth_quartz");
      g.set(cx, ROOF + 2, cz, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter cell.
  g.set(cx, gr, cz, "polished_andesite"); // base course
  for (let y = gr + 1; y < ROOF; y++) {
    let blk;
    if (pier) blk = "light_gray_concrete";
    else if (y === 5 || y === 10) blk = "smooth_quartz";      // floor lines
    else if (y <= 3) blk = "cyan_stained_glass_pane";         // shopfront glazing
    else if (y === 4) blk = "smooth_quartz";                  // shopfront lintel
    else if (y === 6 || y === 9) blk = "smooth_quartz";       // window head/sill
    else blk = "light_blue_stained_glass_pane";               // upper windows
    g.set(cx, y, cz, blk);
  }
  g.set(cx, ROOF, cz, "smooth_quartz");       // cornice
  g.set(cx, PARAPET, cz, "smooth_quartz");    // parapet

  // Warm light behind some upper-storey windows (placed after the loop).
  if (!pier && (cx + cz) % 4 === 0) {
    const dx = !E ? -1 : (!Wn ? 1 : 0);
    const dz = !S ? -1 : (!N ? 1 : 0);
    if (dx !== 0 && has(cx + dx, cz)) shroomlights.push([cx + dx, 7, cz]);
    else if (dz !== 0 && has(cx, cz + dz)) shroomlights.push([cx, 7, cz + dz]);
  }
}

for (const [x, y, z] of shroomlights) g.set(x, y, z, "shroomlight");

// Rooftop plant room sits on the roof slab inside the footprint.
for (const [cx, cz] of cells) {
  if (penthouse(cx, cz)) {
    const interior = has(cx - 1, cz) && has(cx + 1, cz) && has(cx, cz - 1) && has(cx, cz + 1);
    if (interior) {
      g.set(cx, ROOF + 1, cz, "smooth_quartz");
      g.set(cx, ROOF + 2, cz, "light_gray_concrete");
    }
  }
}

// Street entrance on the south-facing (max z) face, centred, with a lintel.
const gDoor = Math.round(groundAt.get(key(doorX, maxZ)));
g.set(doorX, gDoor + 1, maxZ, "dark_oak_door", {
  facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
});
g.set(doorX, gDoor + 2, maxZ, "dark_oak_door", {
  facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
});
g.set(doorX, gDoor + 3, maxZ, "smooth_quartz"); // door head above the opening

g.save(`${dir}/${id}.nbt`);
