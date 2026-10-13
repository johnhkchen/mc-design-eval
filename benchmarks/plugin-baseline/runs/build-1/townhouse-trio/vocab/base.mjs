// Palette ids (palette.json only), plan.md site coordinates, and the seeded rng. Coordinates are [x0,y0,z0,x1,y1,z1],
// inclusive: x runs west to east, y up, z from the street (z=0) to the garden. Ground is y=0, people walk at y=1.

// rng(seed): seeded random source returning floats in [0,1); the same seed gives the same sequence.
export { rng } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/terrain.mjs";

// ---- palette: roles -----------------------------------------------------------------------------------------------
// brick: A and C walls and garden coping alternates.
export const BRICKS = "bricks";
// brick_stairs: sloped brick cells, hearth lintels.
export const BRICK_STAIRS = "brick_stairs";
// brick_slab: brick half-blocks, hearth lintels.
export const BRICK_SLAB = "brick_slab";
// brick_wall: garden wall alternate.
export const BRICK_WALL = "brick_wall";
// sandstone: B walls, bay bodies, quoins and sills on A and C.
export const SMOOTH_SANDSTONE = "smooth_sandstone";
// sandstone slab: window sills on A and C.
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";
// sandstone stairs: sandstone steps on B.
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";
// cut sandstone: string course, party-wall pilasters, lintels.
export const CUT_SANDSTONE = "cut_sandstone";
// cut sandstone slab: bay cut band and string-course half-steps.
export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";
// quartz: B trim, portico entablature, B eave course, window heads on B.
export const SMOOTH_QUARTZ = "smooth_quartz";
// quartz pillar: portico columns and pedestals (axis y).
export const QUARTZ_PILLAR = "quartz_pillar";
// quartz stairs: upside-down brackets for the door hoods and the B cornice.
export const QUARTZ_STAIRS = "quartz_stairs";
// quartz slab: door-hood tops, B sills, bay deck edges.
export const QUARTZ_SLAB = "quartz_slab";
// stone bricks: plinth and steps.
export const STONE_BRICKS = "stone_bricks";
// stone brick stairs: stoop steps.
export const STONE_BRICK_STAIRS = "stone_brick_stairs";
// stone brick slab: plinth half-steps, B eave course, chimney cap, garden-wall coping.
export const STONE_BRICK_SLAB = "stone_brick_slab";
// roof: deepslate tiles of the townhouse mansard (laid by mcd roof).
export const DEEPSLATE_TILES = "deepslate_tiles";
// roof: cobbled deepslate of the mansard mix.
export const COBBLED_DEEPSLATE = "cobbled_deepslate";
// roof: polished deepslate of the mansard mix.
export const POLISHED_DEEPSLATE = "polished_deepslate";
// roof: cracked deepslate tiles of the mansard mix.
export const CRACKED_DEEPSLATE_TILES = "cracked_deepslate_tiles";
// roof: polished blackstone brick, the mansard eave and dentils.
export const POLISHED_BLACKSTONE_BRICKS = "polished_blackstone_bricks";
// smooth stone: B roof coping, kerb, road bed and pavement.
export const SMOOTH_STONE = "smooth_stone";
// deepslate bricks: chimney band at y=26.
export const DEEPSLATE_BRICKS = "deepslate_bricks";
// glass pane: all glazing.
export const GLASS_PANE = "glass_pane";
// black stained glass pane: dark glazing, decor.
export const BLACK_STAINED_GLASS_PANE = "black_stained_glass_pane";
// warped door: A front door (teal).
export const WARPED_DOOR = "warped_door";
// dark oak door: B front and the B French door.
export const DARK_OAK_DOOR = "dark_oak_door";
// crimson door: C front door (red).
export const CRIMSON_DOOR = "crimson_door";
// spruce door: all back doors.
export const SPRUCE_DOOR = "spruce_door";
// iron bars: area railings, balcony rail, side railings.
export const IRON_BARS = "iron_bars";
// polished blackstone wall: stoop railings.
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";
// andesite: road.
export const ANDESITE = "andesite";
// gravel: road patches and side paths.
export const GRAVEL = "gravel";
// polished andesite: pavement flags.
export const POLISHED_ANDESITE = "polished_andesite";
// grass block: lot ground.
export const GRASS_BLOCK = "grass_block";
// coarse dirt: ground patches.
export const COARSE_DIRT = "coarse_dirt";
// podzol: ground patches and tree pits.
export const PODZOL = "podzol";
// rooted dirt: ground patches.
export const ROOTED_DIRT = "rooted_dirt";
// dirt path: garden paths.
export const DIRT_PATH = "dirt_path";
// spruce planks: floors of A and C.
export const SPRUCE_PLANKS = "spruce_planks";
// dark oak planks: floors of B.
export const DARK_OAK_PLANKS = "dark_oak_planks";

// ---- palette: objects ---------------------------------------------------------------------------------------------
// campfire: lit hearths and chimney fires.
export const CAMPFIRE = "campfire";
// spruce stairs: stair flights in the wells.
export const SPRUCE_STAIRS = "spruce_stairs";
// spruce fence: stair rails.
export const SPRUCE_FENCE = "spruce_fence";
// ladder: attic ladders at x=4 and x=26.
export const LADDER = "ladder";
// spruce trapdoor: attic hatches, window-box fronts.
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
// spruce fence gate: back-garden gates.
export const SPRUCE_FENCE_GATE = "spruce_fence_gate";
// lantern: door lanterns, lamp-post lanterns, room light.
export const LANTERN = "lantern";
// iron chain: lantern hangers.
export const IRON_CHAIN = "iron_chain";
// flower pot: window boxes and room decor.
export const FLOWER_POT = "flower_pot";
// potted poppy: window boxes.
export const POTTED_POPPY = "potted_poppy";
// potted cornflower: window boxes.
export const POTTED_CORNFLOWER = "potted_cornflower";
// poppy: planting.
export const POPPY = "poppy";
// allium: planting.
export const ALLIUM = "allium";
// azalea: garden planting.
export const AZALEA = "azalea";
// oak log: street-tree trunks.
export const OAK_LOG = "oak_log";
// oak leaves (persistent): street-tree crowns.
export const OAK_LEAVES = "oak_leaves";

// ---- site -------------------------------------------------------------------------------------------------------
// SIZE: full grid size, lot 0..30 x 0..31 x 0..34 (31 x 32 x 35 cells).
export const SIZE = [31, 32, 35];
// LOT: the whole lot.
export const LOT = [0, 0, 0, 30, 31, 34];
// ROAD: andesite road along x, z 0..4.
export const ROAD = [0, 0, 0, 30, 0, 4];
// KERB_Z: smooth-stone kerb row at z=5.
export const KERB_Z = 5;
// PAVEMENT: polished-andesite flags, z 6..8.
export const PAVEMENT = [0, 0, 6, 30, 0, 8];
// FRONT_AREA: stoops, bays, planting in front of the houses.
export const FRONT_AREA = [3, 0, 9, 27, 12, 11];
// HOUSE_A: west brick end house body (x=11 is the A/B party wall).
export const HOUSE_A = [3, 1, 12, 11, 17, 24];
// HOUSE_B: centre stucco house body, 5 higher than A and C (x=11 and x=19 are party walls).
export const HOUSE_B = [11, 1, 12, 19, 22, 24];
// HOUSE_C: east brick end house body (x=19 is the B/C party wall).
export const HOUSE_C = [19, 1, 12, 27, 17, 24];
// PARTY_X: the two party walls, x=11 and x=19.
export const PARTY_X = [11, 19];
// BAY_A: canted bay of A, z=11 row x7..10 and z=10 centre cells only.
export const BAY_A = [7, 1, 10, 10, 12, 11];
// BAY_C: canted bay of C, mirror of A.
export const BAY_C = [20, 1, 10, 23, 12, 11];
// STOOP_A: A front stoop (steps at z=9..10, landing at z=11).
export const STOOP_A = [4, 1, 9, 6, 2, 11];
// STOOP_B: B stoop inside the portico.
export const STOOP_B = [14, 1, 9, 16, 2, 11];
// STOOP_C: C front stoop, mirror of A.
export const STOOP_C = [24, 1, 9, 26, 2, 11];
// PORTICO: B portico, pedestals to balcony rail.
export const PORTICO = [13, 1, 9, 17, 8, 11];
// CHIMNEY_AB: chimney stack on the A/B party wall, to y=28.
export const CHIMNEY_AB = [10, 1, 18, 12, 28, 19];
// CHIMNEY_BC: chimney stack on the B/C party wall, to y=28.
export const CHIMNEY_BC = [18, 1, 18, 20, 28, 19];
// GARDEN_A: rear garden of A.
export const GARDEN_A = [4, 0, 25, 10, 2, 34];
// GARDEN_B: rear garden of B.
export const GARDEN_B = [12, 0, 25, 18, 2, 34];
// GARDEN_C: rear garden of C.
export const GARDEN_C = [20, 0, 25, 26, 2, 34];
// FLOOR_Y: floor-block levels; room air sits one above each.
export const FLOOR_Y = [2, 7, 12, 17];
// STREET_TREE_X: street-tree columns at z=7.
export const STREET_TREE_X = [2, 15, 28];
// LAMP_POST_X: lamp-post columns at z=8.
export const LAMP_POST_X = [9, 21];
// WELL_A: stair well of A, against the party wall (x and z from plan.md; y from the ground floor to the top floor deck).
export const WELL_A = [9, 2, 20, 10, 17, 23];
// WELL_B: stair well of B.
export const WELL_B = [12, 2, 20, 13, 17, 23];
// WELL_C: stair well of C.
export const WELL_C = [20, 2, 20, 21, 17, 23];
// FRONT_DOOR_X: front door column of A, B and C (B's is the centre door).
export const FRONT_DOOR_X = { A: 5, B: 15, C: 25 };
// BACK_DOOR_X: back door column of A, B and C, on z=24.
export const BACK_DOOR_X = { A: 5, B: 15, C: 25 };
// ROOF_FOOTPRINT: x0,z0,x1,z1 of the A, B and C roofs (plan.md ROOFS).
export const ROOF_FOOTPRINT = { A: [3, 12, 11, 24], B: [11, 12, 19, 24], C: [19, 12, 27, 24] };
