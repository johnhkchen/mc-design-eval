# Reconstructed milestone — cottage (T-107-01, E-27 terminal)

Chain: `styled-milestone.mjs` → gated; gate: **FAIL**; kit presence: **PASS**

Instrument: **frozen (zero diffs)** vs committed pre-run gate record; judge claude-opus-4-8

## Verdicts per azimuth

| azimuth | verdict | gaps (region/attribute, severity) |
|---|---|---|
| +x+z 45° | drifted | roof across the whole top/form (major); upper storey gable ends/massing (major); timber-frame walls vs stone plinth/material zoning (minor) |
| +x-z 135° | same object | front gable wall, upper storey/material zoning (minor); timber roof eaves/form (minor) |
| -x-z 225° | same object | lower walls / stone foundation course/material zoning (minor); roof ridge and chimney profile/form (minor) |
| -x+z 315° | drifted | roof/form (major); overall building edges/eaves/form (minor); stone ground-floor base/material zoning (minor) |

## Metrics before/after

| metric | E-26 baseline | reconstructed | source |
|---|---|---|---|
| protrusions (≥4/6 faces) | 265 | 51 | benchmarks/sculpture/styled/cottage/artifact.json@5574d70 → styled/cottage/artifact.json |
| ragged columns | 144/663 (21.7%) | 45/661 (6.8%) | same |
| roof fit | — | accepted: 2 gables, pitch by {"glb":3,"voxel":1}, glb rejected on 1 (divergence ≤ 5.59) | roof record |
| cage steps | — | 2 accepted / 0 rolled back | regularize record |

Sheets: before `pr/assets/frames/reconstructed-cottage-before.png`, after `pr/assets/frames/reconstructed-cottage-after.png`, gate `pr/assets/frames/multi-angle-cottage-styled.png`

Milestone record: `benchmarks/sculpture/styled/cottage.json`; shas `{"base":null,"shell":"33b1ca02f2589f49dd8c678e2416bf81196be41bf91451c4c9e351baf24c0afd","reconstructed":"df4f749f27bc47ce784aedf41e8587ed9f4aea7ed99da1ba7043256cd7a16283","skinFinal":"ecca90d2be6a1c4e22e91f2a06db716347d1210052be8adc422b5e2f6e92c2cc","grammarFinal":"be6116b6934283b6544da333d96e29dbc3c18faa4547f01968ed806fe6749a37","styled":"8385a7a357252732b71f856a5aa54ffdb527fc64492a93c42b0e196189cc962b"}`
