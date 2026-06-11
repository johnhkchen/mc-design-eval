# roof-diff — gatehouse (reconstructed)

Band floor 19; regions {"eaves":30,"slopes":251,"ends":13,"ridge":7}

| view | IoU | mismatch px | top region (px) |
|---|---|---|---|
| +x+z (45°) | 0.914 | 835 (extra 279 / missing 556) | wall 451 |
| +x-z (135°) | 0.927 | 708 (extra 301 / missing 407) | wall 305 |
| -x-z (225°) | 0.931 | 648 (extra 25 / missing 623) | wall 215 |
| -x+z (315°) | 0.917 | 804 (extra 272 / missing 532) | unpartitioned 417 |

Cross-azimuth: 2995 px, roof share 57.262%, worst view +x+z.

- **gable-roof-0-roof-4** ridge Δ(eave-rel) rmse 2.411 max 4.501; rakes: lo@-12 (unfitted) rmse 3.012, hi@13 rmse null

Reproducible: byte-identical ×2 (sha256 25c125de529c…).
