// 3550 West Pacific Av (Miscellaneous / Mixed-Use), Presidio Tunnel Tops, lidar footprint 201006.0002678.
// Read from the record: a two-storey 1930s stucco mixed-use block (Spanish Colonial Revival, same era as the rest of
// the Pacific Heights edge): white stucco walls, quartz belt course and cornice, a dark-wood shopfront on the street
// face with a red awning over the entrance, residential sash bays above and behind, and a flat terracotta roof with
// two HVAC boxes. Stone base on a fill down to each cell's ground, so the low side shows its extra block.
// Height: floor slab y0, ground storey y1-2, belt y3, upper storey y4, cornice y5, cap y6 (~5 blocks above ground).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/sf/presidio-tunnel-tops/fill";
const NAME = "201006.0002678";
const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));   // [x, z, ground]

const SIZE = [28, 17, 26];
const BELT = 3, CORNICE = 5, CAP = 6;

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const inside = (x, z) => ground.has(key(x, z));
const NORMALS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const faces = (x, z) => NORMALS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const shell = (x, z) => inside(x, z) && faces(x, z).length > 0;
const corner = (x, z) => { const f = faces(x, z); return f.some(([a]) => a !== 0) && f.some(([, b]) => b !== 0); };
const street = (x, z) => { const f = faces(x, z)[0]; return !!f && (f[0] === -1 || f[1] === 1); };   // west and south edges
const windowState = (n) => (n[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

const g = new Voxels(SIZE);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Street door: the street-face cell nearest the median along-coordinate, so the shopfront has one entrance.
const streetCells = cells.filter(([x, z]) => shell(x, z) && !corner(x, z) && street(x, z));
const along = (x, z) => (faces(x, z)[0][0] !== 0 ? z : x);
const sorted = streetCells.map(([x, z]) => along(x, z)).sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)];
const doorCell = streetCells.reduce((best, c) => (!best || Math.abs(along(c[0], c[1]) - median) < Math.abs(along(best[0], best[1]) - median) ? c : best), null);
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;
const doorBay = doorCell ? along(doorCell[0], doorCell[1]) : null;

for (const [x, z, gr] of cells) {
  // Foundation fill from y 0 up to the cell's ground, and the ground-floor slab on top of it.
  for (let y = 0; y <= Math.max(0, gr - 1); y++) put(x, y, z, "stone_bricks");
  put(x, BELT, z, "smooth_quartz");                                     // floor slab per storey (interior)

  if (!shell(x, z)) { put(x, CORNICE, z, "red_terracotta"); continue; }   // interior: air, roof deck above

  const [nx, nz] = faces(x, z)[0];
  const a = along(x, z);
  const bay = a % 3 === 1;
  const isCorner = corner(x, z);
  const isStreet = street(x, z) && !isCorner;
  const isDoor = key(x, z) === doorKey;

  // Walls: stucco envelope, quoins at the corners, belt course and cornice in quartz, red roof over the interior.
  for (const y of [1, 2, 4]) put(x, y, z, isCorner ? "smooth_quartz" : "white_concrete");
  put(x, BELT, z, isStreet ? "dark_oak_planks" : "smooth_quartz");       // shop fascia on the street face
  put(x, CORNICE, z, "smooth_quartz");
  put(x, CAP, z, "smooth_quartz_slab", { type: "bottom" });

  if (isCorner) continue;

  if (isStreet) {
    // Shopfront: glass under the fascia, dark-wood piers every fourth cell.
    const pier = a % 4 === 0;
    for (const y of [1, 2]) put(x, y, z, pier ? "dark_oak_planks" : "glass_pane", pier ? undefined : windowState([nx, nz]));
  } else if (bay) {
    for (const y of [1, 2]) put(x, y, z, "glass_pane", windowState([nx, nz]));
  }
  if (bay) put(x, 4, z, "glass_pane", windowState([nx, nz]));   // upper sash, every storey

  if (isDoor) {
    const facing = nx === -1 ? "west" : "south";
    put(x, 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    // Red awning over the door bay, three cells wide on the street face.
    for (const [ax, az] of cells.filter(([cx, cz]) => street(cx, cz) && shell(cx, cz) && !corner(cx, cz) && Math.abs(along(cx, cz) - doorBay) <= 1).map(([cx, cz]) => [cx, cz])) {
      put(ax, BELT, az, "red_concrete");
    }
  }
}

// Warm light: lanterns hang in the interior behind the shopfront piers and the door, glowstone and shroomlight sit
// behind some sash bays. Each light is the interior cell directly inside a window or door.
const lit = [];
for (const [x, z] of cells) {
  if (!shell(x, z) || corner(x, z)) continue;
  const [nx, nz] = faces(x, z)[0];
  const ix = x - nx, iz = z - nz;
  if (!inside(ix, iz) || shell(ix, iz)) continue;
  const a = along(x, z);
  if (street(x, z) && a % 4 === 2 && key(x, z) !== doorKey) { put(ix, 2, iz, "lantern", { hanging: "true", waterlogged: "false" }); lit.push([ix, 2, iz]); }
  if (key(x, z) === doorKey) { put(ix, 2, iz, "lantern", { hanging: "true", waterlogged: "false" }); lit.push([ix, 2, iz]); }
  if (!street(x, z) && a % 6 === 4) { put(ix, 1, iz, "glowstone"); lit.push([ix, 1, iz]); }
  if (!street(x, z) && a % 6 === 1) { put(ix, 4, iz, "shroomlight"); lit.push([ix, 4, iz]); }
}

// Roof plant: two light-grey HVAC boxes on the terracotta, set well inside the parapet.
const deep = (x, z) => inside(x, z) && [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].every(([dx, dz]) => inside(x + dx, z + dz) && !shell(x + dx, z + dz));
const boxes = [];
const plantSpots = cells.filter(([x, z]) => deep(x, z) && deep(x + 1, z) && !boxes.some(([bx, bz]) => Math.abs(bx - x) < 4 && Math.abs(bz - z) < 4));
for (const [x, z] of plantSpots) {
  if (boxes.length >= 2) break;
  boxes.push([x, z]);
  put(x, CORNICE + 1, z, "light_gray_concrete");
  put(x + 1, CORNICE + 1, z, "light_gray_concrete");
}

const out = `${DIR}/${NAME}.nbt`;
const res = g.save(out);
console.log(JSON.stringify({ file: out, ...res, doorCell, lights: lit.length, hvac: boxes }));
