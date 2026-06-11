# roof-diff — church (generated)

Band floor 7; regions {"slopes":90,"ridge":28,"eaves":26,"ends":23}

| view | IoU | mismatch px | top region (px) |
|---|---|---|---|
| +x+z (45°) | 0.795 | 1642 (extra 1260 / missing 382) | wall 822 |
| +x-z (135°) | 0.837 | 1206 (extra 234 / missing 972) | wall 835 |
| -x-z (225°) | 0.819 | 1953 (extra 1425 / missing 528) | wall 1251 |
| -x+z (315°) | 0.763 | 2047 (extra 690 / missing 1357) | wall 1155 |

Cross-azimuth: 6848 px, roof share 40.669%, worst view -x+z.

- **gable-roof-3-roof-7** ridge Δ(eave-rel) rmse 3.676 max -10.068; rakes: lo@-7 (unfitted) rmse 9.31, hi@1 (unfitted) rmse null
- **hip-cap-mass-1** ridge Δ(eave-rel) rmse 1.148 max -1.89; rakes: lo@-19 (unfitted) rmse 0.59, hi@-8 (unfitted) rmse 0.585

Reproducible: byte-identical ×2 (sha256 547ab65a9adb…).
