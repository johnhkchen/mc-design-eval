// Way 291058268: a c.1960s cream-plaster concrete office-and-shop block on the lidar's flat roof (about 15 blocks, four
// storeys). Storey lines are absolute (floors at y 0, 4, 8, 12) so every floor slab meets its neighbours. Black-fascia
// shopfront on the ground storey, glass bays between quartz piers, a recessed door, lanterns behind some windows, and a
// plant room on the roof. Shell only: perimeter walls one block thick, interiors air with floor slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058268.cells.json", "utf8"));

const W = 60, H = 28, D = 43;
const g = new Voxels([W, H, D]);

// footprint: cell -> { ground, roof }
const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const WALL = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
// the faces of a cell that look out of the footprint
const outs = (x, z) => Object.keys(WALL).filter((f) => !inFoot(x + WALL[f][0], z + WALL[f][1]));

const LINES = [0, 4, 8, 12];                         // storey lines (floor slabs), absolute
// roof deck: the top line the lidar roof clears (a parapet fills the rest); a lower wing keeps one storey
const deckOf = ({ ground, roof }) => (Math.max(roof, ground + 4) - 1 >= 12 ? 12 : 8);

// the front door: the ground-storey perimeter cell nearest the middle of the footprint
const doorCell = [...cell.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => cell.get(`${x},${z}`).ground === 0 && outs(x, z).length)
  .sort((a, b) => Math.hypot(a[0] - 30, a[1] - 21) - Math.hypot(b[0] - 30, b[1] - 21))[0];
const doorKey = doorCell.join(",");
const doorFace = outs(doorCell[0], doorCell[1])[0];

const WALLS = "smooth_quartz", GLASS = "light_blue_stained_glass";
const FOUNDATION = "stone_bricks", STRING = "polished_andesite", FASCIA = "black_concrete";
const PLANT = "light_gray_concrete", FLOOR = "smooth_stone";

for (let z = 0; z < D; z++) {
  for (let x = 0; x < W; x++) {
    const c = cell.get(`${x},${z}`);
    if (!c) continue;
    const gr = c.ground, deck = deckOf(c), top = Math.max(c.roof, gr + 4);
    const faces = outs(x, z);
    const perim = faces.length > 0;
    const along = faces.includes("n") || faces.includes("s") ? x : z;   // position along the wall
    const pier = faces.length > 1 || along % 3 === 0;                   // corners and every third bay
    const isDoor = `${x},${z}` === doorKey;

    // foundation: solid from the bottom up to this cell's ground (and, inside, up to the first floor line)
    for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);
    if (!perim) for (let y = gr; y < 4 && gr > 0; y++) g.set(x, y, z, FOUNDATION);

    // floor slabs on every storey line up to the deck: the ground floor's is the room floor
    for (const y of LINES) if (y >= gr && y <= deck) g.set(x, y, z, perim ? STRING : FLOOR);

    if (perim) {
      for (let y = gr; y < deck; y++) {
        if (LINES.includes(y)) continue;                  // the slabs above
        if (y < 4 && gr > 0) g.set(x, y, z, FOUNDATION);  // a plinth where the ground is raised
        else if (y < 4) {                                 // the ground storey: shopfront, fascia on top
          if (y === 3) g.set(x, y, z, FASCIA);
          else if (isDoor) continue;
          else g.set(x, y, z, pier ? WALLS : GLASS);
        } else if (y % 4 === 3) g.set(x, y, z, WALLS);    // spandrel under each floor
        else g.set(x, y, z, pier ? WALLS : GLASS);
      }
      // the door: two blocks in the shopfront
      if (isDoor) {
        const st = { facing: { n: "north", s: "south", e: "east", w: "west" }[doorFace], hinge: "left", open: "false", powered: "false" };
        g.set(x, 1, z, "dark_oak_door", { ...st, half: "lower" });
        g.set(x, 2, z, "dark_oak_door", { ...st, half: "upper" });
      }
      // parapet: a cornice course at the deck, quartz above, to the top of the lidar roof
      for (let y = deck + 1; y < top; y++) g.set(x, y, z, y === deck + 1 ? STRING : WALLS);
    } else {
      // lanterns hang under a floor just inside a plain glass bay (the slab above is their hook)
      for (const y of [3, 7, 11]) {
        if (!LINES.includes(y + 1) || y + 1 > deck || y < gr || (y < 4 && gr > 0)) continue;
        const bay = Object.keys(WALL).find((f) => {
          const wx = x + WALL[f][0], wz = z + WALL[f][1];
          const wa = outs(wx, wz);
          return inFoot(wx, wz) && wa.length === 1 && wa[0] === f && (f === "n" || f === "s" ? wx : wz) % 3 !== 0
            && `${wx},${wz}` !== doorKey && (wx * 7 + wz * 3 + y) % 5 === 0;
        });
        if (bay) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      }
    }
  }
}

// roof plant: a low plant room on the deck, in the middle of the roof, with a grille course on top
for (let z = 16; z <= 24; z++) for (let x = 22; x <= 34; x++) {
  const c = cell.get(`${x},${z}`);
  if (!c || outs(x, z).length) continue;
  const deck = deckOf(c);
  g.set(x, deck + 1, z, PLANT);
  if ((x + z) % 2 === 0) g.set(x, deck + 2, z, PLANT);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_291058268.nbt");
console.log("way_291058268.nbt: cells", g.count(), "palette", g.palette.length - 1, "door", doorKey, doorFace);
