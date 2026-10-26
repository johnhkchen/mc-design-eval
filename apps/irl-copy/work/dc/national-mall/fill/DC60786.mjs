// Immaculate Conception Church, School, Rectory & Residence (711 N St NW), built from the lidar cells.
// Read as a late-19th-century Gothic Revival parish church in red brick with buff sandstone bands, a slate nave roof
// and a stone-capped tower at the street (z 15) end, with flanking wings and a turret on the nave's north side.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC60786.cells.json", "utf8"));
const FOOT = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => FOOT.has(`${x},${z}`);

// Massing by volume, read from the lidar roof heights: the tower (x 2-5, z 13-15, roof 15), the wings beside it (roof 8-9),
// a turret on the nave (1,11, roof 10), and the nave behind (roof 7-9, smoothed to a stepped gable: eaves 6, ridge 7).
const volOf = (x, z) => (x >= 2 && x <= 5 && z >= 13 ? "tower" : x === 1 && z === 11 ? "turret" : z >= 13 && (x <= 1 || x >= 6) ? "wing" : "nave");
const NAVE_TOP = [6, 6, 7, 7, 7, 7, 6, 6];   // top block index per column of the nave's roof (stairs on the slopes)
const VOL_TOP = { tower: 14, wing: 7, turret: 10 };
const topOf = (x, z) => (volOf(x, z) === "nave" ? NAVE_TOP[x] : VOL_TOP[volOf(x, z)]);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the outward faces of a cell: those that meet outside the footprint or another volume
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz) || volOf(x + dx, z + dz) !== volOf(x, z));
const isWall = (x, z) => exposed(x, z).length > 0;
// a window only where the cell behind it (inward) is open air, so the glass has a gap behind it
const winFace = (x, z) => exposed(x, z).find(([dx, dz]) => has(x - dx, z - dz) && !isWall(x - dx, z - dz));
const paneState = (dx) => (dx ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

const STONE = ["stone_bricks"], BRICK = ["bricks"], TRIM = ["smooth_sandstone"], SLATE = ["deepslate_tiles"];
const GLASS = (dx) => ["glass_pane", paneState(dx)];

// The block at x, z, y (or null: air). y 0 is the foundation under every cell; walls stand on it, interiors are air.
function blockAt(x, z, y) {
  const v = volOf(x, z), top = topOf(x, z);
  if (y === 0) return STONE;
  if (y > top) return null;
  if (!isWall(x, z)) {
    if (v === "nave") {
      if (y === 5) return STONE;                                              // nave ceiling / attic floor
      if (y < 5) return y === 4 && (x === 1 || x === 6) && z % 4 === 1 ? ["lantern", { hanging: "true", waterlogged: "false" }] : null;
      if (y < top) return SLATE;                                              // roof body under the slope
      return ["deepslate_tile_stairs", { facing: x <= 3 ? "west" : "east", half: "bottom", shape: "straight", waterlogged: "false" }];
    }
    if (v === "tower") {                                                      // tower interior: three floors and the deck
      if (x === 4 && y === 1 && z === 14) return ["lantern", { hanging: "false", waterlogged: "false" }];
      if (y === 6 && (x === 3 || x === 4) && z === 14) return ["glowstone"];  // warm light behind the rose window
      if (y === 5 || y === 8 || y === 12) return STONE;
    }
    return null;
  }

  const face = winFace(x, z), [dx, dz] = face ?? [0, 0];
  const u = dx ? z : x;                                                        // position along the face
  const win = face && (v === "tower" || u % 2 === 1);
  const corner = (x === 2 || x === 5) && (z === 13 || z === 15);
  const door = v === "tower" && z === 15 && (x === 3 || x === 4);              // the entrance, two leaves
  const rose = door && y >= 6 && y <= 7;

  if (door && (y === 1 || y === 2)) return ["oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: x === 3 ? "left" : "right", open: "false", powered: "false" }];
  if (rose) return GLASS(0);
  if (y === 1) return STONE;                                                  // base course
  if (door && (y === 3 || y === 4)) return TRIM;                              // lintel over the doors
  if (y === 2) return win ? ["smooth_sandstone_slab", { type: "bottom", waterlogged: "false" }] : BRICK;   // sill
  if (y === 3 || y === 4) return win ? GLASS(dx) : BRICK;
  if (y === 5) return TRIM;                                                   // string course
  if (v === "nave") return BRICK;                                            // eaves and gable ends
  if (v === "wing") return y === 6 || y === 7 ? BRICK : null;                // flat roof with a solid parapet
  if (v === "turret") return y < 9 ? BRICK : y === 9 ? TRIM : ["lantern", { hanging: "false", waterlogged: "false" }];
  // tower: lancets, a band, louvred belfry, a band, the deck, a crenellated parapet and corner pinnacles
  if (y <= 7) return win ? GLASS(dx) : BRICK;
  if (y === 8) return TRIM;
  if (y <= 10) return win ? ["iron_bars", paneState(dx)] : BRICK;
  if (y === 11) return TRIM;
  if (y === 12) return STONE;
  if (y === 13) return corner || (x + z) % 2 === 0 ? ["stone_brick_wall"] : null;
  if (y === 14) return corner ? ["stone_brick_wall"] : null;
  return null;
}

const g = new Voxels([8, 27, 16]);
for (const key of FOOT.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y <= 14; y++) {
    const b = blockAt(x, z, y);
    if (b) g.set(x, y, z, b[0], b[1]);
  }
}
const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC60786.nbt");
console.log(`DC60786: ${out.blocks} blocks, ${out.palette} palette entries`);
