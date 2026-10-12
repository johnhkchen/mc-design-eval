// Shell and floors (P1, plan.md PARTS 1): sidewalk, driveway, the garage-level and ground floors, the party walls
// (x1, x14), the street and back faces (z7, z32) with frontWallZone courses, the floor slabs y4/y8/y12 with their three
// stair holes, the angled bay's ring and floors, the porch recess walls and ceiling, the two neighbours (x0, x15) and
// the y16 wall plate. Every OPENING and RESERVED cell is carved to air at the end (plan.md OPENINGS and RESERVED).
// Front stair, partitions, roof, facade trim, glass, doors and site are other parts; the porch floor (y4 z7..9) is
// the shell's so the stair landing does not drop into the garage.
import {
  frontWallZone, bayCourse, neighbour,
  DARK_PRISMARINE, CRIMSON_PLANKS, SMOOTH_QUARTZ, WARPED_PLANKS, DARK_OAK_PLANKS, SPRUCE_PLANKS, BIRCH_PLANKS,
  SMOOTH_STONE, POLISHED_ANDESITE, YELLOW_TERRACOTTA, LIGHT_BLUE_TERRACOTTA,
} from "../vocab.mjs";

const AIR = "minecraft:air";

// Solid box, inclusive ranges: [x0..x1] x [y0..y1] x [z0..z1].
const box = (g, x0, x1, y0, y1, z0, z1, block) => g.fill([x0, y0, z0], [x1, y1, z1], block);

export function build(g) {
  // ---- site at y0: sidewalk (curb z0, stone z1), driveway under the bay ------------------------------------------
  box(g, 0, 15, 0, 0, 0, 0, POLISHED_ANDESITE);
  box(g, 0, 15, 0, 0, 1, 1, SMOOTH_STONE);
  box(g, 1, 6, 0, 0, 2, 6, POLISHED_ANDESITE);

  // ---- walls: party walls x1 and x14, street face z7, back face z32; y0..16 (the wall plate is the top course) ----
  for (let y = 0; y <= 16; y++) {
    const course = frontWallZone(y);
    box(g, 1, 1, y, y, 7, 32, course);
    box(g, 14, 14, y, y, 7, 32, course);
    box(g, 2, 13, y, y, 7, 7, course);
    box(g, 2, 13, y, y, 32, 32, course);
  }
  box(g, 1, 14, 4, 4, 7, 7, DARK_PRISMARINE);     // the y4 floor edge on the street is dark base masonry...
  box(g, 7, 9, 4, 4, 7, 7, CRIMSON_PLANKS);       // ...except the burgundy belt over the entry (x7..9)

  // ---- floors: garage y0 (smooth_stone), main y4, 2nd y8, top y12; the stair holes carved after ------------------
  box(g, 2, 13, 0, 0, 8, 31, SMOOTH_STONE);
  box(g, 2, 13, 4, 4, 8, 31, DARK_OAK_PLANKS);
  box(g, 2, 13, 8, 8, 8, 31, SPRUCE_PLANKS);
  box(g, 2, 13, 12, 12, 8, 31, BIRCH_PLANKS);
  box(g, 12, 13, 4, 4, 21, 23, AIR);              // garage <-> main stair well
  box(g, 12, 13, 8, 8, 12, 14, AIR);              // main <-> 2nd stair well
  box(g, 12, 13, 12, 12, 17, 19, AIR);            // 2nd <-> top stair well

  // ---- angled bay: floors inside the alcove (z6 x2..5) at y4/y8/y12, the ring per course y4..15, the cap y16 ------
  box(g, 2, 5, 4, 4, 6, 6, DARK_OAK_PLANKS);
  box(g, 2, 5, 8, 8, 6, 6, SPRUCE_PLANKS);
  box(g, 2, 5, 12, 12, 6, 6, BIRCH_PLANKS);
  for (let y = 4; y <= 15; y++) bayCourse(g, y);
  box(g, 1, 6, 16, 16, 5, 6, CRIMSON_PLANKS);

  // ---- porch recess (x10..13, y4..8, z7..9): smooth_quartz floor, warped side walls x9, back wall z10 ----------
  box(g, 10, 13, 4, 4, 7, 9, SMOOTH_QUARTZ);
  box(g, 9, 9, 5, 7, 8, 9, WARPED_PLANKS);
  box(g, 10, 13, 5, 7, 10, 10, WARPED_PLANKS);

  // ---- neighbours: west x0 (downhill, lower cap y14), east x15 (uphill, cap y17) ---------------------------------
  neighbour(g, 0, 13, 14, YELLOW_TERRACOTTA);
  neighbour(g, 15, 16, 17, LIGHT_BLUE_TERRACOTTA);

  // ---- openings and reserved cells, left as air for the later parts ---------------------------------------------
  // street face (z7)
  box(g, 2, 5, 1, 3, 7, 7, AIR);                  // garage door opening
  box(g, 8, 8, 2, 2, 7, 7, AIR);                  // cellar light
  box(g, 2, 5, 5, 15, 7, 7, AIR);                 // bay mouth into the parlour
  box(g, 8, 8, 5, 7, 7, 7, AIR);                  // parlour side light
  box(g, 10, 13, 5, 7, 7, 7, AIR);                // porch mouth (columns are the facade's)
  box(g, 9, 9, 9, 11, 7, 7, AIR);                 // 2nd-floor front light
  box(g, 12, 12, 9, 11, 7, 7, AIR);
  box(g, 9, 9, 13, 14, 7, 7, AIR);                // top-room front light
  box(g, 12, 12, 13, 14, 7, 7, AIR);
  // bay lights (z5 front, x1 and x6 diagonals at z6)
  for (const [y0, y1] of [[5, 7], [9, 11], [13, 14]]) {
    box(g, 3, 4, y0, y1, 5, 5, AIR);
    box(g, 1, 1, y0, y1, 6, 6, AIR);
    box(g, 6, 6, y0, y1, 6, 6, AIR);
  }
  // porch door pair and transom (z10)
  box(g, 11, 12, 5, 7, 10, 10, AIR);
  // reserved: parlour and dining firebox recesses in the west party wall, and the two chimney stacks' foot
  box(g, 1, 1, 5, 6, 11, 13, AIR);
  box(g, 1, 1, 5, 6, 20, 22, AIR);
  box(g, 1, 1, 16, 16, 12, 12, AIR);
  box(g, 1, 1, 16, 16, 21, 21, AIR);
  // back face (z32)
  box(g, 3, 3, 1, 2, 32, 32, AIR);                // garden store door
  box(g, 7, 8, 2, 3, 32, 32, AIR);                // garden store window
  box(g, 3, 4, 5, 7, 32, 32, AIR);                // kitchen windows
  box(g, 11, 12, 5, 7, 32, 32, AIR);
  box(g, 7, 8, 5, 7, 32, 32, AIR);                // French doors and transom
  box(g, 3, 4, 9, 11, 32, 32, AIR);               // back bedroom windows
  box(g, 7, 8, 9, 11, 32, 32, AIR);
  box(g, 11, 11, 10, 11, 32, 32, AIR);            // bathroom window
  box(g, 7, 8, 13, 15, 32, 32, AIR);             // top-room window
}
