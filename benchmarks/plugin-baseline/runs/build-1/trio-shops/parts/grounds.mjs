// Part: grounds. The three rear yards (grass in patches, coarse dirt, a dirt path from each rear door, brick yard walls)
// and the four lamp posts on the kerb. The street edging (road, kerb, sidewalk) is laid by the shell (parts/shell.mjs),
// so this part adds nothing to the street itself.
import { yard, lamp_post } from "../vocab.mjs";

export function build(g) {
  // Rear yards: a = the house's low-x wall, doorX = its lobby's rear door (plan.md FLOORS / OPENINGS)
  yard(g, 25, 35); // H1 bookseller
  yard(g, 13, 23); // H2 florist
  yard(g, 1, 3);   // H3 ironmonger

  // Lamp posts on the kerb at the party and end piers, outside every counter's clear strip
  for (const x of [1, 13, 25, 37]) lamp_post(g, x, 5);
}
