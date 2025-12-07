# Tactical Map

A League of Legends tactical board for planning strategies, analyzing vision control, and visualizing team positions.

## Features

### Map Elements
- **Champion Tokens**: Draggable tokens for all 10 players with role indicators
- **Buildings**: Interactive towers and inhibitors with enable/disable states
- **Jungle Camps**: Toggle neutral objectives (Baron, Dragon, buffs)
- **Vision System**: Place vision wards and control wards with full team coverage
- **Fae'lights**: Advanced vision zones that reveal strategic map areas when warded

### Vision & Fog of War
- **Team Vision Modes**: View from Blue, Red, or Both perspectives
- **Dynamic Vision**: Real-time vision calculation with wall occlusion
- **Ward Interactions**: Control wards disable enemy vision wards
- **Bush Coverage**: Accurate brush mechanics
- **Zone Reveals**: Fae'light system for key map locations

### Tools
- **Drawing**: Pen and eraser tools for marking strategies
- **Grid Overlay**: Optional grid for precise positioning
- **Zoom & Pan**: Navigate the map with mouse wheel and right-click drag
- **Export**: Save your tactical setup as PNG

## Tech Stack

- **React** 19.2.0 - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **HTML5 Canvas** - Vision rendering and fog of war
- **html2canvas** - PNG export

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tactical-board.git
cd tactical-board

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Build output will be in the `dist/` folder.

## Usage

### Basic Controls
- **Left Click**: Select and place tokens/wards
- **Right Click + Drag**: Pan the map
- **Mouse Wheel**: Zoom in/out
- **Drag Tokens**: Move champion positions

### Vision System
1. Select your team (Blue/Red) in the right panel
2. Choose ward type (Vision or Control)
3. Click on the map to place wards
4. Enable Fog of War to see team vision coverage
5. Fae'lights automatically reveal zones when wards are placed in detection radius

### Drawing
1. Select Pen or Eraser from the left panel
2. Click and drag on the map to draw strategies
3. Use "Clear All Drawings" to reset

### Export
Click "Export to PNG" in the left panel to save your current board state as an image.

## Project Structure

```
tactical-board/
├── public/
│   ├── base.jpg           # Main map image
│   ├── walls.png          # Wall collision mask
│   ├── bush.png           # Brush vision mask
│   └── masks/             # Fae'light zone masks
├── src/
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Helper functions
│   ├── data/              # Game data (tokens, towers, etc.)
│   ├── config/            # Display configuration
│   └── types.ts           # TypeScript definitions
└── package.json
```

## Configuration

### Display Settings
Edit `src/config/displayConfig.ts` to customize:
- Token sizes
- Ward sizes
- Colors for teams, wards, towers
- Vision circle opacity
- Drawing pen width

### Game Data
Modify files in `src/data/` to adjust:
- Default token positions (`defaultTokens.ts`)
- Tower locations (`defaultTowers.ts`)
- Jungle camp spawns (`defaultJungleCamps.ts`)
- Fae'light positions (`defaultFaelights.ts`)

## Performance

- **Bundle Size**: ~119 KB gzipped
- **Vision Calculation**: 180-ray raycasting system
- **Render Optimization**: Canvas-based fog of war for performance
- **Memory Efficient**: Lazy loading for mask images

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

### What this means:
- You can use, modify, and distribute this software freely
- If you distribute modified versions, you must share the source code under the same GPL-3.0 license
- Commercial use is allowed, but you must provide the source code to users
- No warranty is provided

## Contributing

Contributions are welcome. Please open an issue first to discuss proposed changes.

## Acknowledgments

- Map data and imagery from League of Legends
- Built with modern web technologies for optimal performance
