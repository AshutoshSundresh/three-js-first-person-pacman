# 3D Experimentation

3D Pac-Man-style game built with Three.js and TypeScript.

## Highlights

- Dual-camera rendering: first-person view with separate minimap overlay in single render pass
- Post-processing pipeline: UnrealBloomPass with dynamic intensity tied to player speed/warp effects
- Procedural environment maps: canvas-generated cube textures for real-time reflections
- Ghost AI: pathfinding with distinct behaviors (chase, frightened, eaten) and screen-edge warp distortion
- Real-time reflections: Reflector-based floor with procedural noise textures
- Dynamic FOV/bloom: camera effects intensify during screen-edge warping

## Screenshots

<img width="2879" height="1447" alt="image" src="https://github.com/user-attachments/assets/b4c2d0c8-b90e-4fa8-9cd2-69ac2e388f9c" />
<img width="2879" height="1455" alt="image" src="https://github.com/user-attachments/assets/3acb2037-ef7f-429a-b473-3200717af1ef" />


## Architecture

- **Rendering**: Multi-viewport rendering with post-processing compositor (bloom only on main view)
- **Entities**: Grid-based movement system with smooth interpolation and collision detection
- **Visual Effects**: Procedural cube maps, particle bursts, pulsing neon materials with emissive intensity animation

## Tech Stack

- Three.js, TypeScript, Vite

## Local Development

1. Install deps: `npm i`
2. Start dev: `npm run dev`
3. Build: `npm run build`

**Controls**: WASD or Arrow Keys to move. Collect all pellets to win!

