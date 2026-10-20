// Viewing platform (plan PARTS 3): the stepped timber deck on its posts, joists at y36, fascia, deck y37 with a dark
// oak edge board, spruce rail with the plan's openings, two benches, and two hanging lanterns under the north fascia.
// Built only into air, so the rocks (earlier) keep their cells. Deck footprint = PRONGS (plan Platform footprint).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DECK, PRONGS, BENCHES, HANG_LANTERNS, deckPost, deckRail, bench } from "../vocab.mjs";

const { joistY, topY, walkY } = DECK;
const POST_TOP = joistY - 1; // posts stop under the joists, at y35

// the deck footprint is the union of the prongs
const inDeck = (x, z) => PRONGS.some((p) => x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1);
// an outer edge cell: in the deck, with a neighbour outside it
const edge = (x, z) => inDeck(x, z) && (!inDeck(x - 1, z) || !inDeck(x + 1, z) || !inDeck(x, z - 1) || !inDeck(x, z + 1));

// writes only into air, like the vocabulary helpers
function put(g, x, y, z, [block, state]) {
  if (!g.inBounds(x, y, z) || !g.isAir(x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}

// the rail runs round the outer edge, from the deck's north-west corner clockwise (the back edge is left open)
const BACK_EDGE = { x0: 42, x1: 47, z: 45 };
const OPENINGS = [[66, 42], [66, 43], [66, 44], [66, 45], [60, 45], [61, 45]];
const RAIL_CORNERS = [[42, 30], [56, 30], [66, 38]];

// deck posts: a grid every 4 cells with the corners; the post at x 46 on the north edge moves 1 south so the hanging
// lantern at (46,35,30) keeps its cell. No posts on x 66, so the pads stay off the trail reserved at x 67..68.
const POSTS = [
  [42, 30], [46, 31], [50, 30], [54, 30], [56, 30],
  [42, 34], [46, 34], [50, 34], [54, 34], [58, 34], [62, 34],
  [42, 38], [46, 38], [50, 38], [54, 38], [58, 38], [62, 38],
  [42, 42], [46, 42], [50, 42], [54, 42], [58, 42], [62, 42],
  [42, 45],
];
// knee braces stand inside the deck on the east side of the north-edge posts, under the fascia (their back on the post);
// (46,30) has no brace, its cell east of the post is the hanging lantern's neighbour and the post is at z 31
const BRACED = new Map([["42,30", "east"], ["50,30", "east"], ["54,30", "east"]]);

// the rail path: outer-edge cells, ordered round the outline by angle about the deck centre
function railPath() {
  const ring = [];
  for (let x = 42; x <= 66; x++)
    for (let z = 30; z <= 45; z++) if (edge(x, z)) ring.push([x, z]);
  const ang = ([x, z]) => Math.atan2(z - 38, x - 48);
  ring.sort((a, b) => ang(a) - ang(b));
  return ring.filter(([x, z]) => !(z === BACK_EDGE.z && x >= BACK_EDGE.x0 && x <= BACK_EDGE.x1));
}

export function build(g) {
  let n = 0;

  // footings, posts and braces
  for (const [x, z] of POSTS) {
    if (!inDeck(x, z)) continue;
    deckPost(g, x, z, { top: POST_TOP, brace: BRACED.get(`${x},${z}`) });
    n++;
  }

  // fascia and deck, with the edge board as dark oak slabs (top half, flush with the walking level)
  for (let x = 42; x <= 66; x++)
    for (let z = 30; z <= 45; z++) {
      if (!inDeck(x, z)) continue;
      if (edge(x, z)) {
        put(g, x, joistY, z, ["dark_oak_planks", {}]); // fascia
        put(g, x, topY, z, B.slab("dark_oak", "top")); // edge board
      } else {
        put(g, x, topY, z, ["spruce_planks", {}]);
      }
      n++;
    }

  // joists at y36, running along z, every 2 cells in x, between the fascia on the north and south edges
  for (let x = 44; x <= 64; x += 2)
    for (let z = 30; z <= 45; z++) if (inDeck(x, z) && !edge(x, z)) put(g, x, joistY, z, B.log("stripped_dark_oak", "z"));

  // lanterns hung under the north fascia
  for (const [x, y, z] of HANG_LANTERNS) put(g, x, y, z, B.lantern(true));

  // benches (their arms go in before the rail, so the rail keeps the gaps)
  for (const b of BENCHES) bench(g, b.x0, walkY, b.z, "north");

  // rail at the walking level, with the openings and the corner lanterns
  deckRail(g, railPath(), { y: walkY, openings: OPENINGS, corners: RAIL_CORNERS });

  return n;
}
