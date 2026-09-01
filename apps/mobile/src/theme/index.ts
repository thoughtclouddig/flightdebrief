/**
 * The web app's tokens, as React Native values.
 *
 * Copied deliberately rather than imported: the web tokens are CSS custom
 * properties that RN cannot read, and a build-time bridge for eleven values
 * would be more machinery than the values are worth. If they drift, this file
 * is the one place to correct.
 */
export const c = {
  canvas: "#f4f5f6",
  surface: "#ffffff",
  panel: "#142033",
  panelText: "#f7f9fb",
  panelTextSoft: "#9da7b8",
  text: "#101727",
  textSoft: "#56636f",
  textFaint: "#5f6b77",
  hairline: "#c7ccd1",
  brand: "#f07621",
  /** Navy on orange: white is 2.71:1 and fails AA. Measured, not chosen. */
  onBrand: "#142033",
  good: "#1f7a4c",
  attention: "#9a6612",
} as const;

export const s = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
