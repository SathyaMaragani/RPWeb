import { LINE, OUTLINE, stroke, sym, type Asset } from "../core"

const P = (d: string) => `<path d="${d}" fill="{{primary}}" ${OUTLINE}/>`
const S = (d: string) => `<path d="${d}" fill="{{secondary}}" ${OUTLINE}/>`
const T = (d: string) => `<path d="${d}" fill="{{trim}}" ${OUTLINE}/>`
const ring = (cx: number, cy: number, r: number, fill: string) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${OUTLINE}/>`
/** A thick outlined stroke, for tails and bows. */
const cord = (d: string, width: number, color: string) => stroke(d, width + 10, LINE) + stroke(d, width, color)
/** Fingers closing over whatever the right hand holds. */
const GRIP = `<ellipse cx="730" cy="1042" rx="30" ry="22" fill="{{skin}}" ${OUTLINE}/>`

const item = (
  slot: Asset["slot"],
  id: string,
  name: string,
  colors: Asset["colors"],
  layers: Asset["layers"],
  metal = false
): Asset => ({ id, name, slot, colors, layers, metal })

/** Frame stroke for glasses. Each lens sets its own fill. */
const frame = (w = 7) => `stroke="{{primary}}" stroke-width="${w}" stroke-linejoin="round"`
const BRIDGE = stroke("M500 332 Q512 322 524 332", 6, "{{primary}}")

const glasses: Asset[] = [
  item("glasses", "glasses_round", "Round", { primary: "#c9a227" }, {
    eyewear: sym(`<circle cx="458" cy="338" r="40" fill="#bfe3ff" fill-opacity=".15" ${frame()}/>` + stroke("M418 330 L390 322", 6, "{{primary}}")) + BRIDGE,
  }, true),
  item("glasses", "glasses_square", "Square", { primary: "#18181b" }, {
    eyewear: sym(`<rect x="414" y="306" width="90" height="62" rx="10" fill="#bfe3ff" fill-opacity=".15" ${frame(8)}/>` + stroke("M414 322 L390 318", 6, "{{primary}}")) + BRIDGE,
  }),
  item("glasses", "glasses_shades", "Sunglasses", { primary: "#18181b" }, {
    eyewear: sym(`<path d="M410 314 L506 314 L500 356 C492 374 428 374 418 356 Z" fill="#15111c" fill-opacity=".88" ${frame(6)}/>`) + BRIDGE,
  }),
  item("glasses", "glasses_monocle", "Monocle", { primary: "#c9a227" }, {
    eyewear: `<circle cx="566" cy="338" r="40" fill="#bfe3ff" fill-opacity=".15" ${frame()}/>` + stroke("M602 356 Q640 440 612 540", 4, "{{primary}}"),
  }, true),
  item("glasses", "glasses_halfmoon", "Half-moon", { primary: "#c7c7d0" }, {
    eyewear: sym(`<path d="M414 336 L502 336 C500 382 416 382 414 336 Z" fill="#bfe3ff" fill-opacity=".15" ${frame(6)}/>`) + BRIDGE,
  }, true),
]

const earrings: Asset[] = [
  item("earrings", "earrings_studs", "Studs", { primary: "#e5e4e2" }, {
    ears: sym(`<circle cx="388" cy="372" r="8" fill="{{primary}}" stroke="${LINE}" stroke-width="3"/>`),
  }, true),
  item("earrings", "earrings_hoops", "Hoops", { primary: "#c9a227" }, {
    ears: sym(`<circle cx="390" cy="394" r="19" fill="none" stroke="{{primary}}" stroke-width="6"/>`),
  }, true),
  item("earrings", "earrings_drops", "Drops", { primary: "#c9a227", secondary: "#3a6ea5" }, {
    ears: sym(stroke("M388 372 L388 398", 4, "{{primary}}") + S("M388 396 C400 412 400 426 388 430 C376 426 376 412 388 396 Z")),
  }, true),
  item("earrings", "earrings_gems", "Gem dangles", { primary: "#c7c7d0", secondary: "#9f1239" }, {
    ears: sym(`<circle cx="388" cy="374" r="7" fill="{{primary}}"/>` + S("M388 388 L402 410 L388 434 L374 410 Z")),
  }, true),
  item("earrings", "earrings_moons", "Crescents", { primary: "#c7c7d0" }, {
    ears: sym(`<path d="M398 380 A19 19 0 1 0 398 418 A14 14 0 1 1 398 380 Z" fill="{{primary}}" stroke="${LINE}" stroke-width="3"/>`),
  }, true),
]

/** Points along the necklace curve, for beads. */
function beads(count: number, r: number) {
  let out = ""
  for (let i = 0; i <= count; i++) {
    const t = i / count
    const x = (1 - t) ** 2 * 462 + 2 * (1 - t) * t * 512 + t ** 2 * 562
    const y = (1 - t) ** 2 * 520 + 2 * (1 - t) * t * 620 + t ** 2 * 520
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="{{primary}}" stroke="${LINE}" stroke-width="2"/>`
  }
  return out
}
const CHAIN = stroke("M462 520 Q512 620 562 520", 5, "{{primary}}")

const necklaces: Asset[] = [
  item("necklace", "necklace_chain", "Chain", { primary: "#c9a227" }, { neck: CHAIN }, true),
  item("necklace", "necklace_pendant", "Pendant", { primary: "#c7c7d0", secondary: "#6d28d9" }, {
    neck: CHAIN + S("M512 566 L532 592 L512 624 L492 592 Z"),
  }, true),
  item("necklace", "necklace_choker", "Choker", { primary: "#18181b", secondary: "#9f1239" }, {
    neck: P("M464 494 L560 494 L562 516 L462 516 Z") + ring(512, 506, 8, "{{secondary}}"),
  }),
  item("necklace", "necklace_pearls", "Pearls", { primary: "#f4f4f5" }, { neck: beads(12, 7) }),
  item("necklace", "necklace_amulet", "Amulet", { primary: "#c9a227", secondary: "#047857" }, {
    neck: CHAIN + ring(512, 604, 28, "{{primary}}") + ring(512, 604, 13, "{{secondary}}"),
  }, true),
]

const hats: Asset[] = [
  item("hat", "hat_crown", "Crown", { primary: "#c9a227", secondary: "#9f1239" }, {
    headwear:
      P("M404 192 L396 88 L452 136 L482 64 L512 124 L542 64 L572 136 L628 88 L620 192 Z") +
      ring(512, 164, 11, "{{secondary}}") +
      ring(452, 170, 8, "{{secondary}}") +
      ring(572, 170, 8, "{{secondary}}"),
  }, true),
  item("hat", "hat_wizard", "Wizard hat", { primary: "#312e81", secondary: "#c9a227", trim: "#fcd34d" }, {
    headwear:
      `<ellipse cx="512" cy="198" rx="192" ry="32" fill="{{primary}}" ${OUTLINE}/>` +
      P("M512 6 C534 60 584 140 628 198 L396 198 C440 140 490 60 512 6 Z") +
      S("M414 172 L610 172 L624 198 L400 198 Z") +
      T("M540 90 l6 13 14 2 -10 9 3 14 -13 -7 -13 7 3 -14 -10 -9 14 -2 Z"),
  }),
  item("hat", "hat_tophat", "Top hat", { primary: "#18181b", secondary: "#9f1239" }, {
    headwear:
      `<ellipse cx="512" cy="192" rx="152" ry="24" fill="{{primary}}" ${OUTLINE}/>` +
      P("M432 30 L592 30 L596 188 L428 188 Z") +
      S("M430 146 L594 146 L595 176 L429 176 Z"),
  }),
  item("hat", "hat_beret", "Beret", { primary: "#9f1239" }, {
    headwear:
      `<ellipse cx="528" cy="178" rx="152" ry="58" transform="rotate(-8 528 178)" fill="{{primary}}" ${OUTLINE}/>` +
      ring(560, 116, 10, "{{primary}}"),
  }),
  item("hat", "hat_circlet", "Circlet", { primary: "#c7c7d0", secondary: "#3a6ea5" }, {
    headwear: stroke("M382 252 Q512 206 642 252", 10, "{{primary}}") + S("M512 206 L528 228 L512 252 L496 228 Z"),
  }, true),
]

const weapons: Asset[] = [
  item("weapon", "weapon_sword", "Sword", { primary: "#c7c7d0", secondary: "#3f2a1d", trim: "#c9a227" }, {
    hand:
      S("M720 996 L740 996 L740 1078 L720 1078 Z") +
      ring(730, 988, 14, "{{trim}}") +
      P("M716 1094 L744 1094 L746 1420 L730 1462 L714 1420 Z") +
      T("M672 1074 L788 1074 L788 1096 L672 1096 Z") +
      GRIP,
  }, true),
  item("weapon", "weapon_staff", "Staff", { primary: "#8b5cf6", secondary: "#5b3a1e", trim: "#c9a227" }, {
    hand:
      S("M722 560 L740 560 L744 1500 L726 1500 Z") +
      `<circle cx="731" cy="516" r="66" fill="{{primary}}" opacity=".22"/>` +
      ring(731, 516, 42, "{{primary}}") +
      stroke("M702 560 Q690 520 706 480 M760 560 Q772 520 756 480", 7, "{{trim}}") +
      GRIP,
  }),
  item("weapon", "weapon_bow", "Bow", { primary: "#7c2d12", trim: "#c9a227" }, {
    hand:
      stroke("M690 700 L690 1380", 3, "#e5e7eb") +
      cord("M690 700 Q800 1040 690 1380", 14, "{{primary}}") +
      T("M728 1010 L760 1010 L762 1072 L730 1072 Z") +
      GRIP,
  }),
  item("weapon", "weapon_dagger", "Dagger", { primary: "#c7c7d0", secondary: "#18181b", trim: "#c9a227" }, {
    hand:
      S("M722 1010 L738 1010 L738 1078 L722 1078 Z") +
      P("M720 1094 L740 1094 L738 1226 L730 1252 L722 1226 Z") +
      T("M696 1078 L764 1078 L764 1096 L696 1096 Z") +
      GRIP,
  }, true),
  item("weapon", "weapon_spear", "Spear", { primary: "#c7c7d0", secondary: "#5b3a1e", trim: "#9f1239" }, {
    hand:
      S("M724 420 L738 420 L742 1500 L728 1500 Z") +
      P("M731 290 L760 396 L731 438 L702 396 Z") +
      T("M720 436 L742 436 L744 470 L718 470 Z") +
      GRIP,
  }, true),
]

const special: Asset[] = [
  item("wings", "wings_feather", "Feathered", { primary: "#f4f4f5" }, {
    back: sym(
      P("M440 640 C340 520 180 420 60 470 C120 520 130 560 100 600 C170 620 180 660 140 700 C220 720 230 760 200 800 C290 810 330 780 360 760 C400 740 430 700 440 640 Z") +
        stroke("M400 640 Q260 560 120 540 M400 680 Q280 650 170 670 M410 710 Q320 730 240 770", 4, "{{primaryShade}}")
    ),
  }),
  item("wings", "wings_bat", "Bat", { primary: "#2e1065", secondary: "#18181b" }, {
    back: sym(
      P("M440 640 C360 520 220 440 80 460 C110 520 100 580 60 620 C130 610 170 640 170 700 C220 670 270 680 290 740 C320 700 370 700 400 740 C410 700 430 670 440 640 Z") +
        stroke("M436 640 L80 462 M430 650 L170 700 M432 660 L290 740", 5, "{{secondary}}")
    ),
  }),
  item("wings", "wings_fairy", "Fairy", { primary: "#7dd3fc", secondary: "#c4b5fd" }, {
    back: sym(
      `<ellipse cx="320" cy="560" rx="160" ry="92" transform="rotate(-30 320 560)" fill="{{primary}}" fill-opacity=".45" stroke="{{secondary}}" stroke-width="6"/>` +
        `<ellipse cx="352" cy="790" rx="104" ry="60" transform="rotate(25 352 790)" fill="{{primary}}" fill-opacity=".45" stroke="{{secondary}}" stroke-width="6"/>`
    ),
  }),
  item("tail", "tail_cat", "Cat", undefined, {
    back: cord("M540 990 C680 1040 770 1000 786 900 C800 820 764 780 740 760", 30, "{{hair}}"),
  }),
  item("tail", "tail_fox", "Fox", { trim: "#f4f4f5" }, {
    back:
      `<path d="M530 990 C640 1060 790 1080 846 980 C884 900 862 800 800 752 C818 840 792 900 730 920 C660 940 590 940 530 990 Z" fill="{{hair}}" ${OUTLINE}/>` +
      T("M800 752 C850 790 880 860 858 940 C840 880 826 820 800 752 Z"),
  }),
  item("tail", "tail_demon", "Demon", { primary: "#9f1239" }, {
    back: cord("M540 990 C660 1080 760 1060 796 960 C812 910 800 872 786 850", 16, "{{primary}}") + P("M786 856 C752 830 764 790 800 766 C834 790 842 830 812 856 L798 842 Z"),
  }),
  item("horns", "horns_curved", "Curved", { primary: "#3f3f46" }, {
    horns: sym(P("M430 208 C396 150 388 96 420 48 C422 108 442 150 474 190 Z") + stroke("M424 120 L440 116 M430 160 L450 152", 4, "{{primaryShade}}")),
  }),
  item("horns", "horns_nubs", "Small", { primary: "#e7e5e4" }, {
    horns: sym(P("M440 198 C430 162 438 136 456 126 C462 150 470 170 476 190 Z")),
  }),
  item("horns", "horns_ram", "Ram", { primary: "#a8a29e" }, {
    horns: sym(P("M420 230 C340 220 318 300 358 342 C388 372 432 352 422 320 C414 296 382 300 390 322 C360 290 390 250 442 262 Z")),
  }),
]

export const EXTRA_ASSETS: Asset[] = [...glasses, ...earrings, ...necklaces, ...hats, ...weapons, ...special]
