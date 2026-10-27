// Way 291095572: a two-storey interwar brick commercial block (1920s-30s Auckland, Karangahape Rd / Queen St
// type). Flat parapet roof at lidar height 9 (10 blocks), shopfronts on the ground storey, a recessed-looking
// pier-and-window grid above, a quartz string course and cornice, one street door, and warm glowstone behind
// some upper windows. Massing follows the footprint cells: a plinth, two 4-block storeys, a cornice, a parapet.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291095572.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell

const g = new Voxels([23, 22, 32]);

// footprint lookup: key "x,z" -> { ground, roof }
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof });
const inFp = (x, z) => fp.has(`${x},${z}`);

// a perimeter cell has a 4-neighbour outside the footprint: it is the facade (or the parapet line)
const exposed = (x, z) => ({
  N: !inFp(x, z - 1), S: !inFp(x, z + 1), W: !inFp(x - 1, z), E: !inFp(x + 1, z),
});
const isPerim = (x, z) => { const e = exposed(x, z); return e.N || e.S || e.W || e.E; };

// the facade's bay index runs along the wall: x on the north/south faces, z on the east/west faces
const facadeOf = (x, z) => { const e = exposed(x, z); return e.S ? "S" : e.N ? "N" : e.E ? "E" : "W"; };
const bayT = (x, z) => (facadeOf(x, z) === "S" || facadeOf(x, z) === "N" ? x : z);
// pattern period 4: piers at t%4 in {0, 3}, a 2-wide window at t%4 in {1, 2}
const isWindowBay = (x, z) => [1, 2].includes(((bayT(x, z) % 4) + 4) % 4);

// the one street door: a south-facing window-bay cell nearest the middle of the south face
let doorCell = null;
{
  const south = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => exposed(x, z).S && isWindowBay(x, z));
  const xs = south.map(([x]) => x).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  doorCell = south.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid))[0];
}
const isDoor = (x, z) => doorCell && doorCell[0] === x && doorCell[1] === z;

// interior cells (not on the facade) get a floor slab per storey and a roof deck; the air between is the gap
// behind the glass. Roof equipment: two 2x2 units of iron on the roof deck, well inside the parapet.
const equip = new Set();
{
  const interior = [...fp.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => !isPerim(x, z));
  const block2 = (x, z) => [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]].every(([a, b]) => inFp(a, b) && !isPerim(a, b));
  const cand = interior.filter(([x, z]) => block2(x, z)).sort((a, b) => (a[0] - 11) ** 2 + (a[1] - 16) ** 2 - ((b[0] - 11) ** 2 + (b[1] - 16) ** 2));
  const picked = [];
  for (const [x, z] of cand) {
    if (picked.every(([px, pz]) => Math.abs(px - x) >= 5 || Math.abs(pz - z) >= 5)) picked.push([x, z]);
    if (picked.length === 2) break;
  }
  for (const [x, z] of picked) for (const [a, b] of [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]]) equip.add(`${a},${b}`);
}

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [key, { ground, roof }] of fp) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);
  const win = perim && isWindowBay(x, z);
  const facade = facadeOf(x, z);
  const runsAlongX = facade === "S" || facade === "N";
  const paneState = runsAlongX ? PANE_NS : PANE_EW;

  // foundation below the ground line, if any (the lidar's ground is 0 here, so none)
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y <= roof; y++) {
    if (!perim) {
      // interior: floor slabs and the roof deck; air between, so the glass has air behind it
      if (y === 0 || y === 4) g.set(x, y, z, "smooth_stone");
      else if (y === 8) g.set(x, y, z, "smooth_stone");
      else if (y === 9 && equip.has(key)) g.set(x, y, z, "iron_block");
      continue;
    }
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }                  // plinth course
    if (y <= 2) {                                                                       // ground storey: shopfronts
      if (isDoor(x, z)) g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      else if (win) g.set(x, y, z, "glass_pane", paneState);
      else g.set(x, y, z, "bricks");
      continue;
    }
    if (y === 3) {                                                                      // transom band over the shopfronts
      if (isDoor(x, z)) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      else g.set(x, y, z, win ? "smooth_quartz" : "bricks");
      continue;
    }
    if (y === 4) { g.set(x, y, z, "smooth_quartz"); continue; }                        // storey string course
    if (y <= 6) {                                                                       // upper storey: window grid
      if (win) {
        g.set(x, y, z, "glass_pane", paneState);
      } else g.set(x, y, z, "bricks");
      continue;
    }
    if (y === 7) { g.set(x, y, z, win ? "smooth_quartz" : "bricks"); continue; }      // lintels and piers' head
    if (y === 8) { g.set(x, y, z, "smooth_quartz"); continue; }                        // cornice
    if (y === 9) {                                                                      // parapet with chiseled piers
      const pier = ((bayT(x, z) % 4) + 4) % 4 === 0;
      g.set(x, y, z, pier ? "chiseled_quartz_block" : "smooth_quartz");
      continue;
    }
  }
}

// warm light: glowstone on the inside of some upper windows (inward neighbour is an interior cell)
for (const [key] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z) || !isWindowBay(x, z)) continue;
  const f = facadeOf(x, z);
  const [ix, iz] = f === "S" ? [x, z - 1] : f === "N" ? [x, z + 1] : f === "E" ? [x - 1, z] : [x + 1, z];
  if (!inFp(ix, iz) || isPerim(ix, iz)) continue;
  if ((x + z) % 3 !== 0) continue;
  g.set(ix, 5, iz, "glowstone");
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291095572.nbt");
console.log("saved", info);
