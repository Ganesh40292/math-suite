# 🌌 Math Suite

![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) ![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white) 

**[🚀 Try the Live Demo here!](https://math-suite.vercel.app/)**

A fast, visual mathematical engine built entirely in Vanilla HTML, CSS, and JavaScript.

## ✨ Features

- **Scientific Calculator**: Trigonometry (Deg/Rad), logarithms, factorials, memory slots, and constants. Safe AST parsing via `math.js` (no `eval()`).
- **Matrix Operations**: Interactive 2x2 and 3x3 grids for determinants, inverses, transposes, and matrix arithmetic.
- **Live 2D Graphing**: Plot up to 4 equations simultaneously with pan/zoom and PNG export.
- **3D Surface Plotter**: Render mathematical surfaces (e.g., `z = x^2 - y^2`) using `Three.js` with mouse orbit controls.
- **Base Converter**: Real-time conversion between Binary, Octal, Decimal, and Hexadecimal.
- **UI & UX**: Glassmorphic dark/light themes, persistent calculation history, keyboard shortcuts, and a 3D wireframe intro animation.

## 🛠️ Tech Stack

- **Core**: Vanilla HTML/CSS/JS (No bundlers)
- **Libraries**: [Three.js](https://threejs.org/) (3D), [math.js](https://mathjs.org/) (Math Engine), [function-plot](https://mauriciopoppe.github.io/function-plot/) (2D Graphs), [KaTeX](https://katex.org/) (Typesetting)

## 🏁 Getting Started

Clone and run instantly without any build steps:

```bash
git clone https://github.com/Ganesh40292/math-suite.git
cd math-suite
npx http-server ./
```

Visit `http://127.0.0.1:8080` in your browser.
