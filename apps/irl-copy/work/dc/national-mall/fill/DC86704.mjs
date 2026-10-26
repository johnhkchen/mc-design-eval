// DC86704: 1200 17th St NW, a 1960s-70s Class A office block on a granite plinth, rebuilt from the lidar roof record.
// Two tiers: a five-storey wing (roof 17 blocks) and a set-back tower core (roof 19) where the lidar reads highest.
// Hollow shell: a 1-cell wall of concrete on the footprint's outer edge, pale floor slabs at each storey line, air
// behind every pane and a lamp on some floors. Ground floor is a glazed shopfront with a recessed entrance.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86704.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const roof = new Map(), ground = new Map();
for (const [x, z, gr, ro] of cells) { roof.set(key(x, z), ro); ground.set(key(x, z), gr); }
const inF = (x, z) => roof.has(key(x, z));
const tall = (x, z) => inF(x, z) && roof.get(key(x, z)) >= 19;
// tower core: the lidar's 19-block cells, eroded one ring so the setback reads as a tier and not a noisy edge
const inT = (x, z) => tall(x, z) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => tall(x + dx, z + dz));
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const exposed = (x, z, inside) => Object.keys(DIRS).filter((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));

const g = new Voxels([14, 31, 24]);
const SLABS = [3, 6, 9, 12, 15];                 // storey lines: floor slab under each storey's air
const WINDOWS = [[1, 2], [4, 5], [7, 8], [10, 11], [13, 14]];  // ground shopfront, then four office floors
const TOWER_WINDOWS = [16, 17];                  // the set-back core's top floor
const ENTRANCE = (x, z) => z === 23 && x >= 5 && x <= 7;

// a facade cell: corners and every third bay are concrete piers; the rest are glass panes running along the wall
function facade(x, y, z, ex) {
  const alongEW = ex.includes("n") || ex.includes("s");
  if ((ex.includes("n") || ex.includes("s")) && (ex.includes("e") || ex.includes("w"))) {
    return g.set(x, y, z, "light_gray_concrete");   // corner pier
  }
  const pier = alongEW ? x % 3 === 0 : z % 3 === 0;
  if (pier) return g.set(x, y, z, "light_gray_concrete");
  const conn = alongEW
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };
  return g.set(x, y, z, "light_blue_stained_glass_pane", { ...conn, waterlogged: "false" });
}

for (const [x, z] of cells) {
  // plinth: solid granite from y 0 up to this cell's ground (lidar: 0 or 1 under this footprint)
  for (let y = 0; y <= Math.max(0, ground.get(key(x, z)) - 1); y++) g.set(x, y, z, "polished_granite");
  for (const s of SLABS) g.set(x, s, z, "white_concrete");

  const ex = exposed(x, z, inF);
  const perim = ex.length > 0;
  const towerCell = inT(x, z);

  // ground floor and upper office floors: a glazed wall on the outer edge, air behind it
  if (perim) {
    for (const [y1, y2] of WINDOWS) {
      for (const y of [y1, y2]) {
        if (ENTRANCE(x, z)) continue;          // the recessed entrance: open porch, canopy is the slab above
        facade(x, y, z, ex);
      }
    }
  }

  // wing roof at 17 (solid to y 16); cornice on the edge, tar roof inside
  if (!towerCell) g.set(x, 16, z, perim ? "smooth_quartz" : "smooth_stone");

  // tower: two more floors and a cornice at y 18, so the top is 19 blocks above the lowest ground
  if (towerCell) {
    const exT = exposed(x, z, inT);
    if (exT.length > 0) for (const y of TOWER_WINDOWS) facade(x, y, z, exT);
    g.set(x, 18, z, exT.length > 0 ? "smooth_quartz" : "smooth_stone");
  }
}

// entrance: a porch recessed into the street face, door behind it, canopy slab across the top
for (const x of [5, 6, 7]) g.set(x, 3, 23, "polished_granite");
g.set(6, 1, 22, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(6, 2, 22, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// roof plant on the wing: a concrete box on the tar roof
for (const x of [11, 12]) for (const z of [7, 8]) g.set(x, 17, z, "gray_concrete");

// warm light: some windows show a lamp just inside the glass, on the floor
const WARM = ["glowstone", "shroomlight"];
for (const [x, z] of cells) {
  const towerCell = inT(x, z);
  const inside = towerCell ? inT : inF;
  const ex = exposed(x, z, inside);
  if (ex.length !== 1) continue;                          // a plain wall cell, not a corner
  const [dx, dz] = DIRS[ex[0]];
  const ix = x - dx, iz = z - dz;                         // the cell just inside this facade cell
  if (!inside(ix, iz) || exposed(ix, iz, inside).length) continue;
  const rows = towerCell ? TOWER_WINDOWS : WINDOWS.map(([a]) => a);
  for (const y of rows) {
    if (ENTRANCE(x, z) || (x * 7 + z * 5 + y * 3) % 10 !== 0) continue;
    if (y === 1) g.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else g.set(ix, y, iz, WARM[(x + z) % 2]);
  }
}

const info = g.save(`${DIR}/DC86704.nbt`);
console.log(JSON.stringify({ ...info, tower: cells.filter(([x, z]) => inT(x, z)).length, footprint: cells.length }));
