// The persistent "temple" benchmark task — the INVARIANT goal, held constant across
// runs so renders stay comparable as we refine the approach. What varies between runs
// is the APPROACH (see run.mjs), never this goal. If the goal itself ever changes,
// bump `version` so older runs are not compared against a different target.

export const TEMPLE_TASK = Object.freeze({
  id: "temple",
  version: 1,
  seed: 7,
  serverStateId: "flat-creative-superflat.v1",
  // The human-judging reference + the basis every approach prompts from.
  goal:
    "A monumental classical temple (Greek/Roman in spirit): a raised stepped base " +
    "(crepidoma/stylobate), a surrounding colonnade of columns with capitals and bases, " +
    "a grand front staircase, a deep portico, an entablature (architrave + frieze) and a " +
    "triangular pediment over the entrance, and an enclosed inner cella housing a central " +
    "altar or idol. Strong bilateral symmetry; real presence and verticality.",
});
