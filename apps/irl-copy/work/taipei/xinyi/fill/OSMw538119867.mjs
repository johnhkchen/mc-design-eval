import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538119867";
const W = 15, H = 23, D = 23;

// Footprint: [x, z, ground] per cell. Lowest ground becomes y 0.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => c[2]));
const cellMap = new Map();
for (const [x, z, gr] of raw) cellMap.set(`${x},${z}`, gr - minG);

const has = (x, z) => cellMap.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);

// Storey plan relative to each cell's ground (r):
//  r0      base course
//  r1-3    ground-floor shopfront (glass, piers, entrance)
//  r4      lintel band
//  r5      upper storey sill / floor slab
//  r6-8    upper windows
//  r9      storey line
//  r10     roof slab and cornice
//  r11     roof plant (sparse)
const R_ROOF = 10;
const R_EQUIP = 11;

for (const [key, gr] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const w = !has(x - 1, z), e = !has(x + 1, z), n = !has(x, z - 1), s = !has(x, z + 1);
  const perim = w || e || n || s;
  const corner = (w || e) && (n || s);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const Y = r => gr + r;

  // Roof slab over every cell; interior floor slabs at ground and storey line.
  g.set(x, Y(R_ROOF), z, "gray_concrete");
  if (!perim) {
    g.set(x, Y(0), z, "smooth_stone");
    g.set(x, Y(5), z, "smooth_stone");
    // Roof plant: sparse water-tank / AC boxes.
    if ((x * 3 + z * 5) % 11 === 0) g.set(x, Y(R_EQUIP), z, "iron_block");
    continue;
  }

  // Perimeter base course.
  g.set(x, Y(0), z, "polished_andesite");

  if (corner) {
    // Heavy corner columns carrying the facade.
    for (let r = 1; r <= 9; r++) g.set(x, Y(r), z, "light_gray_concrete");
    g.set(x, Y(R_ROOF), z, "smooth_quartz");
    continue;
  }

  // Non-corner facade cell: determine outward axis and position along the face.
  const axisX = w || e;               // west/east face -> run along z
  const t = axisX ? z : x;
  const facing = w ? "west" : e ? "east" : n ? "north" : "south";
  const isPier = (t % 3 === 0);
  const isDoor = (facing === "south" && x === 7 && !isPier);
  const paneProps = axisX
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

  // Ground floor shopfront r1..3.
  for (let r = 1; r <= 3; r++) {
    if (isDoor) continue;
    if (isPier) g.set(x, Y(r), z, "smooth_stone");
    else g.set(x, Y(r), z, "glass_pane", paneProps);
  }
  if (isDoor) {
    g.set(x, Y(1), z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, Y(2), z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, Y(3), z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }

  // Lintel band between storeys.
  g.set(x, Y(4), z, "smooth_quartz");

  // Upper storey: sill, windows, piers.
  if (isPier) {
    for (let r = 5; r <= 8; r++) g.set(x, Y(r), z, "white_concrete");
  } else {
    g.set(x, Y(5), z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    for (let r = 6; r <= 8; r++) g.set(x, Y(r), z, "glass_pane", paneProps);
  }

  // Storey line and cornice.
  g.set(x, Y(9), z, "smooth_quartz");
  g.set(x, Y(R_ROOF), z, "smooth_quartz");

  // Warm light behind some windows, placed in the interior cell next to the glass.
  const dx = w ? 1 : e ? -1 : 0;
  const dz = n ? 1 : s ? -1 : 0;
  const ix = x + dx, iz = z + dz;
  if (!isPier && has(ix, iz) && !isPerim(ix, iz)) {
    if ((t + gr) % 4 === 0) g.set(ix, Y(2), iz, "glowstone");
    if ((t + gr) % 5 === 1) g.set(ix, Y(7), iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
