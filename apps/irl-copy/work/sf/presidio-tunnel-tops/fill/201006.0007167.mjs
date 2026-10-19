// 201006.0007167: a three-storey mixed-use block on Pacific Avenue, c.1910s: cream stucco over a stone plinth, a shopfront
// with a dark-wood fascia on the longest street face, two upper storeys of paired windows between dressed piers and
// belt courses, and a flat roof behind a dressed parapet with a stair bulkhead. No record, so the era comes from the
// lidar roof height (about 6 blocks = three 2-block storeys) and the footprint. Walls are one block thick, so the rooms
// behind the glass are air; a lantern sits in some of them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const cells = JSON.parse(readFileSync(`${DIR}/201006.0007167.cells.json`, "utf8"));   // [x, z, ground]

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const onFootprint = (x, z) => ground.has(`${x},${z}`);

// Outward step per face, and the faces a cell has with no footprint cell beyond them.
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const facesOf = (x, z) => Object.keys(OUT).filter((f) => !onFootprint(x + OUT[f][0], z + OUT[f][1]));
const isWall = (x, z) => facesOf(x, z).length > 0;
const isCorner = (x, z) => facesOf(x, z).length > 1;

// The street face is the single-face wall run that is longest: its ground floor is the shopfront.
const runs = { N: 0, S: 0, W: 0, E: 0 };
for (const [x, z] of cells) { const f = facesOf(x, z); if (f.length === 1) runs[f[0]]++; }
const SHOP = Object.keys(runs).reduce((a, b) => (runs[b] > runs[a] ? b : a));
const along = (f, x, z) => (f === "N" || f === "S" ? x : z);   // position along a face: the bay rhythm

const g = new Voxels([17, 10, 14]);
const PLINTH = "stone_bricks", WALL = "smooth_quartz", DRESS = "quartz_bricks", FASCIA = "dark_oak_planks";
const PIER = { axis: "y" };
const PANE = {
  NS: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" },   // pane runs along x
  EW: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" },   // pane runs along z
};
const LANTERN = { hanging: "false", waterlogged: "false" };
// One upper window in six is lit from within: glowstone in the window plane reads as a lit pane at dusk, since most
// of these walls are one block thick with no room behind them.
const isLit = (x, y, z) => (x * 2 + z * 3 + y) % 6 === 0;
const windowAt = (x, y, z) => (y > 1 && isLit(x, y, z) ? "glowstone" : "glass_pane");
const windowState = (x, y, z, pane) => (y > 1 && isLit(x, y, z) ? undefined : pane);
// Every third column along a face is a dressed pier; the two between are a 2-wide window bay.
const isBay = (f, x, z) => along(f, x, z) % 3 !== 0;
const isDoorBay = (f, x, z) => f === SHOP && along(f, x, z) % 3 === 1;

// The entrance: the shop-face door bay nearest the middle of that face.
const shopCells = cells.filter(([x, z]) => facesOf(x, z).length === 1 && facesOf(x, z)[0] === SHOP);
const shopAlong = shopCells.map(([x, z]) => along(SHOP, x, z)).sort((a, b) => a - b);
const mid = shopAlong[Math.floor(shopAlong.length / 2)];
const door = shopCells.filter(([x, z]) => isDoorBay(SHOP, x, z))
  .sort((a, b) => Math.abs(along(SHOP, a[0], a[1]) - mid) - Math.abs(along(SHOP, b[0], b[1]) - mid))[0];

let lights = 0;
for (const [x, z] of cells) {
  // Plinth under every footprint cell (the interior floor too), then the storey lines at y 2 and 4 and the parapet at y 6.
  g.set(x, 0, z, PLINTH);
  const faces = facesOf(x, z);
  if (faces.length === 0) {
    // Interior: floors at y 2 and 4, air at y 1, 3 and 5, the roof covering (a bottom slab) at y 6.
    g.set(x, 2, z, "oak_planks"); g.set(x, 4, z, "oak_planks");
    g.set(x, 6, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    continue;
  }
  if (isCorner(x, z)) {
    for (let y = 1; y <= 5; y++) g.set(x, y, z, "quartz_pillar", PIER);
    g.set(x, 6, z, DRESS);
    continue;
  }

  const f = faces[0];
  const pane = f === "N" || f === "S" ? PANE.NS : PANE.EW;
  const [ox, oz] = [-OUT[f][0], -OUT[f][1]];   // one step inside, where a light can sit behind the glass
  const ix = x + ox, iz = z + oz;
  const roomBehind = onFootprint(ix, iz) && !isWall(ix, iz);
  const bay = isBay(f, x, z);

  g.set(x, 2, z, DRESS); g.set(x, 4, z, DRESS);   // belt courses: upper sills and heads
  g.set(x, 6, z, DRESS);                           // parapet all round

  if (f === SHOP) {
    if (isDoorBay(f, x, z) && x === door[0] && z === door[1]) {
      const facing = { N: "north", S: "south", W: "west", E: "east" }[f];
      g.set(x, 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    } else if (bay) {
      g.set(x, 1, z, "glass");       // the shop window, clear to the street
      g.set(x, 2, z, FASCIA);        // dark-wood fascia band over it
    } else {
      g.set(x, 1, z, "dark_oak_log", PIER); g.set(x, 2, z, "dark_oak_log", PIER);
    }
  } else {
    g.set(x, 1, z, bay ? windowAt(x, 1, z) : WALL, bay ? windowState(x, 1, z, pane) : undefined);
  }
  // Storeys 2 and 3: a window in each bay, stucco on the piers.
  for (const y of [3, 5]) g.set(x, y, z, bay ? windowAt(x, y, z) : WALL, bay ? windowState(x, y, z, pane) : undefined);

  // Warm lights in some windows: a lantern on the floor behind the glass.
  if (bay && roomBehind && (x * 3 + z * 5) % 4 === 0) {
    const y = (x + z) % 2 === 0 ? 1 : 3;
    g.set(ix, y, iz, "lantern", LANTERN); lights++;
  }
}

// Stair bulkhead on the roof: the 2x2 interior block nearest the middle of the footprint.
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length, cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
let best = null;
for (const [x, z] of cells) {
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!quad.every(([qx, qz]) => onFootprint(qx, qz) && !isWall(qx, qz))) continue;
  const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
  if (!best || d < best.d) best = { d, quad };
}
if (best) {
  for (const [x, z] of best.quad) {
    g.set(x, 6, z, "stone_bricks"); g.set(x, 7, z, "stone_bricks");
    g.set(x, 8, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

const out = g.save(`${DIR}/201006.0007167.nbt`);
console.log(JSON.stringify({ shop: SHOP, door, lanterns: lights, ...out }));
