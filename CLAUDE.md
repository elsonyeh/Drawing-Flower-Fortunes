# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**埕花 (Cheng Flowers)** - 鹽夏不夜埕花語抽籤互動網站

A gacha-style digital flower fortune-telling game for Yancheng Night Market. Features complete collection system with SSR rarity cards, animated card drawing mechanics, and persistent collection tracking via localStorage.

## Tech Stack

- **React 18** - Component-based UI framework
- **Vite** - Build tool and dev server
- **Framer Motion** - 2D animations (card flip, transitions)
- **React Three Fiber + Three.js** - 3D flower blooming effects
- **Tailwind CSS** - Utility-first styling
- **React Router** - (if multi-page navigation needed)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── LandingPage.jsx      # Landing page with 60 falling petals
│   ├── GachaAnimation.jsx   # Multi-card shuffle & draw animation
│   ├── CardBack.jsx         # Unique card back for each flower
│   ├── FlowerBloom.jsx      # 3D flower bloom effect (Three.js)
│   ├── FortuneResult.jsx    # Result display with SSR effects
│   └── CollectionPage.jsx   # Collection gallery (20 cards)
├── data/
│   └── flowers.json    # 20 flowers (15 common + 5 SSR)
├── utils/
│   └── fortuneHelper.js # Gacha system & collection management
└── App.jsx             # Main app with stage management
```

## Architecture Notes

### Gacha Flow (Game-style Card Drawing)
1. **Landing Page** - 60 falling petals + draw button + collection button
2. **Gacha Animation** - 7-card shuffle → draw → flip → reveal (5-6 seconds total)
3. **SSR Detection** - If SSR, trigger golden effects (rays, particles, congrats)
4. **Result Display** - 3D flower (enlarged) + flower info + SSR special styling
5. **Auto-save** - Card saved to localStorage collection immediately

### Collection System
- **localStorage**: Persistent collection tracking
- **Statistics**: Total cards, SSR count, common count, completion %
- **Gallery**: 2-5 column grid, locked/unlocked states, NEW badges
- **Filtering**: All / SSR / Common tabs

### Gacha Probability System
- **SSR (5 cards)**: 5% each = 25% total
  - ID 101-105: 曇花, 藍色妖姬, 鳳凰花, 彼岸花, 虞美人
- **Common (15 cards)**: 75% total ≈ 5% each
  - ID 1-15: Regular flowers

### Animation Architecture
1. **Shuffle Stage** (1.5s): 7 cards spread and shuffle
2. **Draw Stage** (1s): One card elevates with glow
3. **Flip Stage** (1.2s): 3D card flip rotation
4. **Reveal Stage** (2-2.5s):
   - SSR: Golden rays + burst particles + 3D flower
   - Common: 3D flower bloom
5. **Auto-transition**: Jump to result page

### Data Structure
Each flower contains:
- `id`: Unique ID (1-15 common, 101-105 SSR)
- `flower`: Flower name (Chinese)
- `meaning`: Flower language meaning
- `story`: Story with Yancheng local context
- `message`: Personalized guidance message
- `locations`: 3 recommended Yancheng locations
- `color`: Primary color (hex)
- `gradientColors`: Array[3] for SSR gradient (optional)
- `model`: 3D model reference
- `rarity`: "common" | "ssr"

## Design Principles

- **Mobile-first**: Optimized for QR code mobile access
- **Performance**: Lazy load 3D models, optimize bundle size
- **Accessibility**: Touch-friendly interactions, readable text
- **Atmospheric**: Use particles, gradients, and smooth transitions for immersive experience

## Key Implementation Details

- 3D models should be lightweight (optimized GLB/GLTF)
- Random fortune selection ensures unique experience
- Animations should be smooth on mobile devices (60fps target)
- Consider preloading critical assets for seamless experience
