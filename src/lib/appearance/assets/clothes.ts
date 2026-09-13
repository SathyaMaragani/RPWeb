import { OUTLINE, stroke, sym, type Asset } from "../core"

const P = (d: string) => `<path d="${d}" fill="{{primary}}" ${OUTLINE}/>`
const S = (d: string) => `<path d="${d}" fill="{{secondary}}" ${OUTLINE}/>`
const T = (d: string) => `<path d="${d}" fill="{{trim}}" ${OUTLINE}/>`
const fold = (d: string) => stroke(d, 4, "{{primaryShade}}")
const dot = (cx: number, cy: number, r: number, fill = "{{trim}}") =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${OUTLINE}/>`

// Shared pieces, drawn over the standard figure. Sleeves are the viewer's
// left side and mirrored.
const TORSO = "M322 585 C326 552 380 540 448 536 Q512 566 576 536 C644 540 698 552 702 585 L678 905 C692 950 702 985 698 1005 L326 1005 C322 985 332 950 346 905 Z"
const SHORT_SLEEVE = "M340 572 C298 584 282 634 278 700 L350 714 C356 672 364 636 378 606 Z"
const LONG_SLEEVE = "M342 570 C298 584 280 636 276 700 L256 1000 L332 1008 L354 724 C360 682 368 644 380 608 Z"
const CUFF = "M256 976 L334 984 L332 1010 L254 1002 Z"
const COLLAR = stroke("M450 540 Q512 572 574 540", 8, "{{trim}}")
const BODY_FOLDS = fold("M420 700 Q430 800 410 880") + fold("M604 700 Q594 800 614 880")

const PANTS_LEG = "M330 985 L516 985 L506 1180 L492 1428 L406 1428 L378 1180 Z"
const WAISTBAND = "M326 975 L698 975 L700 1015 L324 1015 Z"
const SKIRT = "M334 975 L690 975 L748 1200 L276 1200 Z"

const BODICE = "M340 590 C344 556 392 544 448 540 Q512 570 576 540 C632 544 680 556 684 590 L664 900 L360 900 Z"
const STRAPLESS = "M352 640 Q430 600 512 640 Q594 600 672 640 L660 900 L364 900 Z"

const COAT_PANEL = "M322 580 C326 552 380 540 448 536 L500 640 L480 1250 L300 1250 C300 1100 330 950 346 905 Z"
const JACKET_PANEL = "M322 580 C326 552 380 540 448 536 L500 640 L496 1010 L322 1010 C320 980 330 950 346 905 Z"
const LAPEL = "M448 536 L500 640 L470 700 L420 580 Z"

const BOOT = "M404 1300 L490 1300 L492 1440 C494 1470 486 1482 470 1484 L376 1484 C360 1484 356 1462 372 1448 C390 1434 402 1428 404 1410 Z"
const SOLE = "M362 1470 L494 1470 L492 1490 L360 1490 Z"

const item = (
  slot: Asset["slot"],
  id: string,
  name: string,
  colors: Asset["colors"],
  layers: Asset["layers"],
  metal = false
): Asset => ({ id, name, slot, colors, layers, metal })

const tops: Asset[] = [
  item("top", "top_tshirt", "T-shirt", { primary: "#1e3a8a", trim: "#f4f4f5" }, {
    torso: sym(P(SHORT_SLEEVE)) + P(TORSO) + COLLAR + BODY_FOLDS,
  }),
  item("top", "top_longsleeve", "Long-sleeve shirt", { primary: "#f4f4f5", secondary: "#64748b" }, {
    torso: sym(P(LONG_SLEEVE) + S(CUFF)) + P(TORSO) + stroke("M450 540 Q512 572 574 540", 6, "{{primaryShade}}") + BODY_FOLDS,
  }),
  item("top", "top_tunic", "Tunic", { primary: "#7c2d12", secondary: "#3f2a1d", trim: "#c9a227" }, {
    torso:
      sym(P(LONG_SLEEVE)) +
      P("M322 585 C326 552 380 540 448 536 Q512 566 576 536 C644 540 698 552 702 585 L684 905 C706 980 716 1040 716 1090 L308 1090 C308 1040 318 980 340 905 Z") +
      S("M338 880 L686 880 L690 924 L334 924 Z") +
      T("M492 874 L532 874 L532 930 L492 930 Z") +
      stroke("M460 542 L512 620 L564 542", 7, "{{trim}}"),
  }),
  item("top", "top_vest", "Vest and shirt", { primary: "#18181b", secondary: "#f4f4f5", trim: "#c9a227" }, {
    torso:
      sym(S(LONG_SLEEVE)) +
      S(TORSO) +
      sym(P("M322 585 C326 552 380 540 440 536 L500 700 L500 1005 L326 1005 C322 985 332 950 346 905 Z") + dot(484, 760, 8) + dot(484, 870, 8)),
  }),
  item("top", "top_turtleneck", "Turtleneck", { primary: "#0e7490" }, {
    torso:
      sym(P(LONG_SLEEVE)) +
      P(TORSO) +
      P("M458 468 L566 468 L582 562 Q512 594 442 562 Z") +
      fold("M470 500 Q512 512 554 500") +
      fold("M466 530 Q512 544 558 530") +
      BODY_FOLDS,
  }),
  item("top", "top_blouse", "Collared blouse", { primary: "#f4f4f5", secondary: "#db2777", trim: "#c9a227" }, {
    torso:
      sym(P("M340 572 C286 570 262 640 276 720 C300 742 340 738 356 712 C360 670 366 636 378 606 Z")) +
      P(TORSO) +
      sym(S("M448 536 L512 574 L486 620 L428 562 Z")) +
      dot(512, 660, 8) +
      dot(512, 760, 8) +
      dot(512, 860, 8),
  }),
  item("top", "top_tank", "Tank top", { primary: "#9f1239" }, {
    torso:
      P("M372 600 C376 570 400 556 420 552 Q512 640 604 552 C624 556 648 570 652 600 L676 905 C690 950 700 985 696 1005 L328 1005 C324 985 334 950 348 905 Z") +
      BODY_FOLDS,
  }),
  item("top", "top_hoodie", "Hoodie", { primary: "#64748b", secondary: "#475569", trim: "#f4f4f5" }, {
    torso:
      S("M410 560 C404 500 462 478 512 478 C562 478 620 500 614 560 Q512 612 410 560 Z") +
      sym(P(LONG_SLEEVE) + S(CUFF)) +
      P(TORSO) +
      S("M400 820 L624 820 L650 960 L374 960 Z") +
      sym(stroke("M486 566 L478 670", 6, "{{trim}}")),
  }),
  item("top", "top_armor", "Chestplate", { primary: "#c7c7d0", secondary: "#6b7280", trim: "#c9a227" }, {
    torso:
      sym(S(LONG_SLEEVE)) +
      P("M330 600 C340 556 400 544 512 560 C624 544 684 556 694 600 L668 880 C640 940 580 962 512 968 C444 962 384 940 356 880 Z") +
      fold("M512 584 L512 950") +
      fold("M380 760 Q512 806 644 760") +
      sym(`<ellipse cx="352" cy="602" rx="64" ry="48" fill="{{primary}}" ${OUTLINE}/>` + dot(400, 650, 7) + dot(392, 850, 7)),
  }, true),
  item("top", "top_doublet", "Royal doublet", { primary: "#6d28d9", secondary: "#9f1239", trim: "#c9a227" }, {
    torso:
      sym(P(LONG_SLEEVE) + T(CUFF)) +
      P(TORSO) +
      stroke("M512 566 L512 1000", 8, "{{trim}}") +
      S("M362 612 L420 588 L690 962 L638 994 Z") +
      COLLAR,
  }),
]

const bottoms: Asset[] = [
  item("bottom", "bottom_trousers", "Trousers", { primary: "#18181b", secondary: "#3f2a1d", trim: "#c9a227" }, {
    legs: sym(P(PANTS_LEG) + fold("M452 1060 L446 1400")) + S(WAISTBAND) + T("M494 978 L530 978 L530 1012 L494 1012 Z"),
  }),
  item("bottom", "bottom_shorts", "Shorts", { primary: "#1e3a8a" }, {
    legs: sym(P("M330 985 L516 985 L510 1150 L370 1150 Z")) + P(WAISTBAND),
  }),
  item("bottom", "bottom_skirt", "Skirt", { primary: "#9f1239", secondary: "#18181b" }, {
    legs: P(SKIRT) + fold("M430 1010 L400 1190") + fold("M594 1010 L624 1190") + S(WAISTBAND),
  }),
  item("bottom", "bottom_long_skirt", "Long skirt", { primary: "#047857", trim: "#c9a227" }, {
    legs: P("M334 975 L690 975 L760 1440 L264 1440 Z") + fold("M430 1020 L380 1420") + fold("M594 1020 L644 1420") + T("M266 1408 L758 1408 L762 1444 L262 1444 Z"),
  }),
  item("bottom", "bottom_jeans", "Jeans", { primary: "#3a5a8c", secondary: "#c9a227" }, {
    legs:
      sym(P(PANTS_LEG) + stroke("M430 1030 L440 1420", 4, "{{secondary}}") + stroke("M350 1000 Q380 1060 440 1040", 4, "{{secondary}}")) +
      P(WAISTBAND),
  }),
  item("bottom", "bottom_leggings", "Leggings", { primary: "#18181b" }, {
    legs: sym(P("M336 985 L512 985 L500 1190 L486 1428 L410 1428 L386 1190 Z")) + P(WAISTBAND),
  }),
  item("bottom", "bottom_cargo", "Cargo pants", { primary: "#4d5d3a", secondary: "#3f4c2f" }, {
    legs: sym(P(PANTS_LEG) + S("M336 1120 L398 1120 L402 1214 L344 1214 Z")) + S(WAISTBAND),
  }),
  item("bottom", "bottom_pleated", "Pleated skirt", { primary: "#1e3a8a" }, {
    legs:
      P(SKIRT) +
      [376, 424, 472, 512, 552, 600, 648].map((x) => fold(`M${x + (x - 512) * 0.05} 1000 L${x + (x - 512) * 0.33} 1196`)).join("") +
      P(WAISTBAND),
  }),
]

const dresses: Asset[] = [
  item("dress", "dress_simple", "Simple dress", { primary: "#0e7490", trim: "#f4f4f5" }, {
    torso: sym(P(SHORT_SLEEVE)) + P("M360 890 L664 890 L740 1230 L284 1230 Z") + P(BODICE) + T("M358 880 L666 880 L664 910 L360 910 Z") + fold("M450 930 L410 1220") + fold("M574 930 L614 1220"),
  }),
  item("dress", "dress_ballgown", "Ball gown", { primary: "#db2777", secondary: "#f9a8d4", trim: "#c9a227" }, {
    torso:
      P("M364 880 L660 880 C760 1000 850 1250 880 1480 L144 1480 C174 1250 264 1000 364 880 Z") +
      S("M470 900 L554 900 L640 1476 L384 1476 Z") +
      fold("M400 960 L270 1460") +
      fold("M624 960 L754 1460") +
      P(STRAPLESS) +
      T("M362 876 L662 876 L660 904 L364 904 Z"),
  }),
  item("dress", "dress_robe", "Mage robe", { primary: "#312e81", secondary: "#9f1239", trim: "#c9a227" }, {
    torso:
      sym(P("M342 570 C296 584 276 640 270 700 L200 1060 L350 1060 L354 724 C360 682 368 644 380 608 Z") + T("M204 1034 L350 1034 L350 1060 L200 1060 Z")) +
      P("M322 585 C326 552 380 540 448 536 Q512 566 576 536 C644 540 698 552 702 585 L690 905 C730 1100 760 1300 770 1470 L254 1470 C264 1300 294 1100 334 905 Z") +
      stroke("M512 566 L512 1466", 10, "{{trim}}") +
      S("M340 870 L684 870 L688 912 L336 912 Z") +
      COLLAR,
  }),
  item("dress", "dress_sundress", "Sundress", { primary: "#fcd34d", secondary: "#f4f4f5" }, {
    torso:
      P("M360 890 L664 890 L760 1160 L264 1160 Z") +
      P("M380 610 C384 590 404 580 420 578 Q512 650 604 578 C620 580 640 590 644 610 L664 900 L360 900 Z") +
      [
        [430, 980], [520, 1010], [600, 960], [380, 1100], [470, 1100], [570, 1090], [680, 1110], [512, 740], [440, 820], [590, 820],
      ].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="{{secondary}}"/>`).join(""),
  }),
  item("dress", "dress_gown", "Evening gown", { primary: "#18181b", trim: "#c7c7d0" }, {
    torso:
      P("M352 640 Q430 606 512 640 Q594 606 672 640 L664 900 C690 1000 680 1200 700 1330 C730 1400 760 1450 780 1478 L244 1478 C264 1450 294 1400 324 1330 C344 1200 334 1000 360 900 Z") +
      stroke("M354 642 Q430 608 512 642 Q594 608 670 642", 7, "{{trim}}") +
      fold("M560 1000 Q580 1250 640 1470"),
  }),
]

const coats: Asset[] = [
  item("coat", "coat_long", "Long coat", { primary: "#18181b", secondary: "#c7c7d0", trim: "#8b5cf6" }, {
    outer: sym(P(COAT_PANEL) + P(LONG_SLEEVE) + S(LAPEL) + dot(472, 760, 9) + dot(468, 880, 9)),
  }),
  item("coat", "coat_cloak", "Cloak", { primary: "#4c1d95", trim: "#c9a227" }, {
    back: P("M330 570 C250 700 200 1100 180 1470 L844 1470 C824 1100 774 700 694 570 Z"),
    outer:
      sym(P("M326 568 C356 546 420 538 452 540 L424 646 C380 626 348 604 326 568 Z")) +
      stroke("M448 556 Q512 588 576 556", 6, "{{trim}}") +
      dot(512, 572, 16),
  }),
  item("coat", "coat_jacket", "Jacket", { primary: "#7c2d12", secondary: "#3f2a1d", trim: "#c7c7d0" }, {
    outer: sym(P(JACKET_PANEL) + P(LONG_SLEEVE) + S(LAPEL) + dot(482, 800, 7)),
  }),
  item("coat", "coat_royal", "Royal coat", { primary: "#9f1239", secondary: "#f4f4f5", trim: "#c9a227" }, {
    outer: sym(
      P(COAT_PANEL) +
        P(LONG_SLEEVE) +
        stroke("M448 542 L500 640 L480 1244", 26, "{{secondary}}") +
        stroke("M304 1244 L470 1244", 8, "{{trim}}") +
        T("M322 560 C340 540 380 536 410 540 L404 570 C376 568 348 574 326 588 Z") +
        T(CUFF)
    ),
  }),
  item("coat", "coat_trench", "Trench coat", { primary: "#a8875a", secondary: "#8b6d45", trim: "#3f2a1d" }, {
    outer: sym(
      P("M322 580 C326 552 380 540 448 536 L500 640 L486 1200 L306 1200 C306 1060 330 950 346 905 Z") +
        P(LONG_SLEEVE) +
        S("M430 540 L500 640 L456 740 L398 580 Z") +
        S("M336 872 L494 872 L492 916 L334 916 Z") +
        dot(474, 700, 8)
    ) + T("M494 866 L530 866 L530 922 L494 922 Z"),
  }),
]

const shoes: Asset[] = [
  item("shoes", "shoes_boots", "Boots", { primary: "#3f2a1d", secondary: "#18181b", trim: "#c9a227" }, {
    feet: sym(P(BOOT) + S(SOLE) + T("M404 1300 L490 1300 L490 1322 L404 1322 Z")),
  }),
  item("shoes", "shoes_sneakers", "Sneakers", { primary: "#1e3a8a", secondary: "#e5e7eb", trim: "#f4f4f5" }, {
    feet: sym(
      P("M406 1398 L488 1398 L492 1446 C492 1470 484 1478 470 1478 L378 1478 C360 1478 356 1454 374 1444 C392 1434 404 1428 406 1398 Z") +
        S("M360 1462 L494 1462 L494 1490 L358 1490 Z") +
        stroke("M420 1420 L470 1414 M416 1436 L468 1430", 4, "{{trim}}")
    ),
  }),
  item("shoes", "shoes_heels", "Heels", { primary: "#9f1239" }, {
    feet: sym(
      P("M470 1450 L484 1450 L482 1496 L472 1496 Z") +
        P("M412 1418 L484 1418 L486 1452 L480 1478 L470 1478 L466 1458 C440 1462 400 1476 380 1478 C364 1478 366 1460 380 1452 C400 1440 408 1430 412 1418 Z")
    ),
  }),
  item("shoes", "shoes_tall_boots", "Knee-high boots", { primary: "#18181b", secondary: "#27272a", trim: "#c7c7d0" }, {
    feet: sym(
      P("M392 1170 L498 1170 L492 1440 C494 1470 486 1482 470 1484 L376 1484 C360 1484 356 1462 372 1448 C390 1434 396 1428 398 1410 Z") +
        S(SOLE) +
        T("M390 1170 L500 1170 L498 1196 L392 1196 Z")
    ),
  }),
  item("shoes", "shoes_flats", "Flats", { primary: "#db2777", trim: "#f4f4f5" }, {
    feet: sym(
      P("M408 1440 L486 1440 L488 1468 C486 1482 476 1484 466 1484 L380 1484 C362 1484 360 1464 378 1456 C396 1450 404 1446 408 1440 Z") +
        dot(412, 1452, 8)
    ),
  }),
  item("shoes", "shoes_greaves", "Armoured greaves", { primary: "#c7c7d0", secondary: "#374151", trim: "#c9a227" }, {
    feet: sym(
      P("M398 1230 L496 1230 L492 1440 C494 1470 486 1482 470 1484 L376 1484 C360 1484 356 1462 372 1448 C390 1434 398 1428 400 1410 Z") +
        S(SOLE) +
        fold("M404 1300 L490 1300") +
        fold("M402 1370 L490 1370") +
        dot(446, 1250, 12)
    ),
  }, true),
]

export const CLOTHING_ASSETS: Asset[] = [...tops, ...bottoms, ...dresses, ...coats, ...shoes]
