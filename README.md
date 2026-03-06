# 🌀 Fourier Artisan

**Deconstruct any shape into mesmerizing Fourier epicycles.**

Upload a silhouette or explore the default Bangladesh map — watch spinning circles decompose form into celestial motion using the Discrete Fourier Transform.

> Originally forked from [CodingTrain/Fourier Transform Drawing](https://github.com/CodingTrain/website/tree/main/CodingChallenges/CC_130_Fourier_Transform_1/P5), with a modernized design and enhanced features.

## ✨ Features

- 🗺️ **Pre-loaded Bangladesh map** coordinates (generated via Inkscape)
- 📤 **Upload any silhouette** — dark-on-light images work best
- 🎛️ **Adjustable complexity** — control the number of epicycles (10–1000)
- ⚡ **Speed control** — 1× to 10× drawing speed
- 📊 **Progress bar** — see how far along the drawing is
- 📦 **Export** the traced path as SVG or JSON
- 🎨 **Modern glassmorphism UI** with smooth animations

## 🚀 Live Demo

👉 [**msrtarit.github.io/DrawingWithFourier**](https://msrtarit.github.io/DrawingWithFourier)

## 📸 Screenshots

![Landing Page](https://user-images.githubusercontent.com/37762274/116816820-592c2f00-ab85-11eb-8adc-f0462824a9dd.png)

## 🛠️ Tech Stack

- **p5.js** — Canvas drawing and animation
- **Vanilla JS** — No frameworks, pure browser APIs
- **CSS3** — Glassmorphism, custom properties, responsive design
- **DFT** — Discrete Fourier Transform for signal decomposition

## 📂 Project Structure

```
DrawingWithFourier/
├── index.html      # Main HTML with semantic structure
├── style.css       # Modern design system with CSS variables
├── sketch.js       # p5.js sketch, state management, UI logic
├── fourier.js      # Discrete Fourier Transform implementation
├── bd.js           # Bangladesh map coordinate data
└── README.md
```

## 🧮 How It Works

1. **Path coordinates** are extracted from an image outline or loaded from `bd.js`
2. The **X and Y components** are separated and transformed using DFT
3. Each frequency component becomes an **epicycle** (spinning circle)
4. The epicycles are sorted by amplitude and drawn in real-time
5. The tip of the last circle traces the original shape!

## 🏗️ Development

```bash
# Serve locally (any static server works)
python -m http.server 8000
# Open http://localhost:8000
```

## 📜 License

MIT — Feel free to use, modify, and share.

## 🙏 Credits

- [Daniel Shiffman / CodingTrain](https://thecodingtrain.com/) — Original Fourier Transform coding challenge
- [Inkscape](https://inkscape.org/) — Used for generating SVG path coordinates
