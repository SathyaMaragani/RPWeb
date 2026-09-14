import { LINE, shaded, stroke, sym, tone, type Asset } from "../core"

const P = (id: string, d: string, inner = "") => shaded(id, d, "primary", inner)
const S = (id: string, d: string, inner = "") => shaded(id, d, "secondary", inner)
const H = (id: string, d: string, inner = "") => shaded(id, d, "hair", inner)
const shadeOf = (d: string, base = "primary") => tone(d, `${base}Shade`)
const lightOf = (d: string, base = "primary") => tone(d, `${base}Light`, 'opacity=".6"')
const fold = (d: string, base = "primary") => stroke(d, 3, `{{${base}Deep}}`, 'opacity=".85"')
const gem = (x: number, y: number, r: number, base = "secondary") =>
  `<path d="M${x} ${y - r} L${x + r * 0.8} ${y} L${x} ${y + r} L${x - r * 0.8} ${y} Z" fill="{{${base}}}" stroke="{{${base}Line}}" stroke-width="2.5"/>` +
  `<path d="M${x - r * 0.3} ${y - r * 0.2} L${x} ${y - r * 0.7} L${x + r * 0.15} ${y - r * 0.2} Z" fill="{{${base}Light}}"/>`

const item = (
  slot: Asset["slot"],
  id: string,
  name: string,
  colors: Asset["colors"],
  layers: Asset["layers"],
  metal = false
): Asset => ({ id, name, slot, colors, layers, metal })

/** Right hand, for things held: fingers closing over a grip at (658, 1030). */
const GRIP = `<path d="M634 1012 C650 1000 676 1002 686 1016 C692 1034 682 1052 662 1054 C644 1054 630 1040 634 1012 Z" fill="{{skin}}" stroke="{{skinLine}}" stroke-width="4"/>` +
  stroke("M644 1026 L680 1024 M646 1040 L676 1040", 3, "{{skinShade}}")

// ---------------------------------------------------------------- glasses and masks

const GLASSES: Asset[] = [
  item("glasses", "glasses_round", "Round spectacles", { primary: "#d4af37" }, {
    eyewear:
      sym(
        `<circle cx="448" cy="446" r="54" fill="#dff2ff" fill-opacity=".12" stroke="{{primary}}" stroke-width="6"/>` +
          stroke("M416 418 L432 402 M412 440 L420 432", 5, "#ffffff", 'opacity=".55"') +
          stroke("M394 436 L340 426", 5, "{{primary}}")
      ) + stroke("M500 438 Q512 426 524 438", 5, "{{primary}}"),
  }, true),
  item("glasses", "glasses_cateye", "Cat-eye glasses", { primary: "#1f2f6b", secondary: "#8b95a5" }, {
    eyewear:
      sym(
        `<path d="M388 432 C400 406 452 400 502 414 C512 440 500 478 460 484 C420 488 394 468 388 432 Z" fill="{{secondary}}" fill-opacity=".42" stroke="{{primary}}" stroke-width="6" stroke-linejoin="round"/>` +
          `<path d="M388 432 L364 400 L402 414 Z" fill="{{primary}}"/>` +
          stroke("M420 424 L436 412", 5, "#ffffff", 'opacity=".5"') +
          [470, 492, 514, 536].map((y) => `<circle cx="372" cy="${y}" r="4" fill="{{primary}}"/>`).join("")
      ) + stroke("M502 432 Q512 422 522 432", 5, "{{primary}}"),
  }),
]

const MASKS: Asset[] = [
  item("mask", "mask_masquerade", "Masquerade mask", { primary: "#16141c", trim: "#d4af37" }, {
    eyewear:
      `<path d="M350 424 C378 372 460 380 512 410 C564 380 646 372 674 424 C692 474 652 510 600 504 C560 500 530 484 512 474 C494 484 464 500 424 504 C372 510 332 474 350 424 Z M408 446 A40 26 0 1 0 488 446 A40 26 0 1 0 408 446 Z M536 446 A40 26 0 1 0 616 446 A40 26 0 1 0 536 446 Z" fill="{{primary}}" fill-rule="evenodd" stroke="{{primaryLine}}" stroke-width="4" stroke-linejoin="round"/>` +
      sym(stroke("M362 420 C390 388 440 392 470 410 M372 470 C390 492 420 496 440 490", 3.5, "{{trim}}") + `<path d="M350 424 C320 390 300 350 316 320 C330 360 350 380 372 396 Z" fill="{{trim}}" stroke="{{trimLine}}" stroke-width="3"/>`) +
      `<path d="M512 404 L522 420 L512 436 L502 420 Z" fill="{{trim}}"/>`,
  }),
  item("mask", "mask_cloth", "Shrouding cloth", { primary: "#16141c" }, {
    eyewear: P(
      "mask-cloth",
      "M332 494 C400 522 460 528 512 528 C564 528 624 522 692 494 C694 572 650 632 512 652 C374 632 330 572 332 494 Z",
      shadeOf("M560 500 L720 500 L720 660 L540 660 C600 600 590 560 560 500 Z") + fold("M400 560 Q450 590 512 592") + fold("M440 610 Q480 628 540 624") + fold("M560 560 Q600 566 640 548")
    ),
  }),
]

// ---------------------------------------------------------------- jewellery

/** Beads along a quadratic curve from (x0, y0) through control (cx, cy) to (x1, y1). */
function beads(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, count: number, r: number) {
  let out = ""
  for (let i = 0; i <= count; i++) {
    const t = i / count
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t ** 2 * x1
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t ** 2 * y1
    out +=
      `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="{{primary}}" stroke="{{primaryLine}}" stroke-width="2"/>` +
      `<circle cx="${(x - r * 0.3).toFixed(1)}" cy="${(y - r * 0.35).toFixed(1)}" r="${r * 0.3}" fill="{{primaryLight}}"/>`
  }
  return out
}

const JEWELLERY: Asset[] = [
  item("earrings", "earrings_drops", "Gem drops", { primary: "#d4af37", secondary: "#8f1d2c" }, {
    ears: sym(
      `<circle cx="326" cy="492" r="7" fill="{{primary}}" stroke="{{primaryLine}}" stroke-width="2"/>` +
        stroke("M326 498 L326 522", 3, "{{primary}}") +
        `<path d="M326 518 L344 548 L326 584 L308 548 Z" fill="{{secondary}}" stroke="{{secondaryLine}}" stroke-width="3" stroke-linejoin="round"/>` +
        `<path d="M320 540 L326 526 L332 540 Z" fill="{{secondaryLight}}"/>`
    ),
  }, true),
  item("earrings", "earrings_hoops", "Hoops", { primary: "#d4af37" }, {
    ears: sym(
      `<circle cx="320" cy="522" r="26" fill="none" stroke="{{primaryLine}}" stroke-width="9"/><circle cx="320" cy="522" r="26" fill="none" stroke="{{primary}}" stroke-width="5"/>` +
        stroke("M300 508 Q306 500 316 497", 2.5, "{{primaryLight}}")
    ),
  }, true),
  item("necklace", "necklace_choker", "Choker", { primary: "#16141c", secondary: "#8f1d2c" }, {
    neck:
      `<path d="M480 632 Q512 646 544 632 L544 656 Q512 672 480 656 Z" fill="{{primary}}" stroke="{{primaryLine}}" stroke-width="3"/>` +
      gem(512, 684, 14),
  }),
  item("necklace", "necklace_beads", "Bead strands", { primary: "#2b7a8c" }, {
    neck: beads(484, 652, 512, 740, 540, 652, 9, 6) + beads(470, 668, 512, 860, 554, 668, 14, 7),
  }),
  item("necklace", "necklace_pendant", "Locket pendant", { primary: "#d4af37", secondary: "#6b3fa0" }, {
    neck:
      stroke("M484 648 Q512 740 540 648", 3.5, "{{primary}}") +
      `<ellipse cx="512" cy="756" rx="20" ry="26" fill="{{primary}}" stroke="{{primaryLine}}" stroke-width="3"/>` +
      gem(512, 756, 13),
  }, true),
  item("bracelets", "bracelets_cuffs", "Gold cuffs", { primary: "#d4af37" }, {
    gloves: sym(P("bracelets-cuff", "M342 936 L396 940 L396 972 L340 968 Z", lightOf("M346 944 L394 948 L394 954 L346 950 Z") + shadeOf("M378 930 L404 930 L404 980 L374 980 Z"))),
  }, true),
]

// ---------------------------------------------------------------- headwear

const HOOD_OPENING = "M322 470 C312 334 390 226 512 194 C634 226 712 334 702 470 C698 540 684 590 664 624 L360 624 C340 590 326 540 322 470 Z"
const HOOD =
  "M268 548 C244 300 360 108 512 64 C664 108 780 300 756 548 C744 624 712 690 668 732 Q512 790 356 732 C312 690 280 624 268 548 Z " +
  HOOD_OPENING

const HATS: Asset[] = [
  item("hat", "hat_crown", "Crown", { primary: "#d4af37", secondary: "#8f1d2c" }, {
    headwear:
      P(
        "hat-crown",
        "M390 236 C428 212 596 212 634 236 L644 168 L594 194 L564 112 L512 172 L460 112 L430 194 L380 168 Z",
        shadeOf("M540 100 L660 100 L660 250 L560 250 Z") + lightOf("M404 214 L420 184 L430 214 Z") + fold("M392 222 C430 204 594 204 632 222")
      ) +
      gem(512, 216, 16) +
      gem(446, 222, 11) +
      gem(578, 222, 11) +
      [[380, 164], [460, 108], [512, 166], [564, 108], [644, 164]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#f7f3ea" stroke="${LINE}" stroke-width="2.5"/>`).join(""),
  }, true),
  item("hat", "hat_mage", "Mage's hat", { primary: "#1f2f6b", secondary: "#d4af37", trim: "#fcd34d" }, {
    headwear:
      P("hat-brim", "M252 262 C250 214 380 186 512 186 C644 186 774 214 772 262 C770 306 640 322 512 322 C384 322 254 306 252 262 Z", shadeOf("M512 250 L780 250 L780 330 L512 330 Z") + fold("M290 262 C340 290 684 290 734 262")) +
      P("hat-cone", "M382 250 C420 184 458 94 518 44 C560 10 642 18 694 70 C644 60 604 82 594 122 C604 164 632 212 652 250 C560 270 470 270 382 250 Z", shadeOf("M560 40 L700 40 L700 270 L600 270 C600 190 560 110 560 40 Z") + fold("M450 200 C480 150 500 100 530 60")) +
      S("hat-band", "M392 220 C470 200 560 200 640 220 L650 250 C560 268 470 268 384 250 Z") +
      `<path d="M694 70 l7 16 17 2 -13 11 4 17 -15 -9 -15 9 4 -17 -13 -11 17 -2 Z" fill="{{trim}}" stroke="{{trimLine}}" stroke-width="2.5"/>`,
  }),
  item("hat", "hat_hood", "Deep hood", { primary: "#16141c", secondary: "#2b7a8c" }, {
    headwear:
      `<path d="${HOOD}" fill="{{primary}}" fill-rule="evenodd"/>` +
      `<clipPath id="hat-hood-c"><path d="${HOOD}" clip-rule="evenodd" fill-rule="evenodd"/></clipPath>` +
      `<g clip-path="url(#hat-hood-c)">${shadeOf("M560 60 C700 120 780 300 760 560 C740 680 680 740 600 760 L800 760 L800 60 Z")}${fold("M300 420 C290 520 310 620 360 700")}${fold("M724 420 C734 520 714 620 664 700")}` +
      `<path d="${HOOD_OPENING}" fill="none" stroke="{{secondaryDeep}}" stroke-width="16"/></g>` +
      `<path d="${HOOD}" fill="none" fill-rule="evenodd" stroke="{{primaryLine}}" stroke-width="4.5" stroke-linejoin="round"/>`,
  }),
  item("hat", "hat_headband", "Tied headband", { primary: "#8f1d2c", secondary: "#1f2f6b" }, {
    headwear:
      P("hat-tail", "M696 348 C760 360 806 402 826 468 L800 458 L792 488 C770 424 738 392 698 376 Z", shadeOf("M740 380 L840 380 L840 500 L780 500 Z")) +
      P("hat-band", "M328 334 C400 292 624 292 696 334 L700 364 C624 324 400 324 324 364 Z", shadeOf("M600 290 L720 290 L720 380 L600 380 Z")) +
      stroke("M330 350 C400 312 624 312 694 350", 4, "{{secondary}}") +
      `<ellipse cx="698" cy="352" rx="18" ry="20" fill="{{primary}}" stroke="{{primaryLine}}" stroke-width="3.5"/>`,
  }),
]

// ---------------------------------------------------------------- weapons

const WEAPONS: Asset[] = [
  item("weapon", "weapon_longsword", "Longsword", { primary: "#c9ccd6", secondary: "#16141c", trim: "#8f1d2c" }, {
    hand:
      `<circle cx="638" cy="978" r="13" fill="{{trim}}" stroke="${LINE}" stroke-width="3"/>` +
      `<path d="M644 988 L662 982 L676 1040 L658 1046 Z" fill="{{secondary}}" stroke="{{secondaryLine}}" stroke-width="3"/>` +
      P("weapon-blade", "M654 1068 L684 1058 L828 1454 L812 1490 L800 1466 Z", shadeOf("M670 1060 L690 1054 L834 1450 L816 1490 Z") + stroke("M668 1070 L808 1462", 3, "{{primaryLight}}")) +
      `<path d="M620 1074 L700 1044 L708 1060 L628 1090 Z" fill="{{secondary}}" stroke="${LINE}" stroke-width="3.5" stroke-linejoin="round"/>` +
      `<path d="M664 1052 L676 1068 L664 1084 L652 1068 Z" fill="{{trim}}" stroke="${LINE}" stroke-width="2.5"/>` +
      GRIP,
  }, true),
  item("weapon", "weapon_staff", "Crescent staff", { primary: "#6b4a32", secondary: "#8b5cf6", trim: "#d4af37" }, {
    hand:
      P("weapon-shaft", "M662 570 L684 570 L664 1500 L642 1500 Z", shadeOf("M674 560 L700 560 L676 1510 L656 1510 Z") + fold("M668 700 L664 800 M660 950 L656 1050")) +
      `<radialGradient id="weapon-orb"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="{{secondaryLight}}"/><stop offset="1" stop-color="{{secondary}}"/></radialGradient>` +
      `<circle cx="672" cy="506" r="70" fill="{{secondary}}" opacity=".25"/>` +
      `<circle cx="672" cy="506" r="40" fill="url(#weapon-orb)" stroke="{{secondaryLine}}" stroke-width="3"/>` +
      shaded("weapon-crescent", "M620 550 C590 490 616 418 684 400 C640 440 632 500 666 554 Z", "trim") +
      shaded("weapon-crescent2", "M724 550 C754 490 736 430 690 412 C716 450 720 500 690 550 Z", "trim") +
      [610, 670].map((y) => `<rect x="656" y="${y}" width="32" height="14" rx="3" fill="{{trim}}" stroke="{{trimLine}}" stroke-width="2.5"/>`).join("") +
      GRIP,
  }),
  item("weapon", "weapon_dagger", "Curved dagger", { primary: "#c9ccd6", secondary: "#3b2a22", trim: "#d4af37" }, {
    hand:
      `<path d="M648 994 L668 990 L672 1040 L652 1044 Z" fill="{{secondary}}" stroke="{{secondaryLine}}" stroke-width="3"/>` +
      P("weapon-blade", "M650 1066 L676 1062 C690 1120 700 1180 684 1240 C676 1200 662 1130 650 1066 Z", stroke("M662 1072 C674 1120 684 1170 684 1220", 3, "{{primaryLight}}")) +
      `<path d="M628 1060 L696 1050 L698 1068 L630 1078 Z" fill="{{trim}}" stroke="{{trimLine}}" stroke-width="3"/>` +
      GRIP,
  }, true),
]

// ---------------------------------------------------------------- fantasy

/** A long flight feather from (x0, y0) to a tip, for layered wings. */
const feather = (id: string, x0: number, y0: number, tx: number, ty: number, w: number) => {
  const nx = -(ty - y0)
  const ny = tx - x0
  const len = Math.hypot(nx, ny)
  const ox = (nx / len) * w
  const oy = (ny / len) * w
  const mx = (x0 + tx) / 2
  const my = (y0 + ty) / 2
  const d = `M${x0} ${y0} Q${(mx + ox).toFixed(1)} ${(my + oy).toFixed(1)} ${tx} ${ty} Q${(mx - ox * 0.6).toFixed(1)} ${(my - oy * 0.6).toFixed(1)} ${x0} ${y0} Z`
  return P(id, d, shadeOf(`M${x0} ${y0} L${tx} ${ty} L${tx - ox} ${ty - oy} L${x0 - ox} ${y0 - oy} Z`)) + stroke(`M${x0} ${y0} L${tx} ${ty}`, 2.5, "{{primaryDeep}}")
}

const FANTASY: Asset[] = [
  item("animalEars", "animalears_cat", "Cat ears", { secondary: "#e7a6c0" }, {
    ears: sym(
      H("animalEars-cat", "M362 286 L334 118 L476 214 Z", tone("M404 150 L480 210 L420 280 Z", "hairShade")) +
        `<path d="M378 256 L360 158 L440 216 Z" fill="{{secondary}}"/>` +
        stroke("M374 236 L394 214 M384 250 L408 230", 3, "{{hairLight}}")
    ),
  }),
  item("animalEars", "animalears_fox", "Fox ears", { secondary: "#f2efe8" }, {
    ears: sym(
      H("animalEars-fox", "M356 306 L292 84 L484 226 Z", tone("M390 150 L490 226 L420 300 Z", "hairShade")) +
        `<path d="M372 270 L326 136 L440 226 Z" fill="{{secondary}}"/>` +
        `<path d="M292 84 L312 150 L340 126 Z" fill="{{hairDeep}}"/>`
    ),
  }),
  item("horns", "horns_demon", "Swept horns", { primary: "#2f3440" }, {
    horns: sym(
      P("horns-demon", "M438 236 C392 196 340 156 322 60 C372 112 432 142 490 218 Z", shadeOf("M360 90 L500 220 L470 240 L340 110 Z") + lightOf("M334 82 C360 120 400 160 440 190 L436 200 C396 170 356 130 334 82 Z")) +
        stroke("M380 146 L396 132 M410 176 L428 162 M442 204 L460 190", 3, "{{primaryDeep}}")
    ),
  }),
  item("horns", "horns_ram", "Ram horns", { primary: "#d9c3a0" }, {
    horns: sym(
      P("horns-ram", "M406 250 C322 228 280 300 300 372 C320 432 394 438 406 390 C414 356 382 340 364 362 C380 320 430 330 440 382 C452 442 400 482 350 472 C268 452 248 330 300 270 C330 232 380 222 432 238 Z", shadeOf("M300 380 C320 460 420 470 450 400 L470 480 L290 480 Z")) +
        stroke("M316 300 L332 312 M300 340 L318 346 M306 390 L324 384 M340 432 L350 416", 3, "{{primaryDeep}}")
    ),
  }),
  item("halo", "halo_ring", "Halo", { primary: "#f5d77a" }, {
    back:
      `<filter id="halo-glow" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="10"/></filter>` +
      `<ellipse cx="512" cy="112" rx="150" ry="38" fill="none" stroke="{{primary}}" stroke-width="22" opacity=".7" filter="url(#halo-glow)"/>` +
      `<ellipse cx="512" cy="112" rx="150" ry="38" fill="none" stroke="{{primary}}" stroke-width="10"/>` +
      `<ellipse cx="512" cy="112" rx="150" ry="38" fill="none" stroke="#ffffff" stroke-width="3" opacity=".8"/>`,
  }),
  item("wings", "wings_feathered", "Feathered wings", { primary: "#f2efe8" }, {
    back: sym(
      feather("wings-f1", 440, 860, 150, 1130, 70) +
        feather("wings-f2", 440, 840, 90, 1020, 76) +
        feather("wings-f3", 440, 820, 60, 900, 80) +
        feather("wings-f4", 440, 800, 70, 780, 80) +
        feather("wings-f5", 440, 780, 110, 660, 78) +
        feather("wings-f6", 440, 760, 190, 570, 72) +
        P(
          "wings-coverts",
          "M480 730 C430 620 330 560 210 560 C240 600 240 640 214 676 C280 690 294 730 266 770 C330 780 350 816 326 856 C390 866 420 900 410 940 C460 920 490 860 490 800 Z",
          shadeOf("M300 700 L500 720 L500 960 L340 960 Z") +
            fold("M440 680 Q350 630 250 610") +
            fold("M450 750 Q370 720 290 730") +
            fold("M460 820 Q400 810 340 830")
        )
    ),
  }),
  item("wings", "wings_bat", "Bat wings", { primary: "#2a1b3d", secondary: "#16141c" }, {
    back: sym(
      P("wings-bat", "M478 770 C420 620 300 520 130 500 C164 562 154 622 112 664 C196 654 238 694 226 756 C288 726 330 758 330 826 C382 794 432 806 452 856 Z", shadeOf("M320 600 L480 760 L460 860 L300 780 Z") + lightOf("M180 520 C260 540 340 590 400 660 L390 670 C330 610 260 560 180 530 Z")) +
        stroke("M478 770 L130 500 M474 778 L112 664 M468 790 L226 756 M462 806 L330 826", 8, "{{secondary}}")
    ),
  }),
  item("tail", "tail_demon", "Spaded tail", { primary: "#16141c", secondary: "#8f1d2c" }, {
    back:
      stroke("M540 1000 C660 1090 780 1080 816 960 C834 900 818 850 800 820", 30, "{{primaryLine}}") +
      stroke("M540 1000 C660 1090 780 1080 816 960 C834 900 818 850 800 820", 20, "{{primary}}") +
      S("tail-spade", "M800 830 C760 804 770 756 806 730 C842 754 850 800 820 830 Z", shadeOf("M806 730 L860 730 L860 840 L806 840 Z", "secondary")),
  }),
  item("tail", "tail_fox", "Fox tail", { secondary: "#f2efe8" }, {
    back:
      H("tail-fox", "M534 1000 C640 1072 800 1100 872 990 C914 904 890 792 818 740 C838 830 806 900 736 920 C660 942 590 950 534 1000 Z", tone("M600 1000 C700 1060 820 1060 880 980 L900 1120 L560 1120 Z", "hairShade") + stroke("M620 990 C700 1010 780 1000 830 950 M660 960 C740 970 800 940 840 890", 3, "{{hairShade}}")) +
      `<path d="M818 740 C878 780 918 862 888 950 C858 898 840 836 818 740 Z" fill="{{secondary}}" stroke="{{secondaryLine}}" stroke-width="3.5"/>`,
  }),
]

export const EXTRA_ASSETS: Asset[] = [...GLASSES, ...MASKS, ...JEWELLERY, ...HATS, ...WEAPONS, ...FANTASY]
