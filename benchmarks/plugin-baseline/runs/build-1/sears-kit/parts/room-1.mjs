// Room "P0 hall" (Magnolia central stair hall, inner box x6..9 z14..20, floor layer y2): interior designer's part.
// The stair climbs along x6 (built by the stair joiner, kept clear). The hall is symmetrical about its centre line
// x 7.5: a pair of coat racks flank the back approach at z19, a red runner carpet runs down x7..8 to the back door,
// and two hanging lanterns sit point-symmetric over the runner so the centre of the hall is the brightest place.
//
// Nothing is laid here yet. The shell (shell-west) fills every interior cell of the house with air, and runParts locks
// air too, so every write in this hall was refused: 10 carpet cells, 4 coat-rack cells, 2 lantern cells (16 REFUSED).
// The intended calls are kept below, commented out, to restore once the shell leaves the hall unlocked.
//
// import { coatRack, porchLantern } from "../vocab.mjs";
// import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
//
// layers(g, [7, 2, 15], { r: "red_carpet" }, ["rr", "rr", "rr", "rr", "rr"]);   // rug runner, x7..8 z15..19
// coatRack(g, { x: 6, y: 2, z: 19, facing: "east", color: "brown", wood: "spruce" });
// coatRack(g, { x: 9, y: 2, z: 19, facing: "west", color: "brown", wood: "spruce" });
// porchLantern(g, { x: 7, y: 4, z: 16 });   // lanterns hang from the upper floor's block layer (y5)
// porchLantern(g, { x: 8, y: 4, z: 18 });

// Lamplighter (kept commented, as the designer's furniture calls are): the two hanging lanterns hang from the upper
// floor's block at y5 (verified solid at 7,5,16 and 8,5,18, air at 7,4,16 and 8,4,18). Refused today by the shell lock
// (runParts treats air as locked), so they stay here until the hall is unlocked for a lamp pass. The hall is already
// lit (min 5, 0 dark), so nothing is lost while they wait.
// import { porchLantern } from "../vocab.mjs";
// porchLantern(g, { x: 7, y: 4, z: 16 });
// porchLantern(g, { x: 8, y: 4, z: 18 });

export function build(g) {
  // no writes: the hall's cells are all locked by earlier parts (see above)
}
