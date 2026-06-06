# Form-revise A/B — the LLM form-edit route + the E-13-baseline verdict (T-046-01 / T-047-01)

The deterministic revision loop with the **LLM block-editor** behind the accept-gate, over a curated
form region of each subject. The accept step consults the **form-target seam** (T-047-01: a concept
target today, a GLB target later). `whole IoU` is the full-build 3/4 render vs the concept (comparable
to `form-baseline.json`); the **verdict** is categorical vs the E-13 baseline. An edit is **kept** only
if the per-region accept signal strictly improved, else rolled back.

| subject | route | E-13 IoU (before) | whole IoU after | proposed whole | kept? | verdict |
|---------|-------|------------------:|----------------:|---------------:|:-----:|---------|
| koi | llm-edit | 0.481 | 0.481 | 0.481 | ✗ | **held** |
| heart | llm-edit | 0.347 | 0.347 | 0.345 | ✗ | **held** |

- **improved** — a surgical edit cleared the accept-gate AND lifted the whole-object IoU above the E-13 baseline
- **held** — no local edit beat the single-view silhouette baseline — the cage kept the build unchanged (no regression)
- **regressed** — whole-object IoU fell below the E-13 baseline — should be impossible under the gate (alarm)
- **unknown** — missing a baseline or after score

## koi — 009-vConcept-a-koi-fish
- region: `{"min":[-9,1,-5],"max":[2,6,5]}`  defect: **ringing** in the swimming body (the S-curve that flattens to a straight body)
- route: `llm-edit`  kept: **false** (rolled-back)  proposed edits stashed: 1
- E-13 baseline whole IoU: 0.481  → after: 0.481  verdict: **held**
- proposed-edit whole IoU: 0.481 (the LLM edit applied, shown even if rolled back)
- renders: `form-revise-ab/koi/{before,proposed,after}.png` + `crop.png` (the region the model saw)
- proposals: `[{"region":"-9,1,-5|2,6,5","proposed":4,"applied":4,"rejected":[],"stashed":true}]`

```json
[
  {
    "iteration": 1,
    "region": {
      "bbox": {
        "min": [
          -9,
          1,
          -5
        ],
        "max": [
          2,
          6,
          5
        ]
      }
    },
    "subBounds": {
      "min": [
        -9,
        1,
        -5
      ],
      "max": [
        2,
        6,
        5
      ]
    },
    "defect": "ringing",
    "where": "the swimming body (the S-curve that flattens to a straight body)",
    "route": "llm-edit",
    "tweak": "noop",
    "scoreBefore": 0.455,
    "scoreAfter": 0.455,
    "accepted": false,
    "reason": "rolled-back"
  }
]
```

## heart — 006-vConcept-an-anatomically-correct-human-heart
- region: `{"min":[-8,20,-6],"max":[8,31,6]}`  defect: **ringing** in the aortic arch (which never builds as a closed loop)
- route: `llm-edit`  kept: **false** (rolled-back)  proposed edits stashed: 1
- E-13 baseline whole IoU: 0.347  → after: 0.347  verdict: **held**
- proposed-edit whole IoU: 0.345 (the LLM edit applied, shown even if rolled back)
- renders: `form-revise-ab/heart/{before,proposed,after}.png` + `crop.png` (the region the model saw)
- proposals: `[{"region":"-8,20,-6|8,31,6","proposed":3,"applied":3,"rejected":[],"stashed":true}]`

```json
[
  {
    "iteration": 1,
    "region": {
      "bbox": {
        "min": [
          -8,
          20,
          -6
        ],
        "max": [
          8,
          31,
          6
        ]
      }
    },
    "subBounds": {
      "min": [
        -8,
        20,
        -6
      ],
      "max": [
        8,
        31,
        6
      ]
    },
    "defect": "ringing",
    "where": "the aortic arch (which never builds as a closed loop)",
    "route": "llm-edit",
    "tweak": "noop",
    "scoreBefore": 0.384,
    "scoreAfter": 0.379,
    "accepted": false,
    "reason": "rolled-back"
  }
]
```
