import { shaded, stroke, sym, tone, type Asset } from "../core"

// Shaded pieces in each recolourable colour. Ids must start with the slot name.
const P = (id: string, d: string, inner = "") => shaded(id, d, "primary", inner)
const S = (id: string, d: string, inner = "") => shaded(id, d, "secondary", inner)
const T = (id: string, d: string, inner = "") => shaded(id, d, "trim", inner)
const shadeOf = (d: string, base = "primary") => tone(d, `${base}Shade`)
const lightOf = (d: string, base = "primary") => tone(d, `${base}Light`, 'opacity=".55"')
const fold = (d: string, base = "primary") => stroke(d, 3, `{{${base}Deep}}`, 'opacity=".85"')
const stitch = (d: string, base = "trim") => stroke(d, 3, `{{${base}}}`, 'stroke-dasharray="9 7"')
const button = (x: number, y: number, r = 7, base = "secondary") =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="{{${base}}}" stroke="{{${base}Line}}" stroke-width="2.5"/>` +
  `<circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.32}" fill="{{${base}Light}}"/>`

const item = (
  slot: Asset["slot"],
  id: string,
  name: string,
  colors: Asset["colors"],
  layers: Asset["layers"],
  metal = false
): Asset => ({ id, name, slot, colors, layers, metal })

// ---------------------------------------------------------------- shared cuts

const SLEEVE = "M402 692 C368 698 348 730 346 778 L338 882 C334 932 332 962 332 994 L394 1000 C396 952 400 908 404 872 L416 780 C420 752 426 732 438 716 Z"
const SLEEVE_SHADE = "M392 694 L452 694 L410 1006 L376 1006 Z"
const SLEEVE_FOLDS = (base = "primary") => fold("M350 842 Q372 852 400 844", base) + fold("M342 922 Q366 932 398 924", base)
const CUFF = "M328 966 L398 972 L396 1008 L326 1002 Z"
const SHIRT = "M470 662 Q512 690 554 662 C580 676 608 688 634 700 C652 712 656 732 650 758 L626 858 C618 878 612 900 612 920 C626 952 634 984 632 1030 L392 1030 C390 984 398 952 412 920 C412 900 406 878 398 858 L374 758 C368 732 372 712 390 700 C416 688 444 676 470 662 Z"
const SHIRT_SHADE = "M592 660 C640 760 596 900 644 1040 L720 1040 L720 660 Z"
const SHIRT_FOLDS = (base = "primary") =>
  fold("M424 764 Q452 806 442 864", base) + fold("M600 764 Q574 806 584 864", base) + fold("M468 972 Q500 990 544 978", base)

const COAT_SLEEVE = "M400 686 C360 692 340 728 338 780 L328 884 C324 934 322 964 322 996 L400 1002 C402 954 406 908 410 872 L422 782 C426 752 432 732 444 714 Z"

// ---------------------------------------------------------------- tops

const TUNIC = "M470 662 Q512 690 554 662 C580 676 608 688 634 700 C652 712 656 732 650 758 L626 858 C618 878 612 900 612 920 C630 960 646 1020 650 1100 L574 1100 L556 1044 L512 1062 L468 1044 L450 1100 L374 1100 C378 1020 394 960 412 920 C412 900 406 878 398 858 L374 758 C368 732 372 712 390 700 C416 688 444 676 470 662 Z"
const PUFF = "M404 688 C354 688 328 730 334 788 C338 820 366 836 398 828 C410 790 422 752 442 716 Z"
const FOREARM = "M348 812 L338 902 C334 942 332 966 332 994 L394 1000 C396 956 400 912 404 876 L412 822 Z"

const zigzag = (x0: number, x1: number, y: number, h: number) => {
  let d = `M${x0} ${y}`
  for (let x = x0, up = true; x < x1; x += 18, up = !up) d += ` L${x + 18} ${up ? y - h : y}`
  return d
}

const TOPS: Asset[] = [
  item("top", "top_shirt", "Button-up shirt", { primary: "#16141c", secondary: "#e8e4dc" }, {
    torso:
      sym(
        P("top-sleeve", SLEEVE, shadeOf(SLEEVE_SHADE) + SLEEVE_FOLDS()) +
          P("top-cuff", CUFF, shadeOf("M372 960 L402 960 L402 1012 L362 1012 Z")) +
          button(378, 988, 5)
      ) +
      P("top-body", SHIRT, shadeOf(SHIRT_SHADE) + lightOf("M418 704 C440 692 468 686 480 692 L432 830 C414 790 408 742 418 704 Z") + SHIRT_FOLDS()) +
      stroke("M512 700 L512 1028", 3, "{{primaryLine}}") +
      [752, 832, 912, 992].map((y) => button(526, y, 6)).join("") +
      sym(P("top-collar", "M468 654 L512 700 L494 750 L442 680 Z", shadeOf("M470 700 L514 700 L500 752 Z"))),
  }),
  item("top", "top_blouse", "Puff-sleeve blouse", { primary: "#f2efe8", secondary: "#8f1d2c", trim: "#d4af37" }, {
    torso:
      sym(
        P("top-forearm", FOREARM, shadeOf(SLEEVE_SHADE)) +
          P("top-puff", PUFF, shadeOf("M396 690 L452 690 L402 840 L372 840 Z") + fold("M350 760 Q370 790 398 800") + fold("M366 712 Q384 760 400 780")) +
          S("top-ruffle", "M322 986 Q338 1016 360 1000 Q380 1018 402 1002 L398 976 L326 970 Z")
      ) +
      P("top-body", SHIRT, shadeOf(SHIRT_SHADE) + SHIRT_FOLDS()) +
      P(
        "top-jabot",
        "M486 672 Q468 700 494 714 Q468 738 496 752 Q474 778 502 790 L522 790 Q550 778 528 752 Q556 738 530 714 Q556 700 538 672 Z",
        shadeOf("M512 660 L560 660 L560 800 L512 800 Z") + fold("M492 714 Q512 722 532 714") + fold("M496 752 Q512 760 528 752")
      ) +
      S("top-bow-l", "M512 676 L474 656 L470 694 Z") +
      S("top-bow-r", "M512 676 L550 656 L554 694 Z") +
      `<circle cx="512" cy="676" r="9" fill="{{trim}}" stroke="{{trimLine}}" stroke-width="2.5"/>`,
  }),
  item("top", "top_tunic", "Traveller's tunic", { primary: "#3f5d3a", secondary: "#d9c3a0", trim: "#8f1d2c" }, {
    torso:
      sym(
        P("top-sleeve", SLEEVE, shadeOf(SLEEVE_SHADE) + SLEEVE_FOLDS()) +
          S("top-cuff", CUFF, shadeOf("M372 960 L402 960 L402 1012 L362 1012 Z", "secondary"))
      ) +
      P(
        "top-body",
        TUNIC,
        shadeOf(SHIRT_SHADE) +
          SHIRT_FOLDS() +
          tone("M350 1052 L680 1052 L680 1110 L350 1110 Z", "secondary") +
          stroke(zigzag(356, 670, 1086, 16), 4, "{{trim}}")
      ) +
      `<path d="M488 668 L512 764 L536 668 Q512 684 488 668 Z" fill="{{skin}}" stroke="{{primaryLine}}" stroke-width="3.5" stroke-linejoin="round"/>` +
      stroke("M494 690 L530 712 M530 690 L494 712 M500 718 L524 736 M524 718 L500 736", 3, "{{trim}}"),
  }),
  item("top", "top_turtleneck", "Fitted turtleneck", { primary: "#2f3440" }, {
    torso:
      sym(
        P("top-sleeve", SLEEVE, shadeOf(SLEEVE_SHADE) + SLEEVE_FOLDS()) +
          P("top-cuff", CUFF, shadeOf("M372 960 L402 960 L402 1012 L362 1012 Z") + stroke("M344 972 L342 1002 M360 974 L358 1004 M376 975 L374 1006", 2.5, "{{primaryDeep}}"))
      ) +
      P("top-body", SHIRT, shadeOf(SHIRT_SHADE) + SHIRT_FOLDS() + tone("M370 996 L660 996 L660 1040 L370 1040 Z", "primaryShade")) +
      P(
        "top-neck",
        "M476 596 L548 596 L558 680 Q512 704 466 680 Z",
        shadeOf("M520 590 L570 590 L570 700 L520 700 Z") +
          fold("M474 624 Q512 636 550 624") +
          fold("M470 654 Q512 668 554 654")
      ),
  }),
]

// ---------------------------------------------------------------- vests and armour

const CORSET = "M418 772 Q466 752 512 776 Q558 752 606 772 L612 866 C606 896 600 918 606 948 L620 1016 Q512 1046 404 1016 L418 948 C424 918 418 896 412 866 Z"
const JERKIN = "M444 676 L500 716 L498 1062 L400 1062 C396 1010 402 960 414 920 C414 898 408 878 400 858 L378 764 C372 736 376 714 392 702 C408 692 426 684 444 676 Z"
const BREASTPLATE = "M404 736 C432 708 470 700 512 704 C554 700 592 708 620 736 L614 880 C598 940 560 972 512 980 C464 972 426 940 410 880 Z"

const VESTS: Asset[] = [
  item("vest", "vest_corset", "Laced corset", { primary: "#8f1d2c", secondary: "#16141c", trim: "#d4af37" }, {
    vest:
      P(
        "vest-corset",
        CORSET,
        shadeOf("M568 750 L660 750 L660 1060 L556 1060 C590 950 580 850 568 750 Z") +
          lightOf("M430 790 C440 780 456 776 466 780 L452 1010 L426 1004 C432 930 428 850 430 790 Z") +
          fold("M454 786 L448 1022") +
          fold("M570 786 L576 1022") +
          tone("M494 766 L530 766 L530 1046 L494 1046 Z", "secondary")
      ) +
      stroke("M494 800 L530 830 L494 860 L530 890 L494 920 L530 950 L494 980 L530 1010", 3.5, "{{trim}}") +
      stroke("M418 772 Q466 752 512 776 Q558 752 606 772", 7, "{{trim}}") +
      stroke("M404 1016 Q512 1046 620 1016", 6, "{{trim}}"),
  }),
  item("vest", "vest_jerkin", "Leather jerkin", { primary: "#6b4a32", secondary: "#3b2a22", trim: "#d9c3a0" }, {
    vest:
      sym(
        P("vest-panel", JERKIN, shadeOf("M470 700 L520 700 L520 1070 L466 1070 Z") + fold("M420 800 Q440 880 430 960")) +
          stitch("M490 728 L488 1052") +
          stitch("M392 714 C404 760 410 800 404 860") +
          S("vest-collar", "M444 676 L500 716 L488 744 L430 692 Z")
      ) +
      [820, 930].map((y) =>
        S(`vest-strap-${y}`, `M466 ${y} L558 ${y} L558 ${y + 22} L466 ${y + 22} Z`) +
          `<rect x="500" y="${y - 6}" width="24" height="34" rx="3" fill="none" stroke="{{trim}}" stroke-width="5"/>`
      ).join(""),
  }),
  item("vest", "vest_cuirass", "Plate cuirass", { primary: "#c9ccd6", secondary: "#6b4a32", trim: "#d4af37" }, {
    vest:
      [2, 1, 0]
        .map((i) =>
          P(
            `vest-fauld-${i}`,
            `M${414 - i * 8} ${958 + i * 34} L${610 + i * 8} ${958 + i * 34} L${618 + i * 8} ${998 + i * 34} L${406 - i * 8} ${998 + i * 34} Z`,
            shadeOf(`M540 940 L700 940 L700 1100 L540 1100 Z`) + stroke(`M${420 - i * 8} ${990 + i * 34} L${604 + i * 8} ${990 + i * 34}`, 3, "{{trim}}")
          )
        )
        .join("") +
      sym(S("vest-strap", "M394 780 L420 780 L426 870 L402 870 Z")) +
      P(
        "vest-plate",
        BREASTPLATE,
        shadeOf("M540 700 L640 700 L640 990 L540 990 C580 900 570 780 540 700 Z") +
          lightOf("M438 740 C456 726 474 722 486 724 L470 930 C446 900 432 820 438 740 Z") +
          fold("M512 712 L512 974") +
          fold("M420 840 Q512 878 604 840")
      ) +
      stroke("M404 736 C432 708 470 700 512 704 C554 700 592 708 620 736", 7, "{{trim}}") +
      sym(
        P("vest-pauldron-2", "M346 742 C338 716 400 704 428 730 C436 758 426 792 400 802 C372 810 342 792 338 768 Z", shadeOf("M400 700 L460 700 L420 820 L380 820 Z")) +
          P("vest-pauldron-1", "M358 704 C350 672 408 658 440 686 C452 710 444 752 420 766 C390 780 356 760 350 736 Z", shadeOf("M410 660 L470 660 L430 780 L400 780 Z") + lightOf("M372 696 C384 682 404 678 414 682 L394 740 C378 730 368 712 372 696 Z")) +
          `<circle cx="398" cy="700" r="6" fill="{{trim}}"/><circle cx="384" cy="752" r="5" fill="{{trim}}"/>`
      ),
  }, true),
]

// ---------------------------------------------------------------- belts

const BELTS: Asset[] = [
  item("belt", "belt_leather", "Belt and pouch", { primary: "#3b2a22", secondary: "#6b4a32", trim: "#d4af37" }, {
    waist:
      P("belt-band", "M400 944 Q512 972 624 944 L628 982 Q512 1012 396 982 Z", shadeOf("M560 930 L660 930 L660 1020 L560 1020 Z")) +
      `<path d="M490 950 L534 950 L534 1002 L490 1002 Z M502 962 L502 990 L522 990 L522 962 Z" fill="{{trim}}" fill-rule="evenodd" stroke="{{trimLine}}" stroke-width="3"/>` +
      S("belt-pouch", "M394 980 L454 988 L458 1066 C442 1080 410 1080 394 1066 Z", shadeOf("M430 980 L470 980 L470 1090 L430 1090 Z", "secondary")) +
      P("belt-flap", "M390 976 L456 984 L454 1020 Q424 1036 392 1016 Z") +
      `<circle cx="424" cy="1014" r="6" fill="{{trim}}" stroke="{{trimLine}}" stroke-width="2"/>`,
  }),
  item("belt", "belt_sash", "Silk sash", { primary: "#c2334a", secondary: "#d4af37" }, {
    waist:
      P("belt-wrap", "M404 900 Q512 930 620 900 L624 972 Q512 1006 400 972 Z", shadeOf("M560 890 L660 890 L660 1010 L560 1010 Z") + fold("M440 920 Q480 950 520 930") + fold("M500 960 Q560 980 600 950")) +
      P("belt-tail-2", "M440 964 L456 1110 L476 1094 L494 1112 L464 960 Z", shadeOf("M456 960 L500 960 L500 1120 L462 1120 Z")) +
      P("belt-tail-1", "M418 958 L372 1140 L402 1124 L424 1150 L446 962 Z", shadeOf("M420 960 L460 960 L420 1160 L396 1160 Z")) +
      stroke("M376 1136 L402 1124 L424 1146 M458 1106 L476 1094 L492 1108", 5, "{{secondary}}") +
      `<ellipse cx="432" cy="956" rx="30" ry="24" fill="{{primary}}" stroke="{{primaryLine}}" stroke-width="4"/>` +
      fold("M414 950 Q432 966 450 952"),
  }),
]

// ---------------------------------------------------------------- coats and cloaks

const COAT_PANEL = "M450 672 L504 764 L492 1300 C440 1314 376 1306 322 1290 C336 1150 358 1030 386 930 C398 890 396 862 388 842 L368 762 C362 734 366 712 382 702 C402 690 428 680 450 672 Z"
const CLOAK_BACK = "M390 688 C300 800 240 1100 216 1452 Q364 1488 512 1472 Q660 1488 808 1452 C784 1100 724 800 634 688 Z"
const JACKET = "M452 676 L500 740 L500 932 L394 938 C392 912 398 892 404 872 L376 762 C370 734 374 712 390 702 C410 690 432 682 452 676 Z"

const COATS: Asset[] = [
  item("coat", "coat_noble", "Noble long coat", { primary: "#1f2f6b", secondary: "#f2efe8", trim: "#d4af37" }, {
    outer: sym(
      P("coat-panel", COAT_PANEL, shadeOf("M438 760 L504 760 L494 1320 L430 1320 Z") + fold("M400 960 C392 1080 380 1180 370 1296") + fold("M450 900 C446 1040 440 1180 436 1300") + lightOf("M384 710 C402 698 424 690 440 690 L396 860 C380 820 372 760 384 710 Z")) +
        stroke("M504 764 L492 1300 C440 1314 376 1306 322 1290", 9, "{{trim}}") +
        S("coat-lapel", "M450 672 L504 764 L486 832 L426 700 Z", shadeOf("M470 720 L510 760 L490 840 Z", "secondary")) +
        P("coat-sleeve", COAT_SLEEVE, shadeOf("M394 690 L456 690 L412 1010 L378 1010 Z") + SLEEVE_FOLDS()) +
        S("coat-cuff", "M316 948 L406 954 L404 1012 L314 1006 Z", shadeOf("M370 940 L410 940 L410 1020 L364 1020 Z", "secondary")) +
        stroke("M316 948 L406 954", 6, "{{trim}}") +
        button(340, 980, 6, "trim") +
        button(372, 983, 6, "trim") +
        T("coat-epaulette", "M370 706 C390 686 432 680 452 690 L442 718 C414 714 392 718 378 730 Z") +
        stroke("M378 730 L372 762 M392 724 L388 758 M408 720 L406 754", 3, "{{trim}}") +
        [860, 940, 1020, 1100].map((y) => button(480, y, 7, "trim")).join("")
    ),
  }),
  item("coat", "coat_cloak", "Travelling cloak", { primary: "#16141c", secondary: "#6b3fa0", trim: "#c9ccd6" }, {
    back:
      S("coat-lining", CLOAK_BACK, shadeOf("M420 700 L604 700 L640 1480 L384 1480 Z", "secondary") + fold("M440 900 C420 1100 400 1300 390 1470", "secondary") + fold("M584 900 C604 1100 624 1300 634 1470", "secondary")) +
      sym(P("coat-edge", "M390 688 C300 800 240 1100 216 1452 L262 1460 C288 1100 336 822 426 700 Z", shadeOf("M300 800 L360 800 L300 1470 L240 1470 Z"))),
    outer:
      sym(P("coat-mantle", "M382 692 C414 672 462 664 492 670 L482 730 C448 782 402 814 348 830 C338 780 348 718 382 692 Z", shadeOf("M440 680 L500 680 L480 740 L420 790 Z") + fold("M372 760 Q400 760 436 740"))) +
      stroke("M470 722 Q512 760 554 722", 5, "{{trim}}") +
      sym(`<circle cx="468" cy="716" r="15" fill="{{trim}}" stroke="{{trimLine}}" stroke-width="3"/><circle cx="468" cy="716" r="6" fill="{{secondary}}"/>`),
  }),
  item("coat", "coat_jacket", "Cropped jacket", { primary: "#8f1d2c", secondary: "#16141c", trim: "#c9ccd6" }, {
    outer:
      sym(
        P("coat-sleeve", COAT_SLEEVE, shadeOf("M394 690 L456 690 L412 1010 L378 1010 Z") + SLEEVE_FOLDS() + fold("M334 960 Q364 972 400 964")) +
          S("coat-cuff", "M320 972 L402 978 L400 1010 L318 1004 Z", stroke("M334 976 L332 1004 M352 977 L350 1006 M370 978 L368 1008 M388 979 L386 1008", 2.5, "{{secondaryLight}}")) +
          P("coat-panel", JACKET, shadeOf("M456 700 L506 700 L506 940 L452 940 Z") + fold("M410 800 Q430 850 420 900")) +
          S("coat-hem", "M390 906 L502 910 L502 942 L388 938 Z", stroke("M404 912 L404 936 M424 912 L424 938 M444 912 L444 938 M464 912 L464 938 M484 912 L484 938", 2.5, "{{secondaryLight}}")) +
          S("coat-collar", "M450 666 C428 656 400 668 392 690 L468 764 L502 740 Z", shadeOf("M440 690 L500 740 L470 764 Z", "secondary")) +
          stroke("M420 826 L468 830", 3, "{{primaryDeep}}")
      ) + stroke("M512 744 L512 940", 4, "{{trim}}", 'stroke-dasharray="5 5"'),
  }),
]

// ---------------------------------------------------------------- bottoms

const PANT = "M400 980 L512 980 L512 1050 C508 1112 504 1172 500 1232 C498 1302 498 1372 500 1432 L450 1432 C446 1372 440 1302 434 1242 C424 1172 406 1102 398 1040 Z"
const FLARE = "M400 980 L512 980 L512 1050 C508 1112 504 1172 500 1222 C506 1300 520 1380 532 1446 L410 1446 C420 1380 434 1300 440 1236 C428 1172 408 1102 398 1040 Z"
const WAISTBAND = "M394 964 L630 964 L634 1004 L390 1004 Z"

/** A small five-dot flower for printed fabric. */
const printFlower = (x: number, y: number) =>
  [0, 72, 144, 216, 288]
    .map((a) => {
      const r = (a * Math.PI) / 180
      return `<circle cx="${(x + Math.cos(r) * 9).toFixed(1)}" cy="${(y + Math.sin(r) * 9).toFixed(1)}" r="6" fill="{{secondary}}"/>`
    })
    .join("") + `<circle cx="${x}" cy="${y}" r="4" fill="{{primaryDeep}}"/>`

const BOTTOMS: Asset[] = [
  item("bottom", "bottom_trousers", "Tailored trousers", { primary: "#2f3440", secondary: "#16141c" }, {
    legs:
      sym(P("bottom-leg", PANT, shadeOf("M478 980 L526 980 L508 1446 L480 1446 Z") + fold("M456 1064 C458 1200 470 1320 474 1430") + fold("M440 1230 Q468 1244 496 1236"))) +
      S("bottom-waist", WAISTBAND) +
      stroke("M512 1004 L512 1066", 3, "{{primaryLine}}"),
  }),
  item("bottom", "bottom_flared", "Printed flares", { primary: "#5b6472", secondary: "#f2efe8" }, {
    legs:
      sym(
        P(
          "bottom-leg",
          FLARE,
          shadeOf("M478 980 L526 980 L540 1456 L490 1456 Z") +
            [[448, 1096], [432, 1196], [476, 1290], [446, 1380], [500, 1360], [466, 1160]].map(([x, y]) => printFlower(x, y)).join("") +
            stroke("M440 1110 C420 1170 470 1230 450 1300 C436 1350 480 1380 470 1440", 3, "{{secondary}}", 'opacity=".7"')
        )
      ) + S("bottom-waist", WAISTBAND),
  }),
  item("bottom", "bottom_ruffle", "Tiered ruffle skirt", { primary: "#16141c", secondary: "#8f1d2c", trim: "#f2efe8" }, {
    legs:
      S(
        "bottom-tier2",
        "M384 1040 L640 1040 L702 1210 Q672 1232 642 1212 Q608 1236 578 1214 Q546 1238 512 1216 Q478 1238 446 1214 Q416 1236 382 1212 Q352 1232 322 1210 Z",
        shadeOf("M560 1030 L720 1030 L720 1240 L600 1240 Z", "secondary") + fold("M430 1080 L400 1200", "secondary") + fold("M594 1080 L624 1200", "secondary") + fold("M512 1080 L512 1200", "secondary")
      ) +
      stroke("M330 1204 Q352 1226 382 1206 Q416 1230 446 1208 Q478 1232 512 1210 Q546 1232 578 1208 Q608 1230 642 1206 Q672 1226 694 1204", 4, "{{trim}}", 'stroke-dasharray="2 8"') +
      P(
        "bottom-tier1",
        "M402 966 L622 966 L664 1116 Q638 1136 612 1118 Q584 1140 558 1120 Q532 1142 512 1122 Q492 1142 466 1120 Q440 1140 412 1118 Q386 1136 360 1116 Z",
        shadeOf("M560 950 L680 950 L680 1140 L580 1140 Z") + fold("M440 1000 L420 1110") + fold("M584 1000 L604 1110") + fold("M512 1000 L512 1116")
      ) +
      stroke("M366 1112 Q388 1130 412 1114 Q440 1134 466 1116 Q492 1136 512 1118 Q532 1136 558 1116 Q584 1134 612 1114 Q638 1130 658 1112", 4, "{{trim}}", 'stroke-dasharray="2 8"') +
      S("bottom-waist", "M396 956 L628 956 L630 990 L394 990 Z"),
  }),
]

// ---------------------------------------------------------------- dresses

const FLEUR = (x: number, y: number) =>
  `<path d="M${x} ${y} C${x - 12} ${y - 30} ${x + 4} ${y - 50} ${x} ${y - 70} C${x + 18} ${y - 50} ${x + 16} ${y - 26} ${x} ${y} Z" fill="{{trim}}"/>` +
  stroke(`M${x - 4} ${y - 10} C${x - 30} ${y - 16} ${x - 34} ${y - 40} ${x - 20} ${y - 52} M${x + 4} ${y - 10} C${x + 30} ${y - 16} ${x + 34} ${y - 40} ${x + 20} ${y - 52}`, 4, "{{trim}}")

const DRESSES: Asset[] = [
  item("dress", "dress_royal", "Draped royal gown", { primary: "#8f1d2c", secondary: "#5a1220", trim: "#d4af37" }, {
    torso:
      S(
        "dress-under",
        "M408 930 C360 1060 300 1260 250 1472 L774 1472 C724 1260 664 1060 616 930 Z",
        shadeOf("M560 920 L800 920 L800 1480 L600 1480 Z", "secondary") + fold("M560 1000 C590 1160 640 1320 690 1466", "secondary") + fold("M470 1000 C450 1160 420 1320 400 1466", "secondary")
      ) +
      stroke("M254 1462 L770 1462", 10, "{{trim}}") +
      P(
        "dress-drape",
        "M412 930 L616 930 C640 1000 652 1060 642 1120 C604 1220 566 1330 546 1446 Q474 1470 404 1452 Q342 1472 282 1452 C322 1262 372 1082 412 930 Z",
        shadeOf("M520 930 L660 930 L620 1200 L560 1460 L500 1460 C520 1300 560 1120 520 930 Z") +
          fold("M470 980 C450 1120 420 1280 400 1440") +
          fold("M400 1000 C380 1140 350 1300 330 1446") +
          FLEUR(330, 1430) + FLEUR(410, 1440) + FLEUR(490, 1432)
      ) +
      stroke("M616 930 C640 1000 652 1060 642 1120 C604 1220 566 1330 546 1446", 10, "{{trim}}") +
      stroke("M286 1448 Q342 1468 404 1450 Q474 1466 544 1444", 10, "{{trim}}") +
      sym(P("dress-sleeve", "M368 734 C370 704 418 698 448 722 C448 760 414 792 370 792 C352 778 354 752 368 734 Z", shadeOf("M410 700 L460 700 L430 800 L390 800 Z") + fold("M380 750 Q400 770 430 760"))) +
      sym(stroke("M370 790 C390 794 420 780 440 756", 6, "{{trim}}")) +
      P(
        "dress-bodice",
        "M414 776 C440 756 480 764 512 786 C544 764 584 756 610 776 L604 868 C598 898 594 918 602 948 L422 948 C430 918 426 898 420 868 Z",
        shadeOf("M560 760 L640 760 L640 960 L570 960 C590 900 580 820 560 760 Z") +
          lightOf("M432 790 C446 780 462 778 470 782 L456 940 L432 940 C438 890 434 830 432 790 Z") +
          stroke("M470 820 C490 800 512 830 512 850 C512 830 534 800 554 820", 3, "{{primaryDeep}}")
      ) +
      stroke("M414 776 C440 756 480 764 512 786 C544 764 584 756 610 776", 7, "{{trim}}") +
      T("dress-waist", "M418 916 L606 916 L604 950 L420 950 Z") +
      `<path d="M512 906 L530 932 L512 958 L494 932 Z" fill="#3fb6c8" stroke="{{trimLine}}" stroke-width="3"/><path d="M506 922 L512 914 L518 924 Z" fill="#dff8fb"/>`,
  }),
  item("dress", "dress_robe", "Mage's robe", { primary: "#1f2f6b", secondary: "#16141c", trim: "#d4af37" }, {
    torso:
      sym(
        P("dress-sleeve", "M400 688 C360 696 340 760 332 840 L282 1090 C326 1112 386 1110 414 1088 L406 872 L418 782 C422 752 428 732 440 714 Z", shadeOf("M390 690 L452 690 L420 1100 L370 1100 Z") + fold("M340 900 C320 980 310 1040 300 1090") + fold("M380 880 C372 960 372 1040 376 1100")) +
          `<ellipse cx="348" cy="1096" rx="62" ry="14" fill="{{secondary}}"/>` +
          stroke("M284 1090 C326 1112 386 1110 414 1088", 8, "{{trim}}")
      ) +
      P(
        "dress-body",
        "M470 662 Q512 690 554 662 C580 676 608 688 634 700 C652 712 656 732 650 758 L630 860 C640 1000 690 1250 720 1470 L304 1470 C334 1250 384 1000 394 860 L374 758 C368 732 372 712 390 700 C416 688 444 676 470 662 Z",
        shadeOf("M592 660 C640 800 620 1000 700 1480 L760 1480 L760 660 Z") + fold("M420 1000 C400 1180 370 1340 350 1460") + fold("M604 1000 C624 1180 654 1340 674 1460")
      ) +
      S("dress-panel", "M486 700 L538 700 L572 1470 L452 1470 Z", shadeOf("M520 700 L580 700 L600 1480 L530 1480 Z", "secondary")) +
      stroke("M486 700 L452 1470 M538 700 L572 1470", 6, "{{trim}}") +
      stroke("M308 1458 L716 1458", 8, "{{trim}}") +
      stroke("M500 900 L524 920 L500 940 M524 900 L524 940 M498 1040 L526 1040 M512 1026 L512 1070 M500 1180 L524 1206 L500 1232 M494 1320 L530 1320 L512 1356 Z", 4, "{{trim}}") +
      S("dress-collar", "M460 636 L564 636 L576 700 Q512 726 448 700 Z", shadeOf("M520 630 L590 630 L590 720 L520 720 Z", "secondary")) +
      stroke("M448 700 Q512 726 576 700", 6, "{{trim}}"),
  }),
]

// ---------------------------------------------------------------- gloves

const GLOVES: Asset[] = [
  item("gloves", "gloves_fingerless", "Fingerless gloves", { primary: "#16141c", trim: "#c9ccd6" }, {
    gloves: sym(
      P("gloves-hand", "M342 948 L394 952 C400 988 400 1018 394 1040 C382 1054 352 1054 336 1042 C330 1010 332 980 342 948 Z", shadeOf("M372 940 L404 940 L404 1060 L366 1060 Z")) +
        stroke("M338 972 L396 976", 5, "{{trim}}") +
        `<circle cx="380" cy="974" r="4" fill="{{trim}}"/>`
    ),
  }),
  item("gloves", "gloves_gauntlet", "Plate gauntlets", { primary: "#c9ccd6", secondary: "#6b4a32", trim: "#d4af37" }, {
    gloves: sym(
      P("gloves-cuff", "M324 898 L402 904 L398 1000 L334 996 Z", shadeOf("M372 890 L410 890 L410 1010 L366 1010 Z") + lightOf("M338 910 L352 910 L350 990 L342 990 Z")) +
        stroke("M324 898 L402 904", 6, "{{trim}}") +
        P("gloves-plate", "M336 994 C328 1020 330 1048 342 1062 C354 1076 380 1074 390 1056 C398 1038 398 1014 396 996 Z", shadeOf("M372 990 L404 990 L404 1080 L366 1080 Z") + fold("M338 1022 Q364 1030 394 1024") + fold("M340 1044 Q364 1052 390 1046"))
    ),
  }, true),
]

// ---------------------------------------------------------------- shoes

const BOOT = "M440 1196 L506 1196 L500 1420 C502 1440 500 1458 494 1474 C470 1488 430 1490 414 1478 C404 1466 418 1450 438 1442 C446 1432 446 1418 444 1400 Z"
const SOLE = "M408 1468 C430 1486 474 1488 500 1472 L500 1492 L408 1492 Z"
const LOW_SHOE = "M452 1418 L500 1418 C502 1440 500 1458 494 1474 C470 1488 430 1490 414 1478 C404 1466 418 1450 440 1442 C448 1436 452 1428 452 1418 Z"

const SHOES: Asset[] = [
  item("shoes", "shoes_tall", "Tall boots", { primary: "#16141c", secondary: "#3b2a22", trim: "#c9ccd6" }, {
    feet: sym(
      P("shoes-boot", BOOT, shadeOf("M478 1190 L512 1190 L506 1490 L476 1490 Z") + lightOf("M450 1250 L462 1250 L458 1420 L448 1420 Z") + fold("M446 1320 Q474 1330 500 1322")) +
        S("shoes-fold", "M434 1188 L512 1188 L508 1236 L438 1236 Z") +
        S("shoes-sole", SOLE) +
        stroke("M444 1368 L502 1374", 6, "{{trim}}") +
        `<rect x="464" y="1360" width="16" height="20" rx="2" fill="none" stroke="{{trim}}" stroke-width="4"/>`
    ),
  }),
  item("shoes", "shoes_ankle", "Laced ankle boots", { primary: "#6b4a32", secondary: "#2a1d15", trim: "#d9c3a0" }, {
    feet: sym(
      P("shoes-boot", "M448 1340 L502 1340 L500 1420 C502 1440 500 1458 494 1474 C470 1488 430 1490 414 1478 C404 1466 418 1450 438 1442 C446 1432 448 1418 448 1400 Z", shadeOf("M478 1336 L512 1336 L506 1490 L476 1490 Z")) +
        S("shoes-sole", SOLE) +
        stroke("M456 1356 L494 1374 M494 1356 L456 1374 M456 1382 L494 1400 M494 1382 L456 1400", 3, "{{trim}}")
    ),
  }),
  item("shoes", "shoes_maryjane", "Mary Janes", { primary: "#16141c", secondary: "#f2efe8", trim: "#d4af37" }, {
    feet: sym(
      S("shoes-sock", "M450 1296 L500 1296 L498 1434 L454 1434 Z", shadeOf("M480 1290 L510 1290 L506 1440 L478 1440 Z", "secondary")) +
        stroke("M448 1300 Q462 1290 474 1300 Q488 1290 502 1300", 5, "{{secondary}}") +
        P("shoes-shoe", LOW_SHOE, shadeOf("M470 1420 L510 1420 L506 1492 L466 1492 Z") + lightOf("M424 1456 L446 1450 L440 1462 Z")) +
        stroke("M446 1440 L500 1432", 5, "{{primaryLine}}") +
        `<circle cx="472" cy="1437" r="5" fill="{{trim}}"/>`
    ),
  }),
  item("shoes", "shoes_greaves", "Armoured greaves", { primary: "#c9ccd6", secondary: "#2f3440", trim: "#d4af37" }, {
    feet: sym(
      P("shoes-shin", "M434 1180 C458 1168 492 1168 512 1180 L504 1404 L444 1404 Z", shadeOf("M480 1170 L520 1170 L510 1410 L476 1410 Z") + lightOf("M446 1200 L458 1200 L456 1390 L450 1390 Z")) +
        P("shoes-sabaton", "M444 1396 L504 1396 C506 1436 502 1460 496 1476 C470 1490 430 1492 412 1480 C402 1466 418 1450 440 1440 Z", shadeOf("M476 1390 L512 1390 L508 1496 L472 1496 Z") + fold("M430 1452 Q460 1444 500 1446") + fold("M446 1420 Q474 1416 504 1420")) +
        `<ellipse cx="474" cy="1196" rx="36" ry="28" fill="{{primary}}" stroke="{{primaryLine}}" stroke-width="4"/>` +
        `<circle cx="474" cy="1196" r="8" fill="{{trim}}" stroke="{{trimLine}}" stroke-width="2"/>`
    ),
  }, true),
]

export const CLOTHING_ASSETS: Asset[] = [...TOPS, ...VESTS, ...BELTS, ...COATS, ...BOTTOMS, ...DRESSES, ...GLOVES, ...SHOES]
