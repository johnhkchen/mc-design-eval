// Shared by profiles.mjs and iterate.mjs: the feature vector a taste profile weighs, and a profile's review of one build.
const lvl = { Low: 0, Medium: 1, High: 2 }, amt = { None: 0, Few: 1, Many: 2 };
export function features(b, m, obs, look) {
  const avg = (fn) => (obs.length ? obs.reduce((t, o) => t + fn(o), 0) / obs.length : 0);
  return {
    // L0 (code)
    valid: m.valid, stray: m.stray, blankWalls: m.blankWalls, paletteFlags: m.paletteFlags, visibleMaterials: m.visibleMaterials,
    hueFamilies: m.hueFamilies, neutralShare: m.neutralShare, satMean: m.satMean, lumStd: m.lumStd, wallRoofContrast: m.wallRoofContrast,
    agedShare: m.agedShare, detailShare: m.detailShare, stairShare: m.stairShare, slabShare: m.slabShare, fenceWallTrapShare: m.fenceWallTrapShare,
    rooflineVariety: m.rooflineVariety, footprintFill: m.footprintFill, heightToWidth: m.heightToWidth,
    // L1 observations (model, factual)
    shapedRoof: avg((o) => (["None", "Flat"].includes(o.roof_form) ? 0 : 1)), overhang: avg((o) => +o.roof_overhang), lidRoof: avg((o) => +o.roof_lid),
    massing: avg((o) => ({ Box: 0, Some: 1, Varied: 2 })[o.massing]), depth: avg((o) => ({ Flat: 0, Some: 1, Deep: 2 })[o.facade_depth]),
    door: avg((o) => +o.street_door), windows: avg((o) => ({ None: 0, OneToThree: 1, FourToEight: 2, NineOrMore: 3 })[o.street_windows]),
    wallGaps: avg((o) => amt[o.wall_gaps]), weathering: avg((o) => amt[o.weathering]), props: avg((o) => amt[o.props]), sign: avg((o) => +o.sign),
    // L1 look (model, perceptual, from the owner's reasons)
    harmony: look ? ({ Clashing: 0, Mixed: 1, Harmonious: 2 })[look.colour_harmony] : 1, colourInterest: look ? lvl[look.colour_interest] : 1,
    formInterest: look ? lvl[look.form_interest] : 1, detailFinesse: look ? lvl[look.detail_finesse] : 1, oddElement: look ? +look.odd_element : 0,
    grounded: look ? +look.grounded : 1, readsClearly: look ? +look.reads_clearly : 1,
  };
}


/** What a person (profile) would most want changed on a build: the features pulling its score down hardest, under
 *  their own criteria and quotes. f = features(...); P = a saved profile. */
export function reviewOf(f, P) {
  const { features: names, mean, sd, weights } = P.model;
  const pulls = names.map((n, i) => ({ n, pull: weights[n] * ((f[n] - mean[i]) / sd[i]) })).sort((a, b) => a.pull - b.pull);
  const crit = (n) => P.criteria.find((c) => c.features.includes(n));
  return {
    score: +pulls.reduce((t, p) => t + p.pull, 0).toFixed(2),
    improve: pulls.filter((p) => p.pull < -0.05 && Math.abs(weights[p.n]) > 0.02).slice(0, 6)
      .map((p) => ({ feature: p.n, value: f[p.n], pull: +p.pull.toFixed(2), criterion: crit(p.n)?.say ?? "other", inTheirWords: crit(p.n)?.quotes?.[0] ?? null })),
    strengths: pulls.slice(-3).reverse().map((p) => ({ feature: p.n, pull: +p.pull.toFixed(2) })),
  };
}
