# 🌌 Ultra-Advanced 3D Math Suite

![Math Suite Banner](https://img.shields.io/badge/Status-Active-success?style=for-the-badge) ![Vanilla JS](https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) ![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white) 

A premium, cinematic mathematical engine built entirely in Vanilla HTML, CSS, and JavaScript. This project goes far beyond a simple calculator by integrating 3D visualizations, secure expression evaluation, live graphing, and a breathtaking glassmorphic UI.

## ✨ Core Features

| Feature | Description |
|---------|-------------|
| 🧮 **Scientific Calculator** | Full support for trigonometric functions (with precise Deg/Rad switching), logarithms, roots, factorials, memory slots (MC/MR/M+/M-), and constants (π, e, φ). |
| ▦ **Matrix Operations** | Interactive 2x2 and 3x3 grid inputs. Calculate determinants, inverses, transposes, cross products, and matrix arithmetic (A+B, A×B) instantly. |
| 📈 **Live 2D Graphing** | Plot up to 4 simultaneous algebraic equations on an interactive Cartesian plane with pan/zoom. Includes a 1-click **PNG Export** utility. |
| 🧊 **3D Surface Plotter** | Harnesses **Three.js** to render complex mathematical surfaces (e.g. `z = x^2 - y^2`) with height-mapped gradient colors and mouse/touch orbit controls. |
| ⟁ **Base Converter** | Real-time conversion between Binary, Octal, Decimal, and Hexadecimal. Features strict, per-base input validation. |

## 🚀 Advanced Upgrades

- **Dynamic 3D Intro**: A cinematic, glowing wireframe Torus Knot interlocking with an Icosahedron that greets the user upon launch, gracefully dissolving into a subtle ambient background.
- **Light / Dark Mode**: A smooth, CSS variable-driven theme engine toggled via the floating ☀️/🌙 button.
- **Persistent History**: A slide-out drawer saves your recent calculations to `localStorage`. Click any entry to re-use it, or copy the result to your clipboard.
- **Keyboard Shortcuts**: Complete desktop keyboard support. Press `?` to open a modal detailing all shortcuts.

## 🛡️ Security & Precision

- **Zero `eval()`**: Mathematical expressions are parsed securely using an Abstract Syntax Tree (AST) via `math.js`.
- **Floating-Point Fixes**: Handles JavaScript's notorious precision issues natively (e.g., `0.1 + 0.2 = 0.3`) using custom epsilon-rounding (1e-12).

## 🛠️ Tech Stack

No heavy frameworks, no bundlers. Just pure, optimized web technologies combined with best-in-class mathematical libraries (loaded via CDN):

- **Core**: Vanilla HTML5, CSS3, ES6 JavaScript (IIFE Module Pattern)
- **3D Graphics**: [Three.js](https://threejs.org/)
- **Math Engine**: [math.js](https://mathjs.org/)
- **2D Graphing**: [function-plot](https://mauriciopoppe.github.io/function-plot/) (built on D3.js)
- **Typography/Math Typesetting**: [KaTeX](https://katex.org/), Google Fonts (Inter, JetBrains Mono)

## 🏁 Getting Started

Because there is no build step, you can run this project instantly:

1. Clone the repository:
   ```bash
   git clone https://github.com/Ganesh40292/math-suite.git
   ```
2. Navigate into the folder:
   ```bash
   cd math-suite
   ```
3. Open `index.html` in your web browser. Or, for the best experience, run it using a local HTTP server:
   ```bash
   npx http-server ./
   ```
   *Then visit `http://127.0.0.1:8080` in your browser.*

## ☁️ Deployment

This project includes a `vercel.json` configuration file, making it 1-click deployable to Vercel as a static site.

> [!TIP]
> If your repository is connected to Vercel, simply pushing to the `main` branch will trigger an automatic production deployment with clean routing and optimized security headers.

---

*Designed and engineered with a focus on UI/UX excellence and mathematical robustness.*
