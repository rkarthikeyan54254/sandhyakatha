/**
 * The Sandhya Katha reel template is deliberately boring to edit:
 * one source of truth for layout, typography and palette.
 *
 * Story-specific metadata may select reviewed text. It may not select fonts,
 * colors, margins or arbitrary prose.
 */
export const REEL_STYLE = Object.freeze({
  id: 'sandhya-reel-v1',
  width: 1080,
  height: 1920,

  serif: 'Gentium Book Plus',
  sans: 'Karla',

  night: '#14101c',
  dusk: '#342a58',
  paper: '#f3e7d3',
  paperDim: '#c9baa4',
  gold: '#f0b458',
  goldDim: '#a97c3a',
  highlight: '#ffe9c4',
  footer: '#5d5474',

  left: 96,
  brandY: 150,
  footerY: 1742,

  hookSize: 68,
  bodySize: 58,
  sourceSize: 38,
  ctaSize: 54,
  urlSize: 34,

  holdSeconds: 3.1,
  fadeSeconds: 0.45,

  maxHookWords: 14,
  maxBodyWords: 14,
  maxSourceWords: 30,
  maxCtaWords: 12,
  maxLines: 4,
  maxSourceLines: 5,

  minBodyCards: 4,
  maxBodyCards: 6
});
