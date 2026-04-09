/** MathJax 3 config for item text that may include \(...\), \[...\], $...$ */

export const EXAM_MATHJAX_CONFIG = {
  loader: { load: ['[tex]/html'] },
  tex: {
    inlineMath: [
      ['\\(', '\\)'],
      ['$', '$'],
    ],
    displayMath: [
      ['\\[', '\\]'],
      ['$$', '$$'],
    ],
    processEscapes: true,
  },
  options: {
    enableMenu: false,
  },
};
