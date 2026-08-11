/* ------------------------------------------------------------------ */
/* Small WCAG contrast helpers used to keep header text/icons readable */
/* no matter which primary colour an admin picks in Settings.          */
/* ------------------------------------------------------------------ */

function hexToRgb(hex) {
  const clean = hex.replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean;
  const int = parseInt(full, 16);
  if (Number.isNaN(int) || full.length !== 6) return { r: 0, g: 0, b: 0 };
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function channelToLinear(c) {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

/** WCAG contrast ratio between two hex colours (1 to 21). */
export function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Pick the most legible text colour (white or dark ink) for a given
 * header background colour, and report whether even the best option
 * falls short of WCAG AA (4.5:1) — used to warn admins in Settings.
 */
export function getHeaderTextStyle(bgHex) {
  const WHITE = "#ffffff";
  const INK = "#14181a";
  const onWhite = contrastRatio(bgHex, WHITE);
  const onInk = contrastRatio(bgHex, INK);
  const useWhite = onWhite >= onInk;
  const bestRatio = useWhite ? onWhite : onInk;
  return {
    text: useWhite ? WHITE : INK,
    textSoft: useWhite ? "rgba(255,255,255,0.78)" : "rgba(20,24,26,0.68)",
    border: useWhite ? "rgba(255,255,255,0.3)" : "rgba(20,24,26,0.22)",
    hoverBg: useWhite ? "rgba(255,255,255,0.18)" : "rgba(20,24,26,0.10)",
    idleBg: useWhite ? "rgba(255,255,255,0.08)" : "rgba(20,24,26,0.05)",
    ratio: bestRatio,
    lowContrast: bestRatio < 4.5,
  };
}
