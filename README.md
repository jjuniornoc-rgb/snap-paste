# ⚡ SnapPaste (v2.0)

> **Zero-Friction Screenshot Capture, Pro Annotation, Frame Studio & 100% Client-Side Privacy.**

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-emerald.svg)](#privacy-first-architecture)
[![i18n](https://img.shields.io/badge/i18n-8%20Languages-orange.svg)](#internationalization-i18n)

---

## ✨ Overview

**SnapPaste** is an ultra-fast, modern web application designed for quick screenshot capture, crisp annotations, beautiful presentation frames, and instant sharing. 

Built with modern UI standards (Warm Obsidian aesthetic, tactile controls, fluid animations, and zero bloatware), SnapPaste runs **entirely in your browser**—no server uploads, no telemetry, and no tracking cookies.

---

## 🌟 Key Features

### 1. ⚡ Instant Capture & Zero Friction
- **Global `Ctrl + V` / `⌘V`**: Press paste anywhere in the browser to immediately open and edit your clipboard image.
- **Drag & Drop**: Drop images straight into the dropzone.
- **Screen & Window Capture**: One-click native screen sharing capture via `getDisplayMedia`.
- **Webcam Shutter**: Integrated webcam snapshot with 3-second countdown timer.
- **Just Sketch**: Instant blank canvas with graphite slate & dot grid for drafting ideas.

### 2. 🎨 Full-Featured Annotation & Editing Suite
- **Brush & Marker (`P`)**: Smooth freeform drawing with pressure-like curves.
- **Highlighter (`H`)**: Semi-transparent highlighter for emphasizing text.
- **Directional Arrow (`A`)**: Crisp vector arrows for pointing out details.
- **Geometric Shapes (`R`)**: Clean rectangles, rounded boxes, and circles.
- **Inline Text Annotation (`T`)**: Modern in-canvas card with font size selector and high-contrast dark pills (no ugly browser `prompt()` popups).
- **Password Censor / Pixelate (`B`)**: Securely conceal tokens, passwords, and sensitive information with customizable pixelation.
- **Numbered Step Pins (`N`)**: Sequenced badges (1, 2, 3...) for writing intuitive step-by-step guides.
- **Spotlight Magnifier (`M`)**: 2.5× optical zoom loupe to highlight small UI details.
- **Pixel Dimension Ruler (`D`)**: Measurement tool for measuring layout distances in pixels.
- **Callout Bubbles (`Q`)**: Conversational speech bubbles with customizable tail anchors.
- **Crop Pro (`X`)**: Non-destructive cropping with 8-point bounding box handles, rule-of-thirds grid, and aspect ratios (`Free`, `1:1`, `16:9`, `4:3`, `9:16`, `3:2`).
- **Tactile Canvas Zoom**: Smooth mouse wheel zooming (`Ctrl + Wheel`), pan with spacebar/wheel, and hotkeys (`Ctrl+0`, `Ctrl++`, `Ctrl+-`).

### 3. 🖼️ Presentation Studio & Gradient Frames (Xnapper-Style)
- Wrap your screenshots in presentation backgrounds ready for X (Twitter), LinkedIn, and documentation.
- Built-in gradient presets (*Amber Glow*, *Deep Obsidian*, *Sunset Velvet*, *Emerald Matrix*, and *Transparent PNG*).
- Configurable padding (16px to 80px), corner border radius, 3D shadow depths (*Dramatic*, *Soft*, *None*), and macOS-style window titlebars.

### 4. 🔒 Privacy-First Architecture
- **100% Client-Side**: All image operations and canvas filters execute locally via HTML5 Canvas API and Web APIs.
- **IndexedDB Local Storage**: Screenshots in **"My Clips"** gallery stay in your browser. No files are sent to remote clouds.
- **Zero Invasive Cookies**: Only LocalStorage and IndexedDB for your preferences and saved clips.

### 5. 🌐 Multilingual (i18n) — 8 Languages
Standardized with **English (`en`) as default**, supporting real-time switching without page reload:
- 🇺🇸 **English (`en`)** — Default
- 🇧🇷 **Português do Brasil (`pt-BR`)**
- 🇪🇸 **Español (`es`)**
- 🇷🇺 **Русский (`ru`)**
- 🇺🇦 **Українська (`uk`)**
- 🇨🇳 **简体中文 (`zh`)**
- 🇰🇷 **한국어 (`ko`)**
- 🇯🇵 **日本語 (`ja`)**

### 6. 🔍 Raycast-Style Command Palette (`Ctrl + K` / `⌘K`)
- Quickly access any tool, action, export option, view, or language via fuzzy keyboard search.

### 7. 🎯 Interactive 13-Step Guided Tour
- Comprehensive walkthrough explaining every feature.
- Intelligent non-obstructive positioning (docked to bottom-right on canvas), draggable header handle, and "Hold to Peek" transparency mode.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + V` / `⌘V` | Paste image from clipboard anywhere |
| `Ctrl + K` / `⌘K` | Open Command Palette |
| `Ctrl + Scroll` | Zoom in / Zoom out canvas |
| `Ctrl + 0` | Reset canvas zoom to 100% |
| `Ctrl + C` / `⌘C` | Copy rendered image to system clipboard |
| `Ctrl + S` / `⌘S` | Save clip to local IndexedDB gallery |
| `Ctrl + D` | Quick download PNG |
| `P` | Freehand Brush tool |
| `H` | Semi-transparent Highlighter tool |
| `A` | Geometric Arrow tool |
| `R` | Rectangle / Shapes tool |
| `T` | Inline Text Annotation tool |
| `B` | Censor / Pixelate Blur tool |
| `N` | Numbered Step Pin tool |
| `M` | Spotlight Magnifier Loupe tool |
| `D` | Pixel Measurement Ruler tool |
| `Q` | Speech Callout tool |
| `X` | Crop Pro tool |
| `F` | Open Presentation Frame Modal |
| `Ctrl + Z` / `⌘Z` | Undo last action |
| `Ctrl + Y` / `⌘Shift+Z` | Redo action |
| `Esc` | Cancel active crop / Close modal / Exit tour |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.x or higher recommended)
- [npm](https://www.npmjs.com/) (or yarn / pnpm)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jjuniornoc-rgb/snap-paste.git
   cd snap-paste
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

### Production Build

To compile a production build with full TypeScript typechecking:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 📁 Project Structure

```
snap-paste/
├── public/                 # Static assets & icons
├── src/
│   ├── components/
│   │   ├── Editor/         # Canvas editor, toolbar, frame studio, share modal
│   │   │   ├── EditorToolbar.tsx
│   │   │   ├── FrameModal.tsx
│   │   │   ├── ImageEditor.tsx
│   │   │   └── ShareModal.tsx
│   │   ├── ClipsGallery.tsx   # 100% client-side IndexedDB clips gallery
│   │   ├── CommandPalette.tsx # Raycast-style Ctrl+K palette
│   │   ├── CookieBanner.tsx   # Privacy transparency banner
│   │   ├── HeroPasteZone.tsx  # Interactive home dropzone & keycap display
│   │   ├── Navbar.tsx         # Brand logo, view tabs, language selector
│   │   ├── OnboardingTour.tsx # 13-step draggable non-blocking tour
│   │   └── WebcamModal.tsx    # Integrated camera snapshot modal
│   ├── i18n/                  # Complete internationalization engine
│   │   ├── translations/      # en, ptBR, es, ru, uk, zh, ko, ja
│   │   ├── LanguageContext.tsx
│   │   ├── types.ts
│   │   └── index.ts
│   ├── lib/
│   │   └── storage.ts         # IndexedDB persistent storage wrapper
│   ├── App.tsx                # Core application router & toast controller
│   ├── index.css              # Obsidian theme & Tailwind styles
│   └── main.tsx               # Entrypoint wrapped with LanguageProvider
├── .gitignore
├── LICENSE
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE) — feel free to use, modify, and distribute.
