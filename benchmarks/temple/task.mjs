// The persistent "temple" benchmark task — the INVARIANT goal, held constant across
// runs so renders stay comparable as we refine the approach. What varies between runs
// is the APPROACH (see run.mjs), never this goal. If the goal itself ever changes,
// bump `version` so older runs are not compared against a different target.

export const TEMPLE_TASK = Object.freeze({
  id: "temple",
  // v2 enriches the goal with a surrounding precinct (landscaping + open-air statues)
  // and names proportion/detail as the quality bar. Runs are tagged with the task
  // version, so v1 runs (temple only) are not compared head-to-head with v2 runs.
  version: 2,
  seed: 7,
  serverStateId: "flat-creative-superflat.v1",
  // The human-judging reference + the basis every approach prompts from.
  goal:
    "A monumental classical temple (Greek/Roman in spirit) set in its own precinct. " +
    "THE TEMPLE: a raised stepped base (crepidoma/stylobate), a peristyle colonnade of " +
    "columns with capitals and bases, a grand front staircase, a deep portico, an " +
    "entablature (architrave + frieze + cornice) and a triangular pediment, and an " +
    "enclosed inner cella housing a central altar or cult statue. THE PRECINCT (temenos): " +
    "a paved plaza framing the temple, processional steps, freestanding open-air monuments " +
    "and statues on plinths (colossi, obelisks, votive columns, urns, or braziers), " +
    "planting, and a boundary. Strong bilateral symmetry; real presence, verticality, and " +
    "considered classical proportion; rewarded for fine detail and varied massing over " +
    "plain volumes and uniform 45° slopes.",
});
