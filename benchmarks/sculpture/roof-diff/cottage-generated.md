# roof-diff — cottage (generated)

Band floor 14; regions {"ridge":103,"slopes":265,"ends":76,"eaves":31}

| view | IoU | mismatch px | top region (px) |
|---|---|---|---|
| +x+z (45°) | 0.867 | 1392 (extra 792 / missing 600) | wall 1090 |
| +x-z (135°) | 0.846 | 1769 (extra 1163 / missing 606) | wall 1231 |
| -x-z (225°) | 0.836 | 1649 (extra 233 / missing 1416) | wall 865 |
| -x+z (315°) | 0.869 | 1421 (extra 442 / missing 979) | wall 1018 |

Cross-azimuth: 6231 px, roof share 32.531%, worst view +x-z.

- **gable-roof-0-roof-4** ridge Δ(eave-rel) rmse 0.678 max -2.933; rakes: lo@-14 rmse 1.747, hi@13 rmse 1.508
- **gable-roof-2-roof-3** ridge Δ(eave-rel) rmse 4.332 max -4.401; rakes: lo@-1 (unfitted) rmse 2.721, hi@10 rmse 2.861

Reproducible: byte-identical ×2 (sha256 fa2a655afdd7…).
