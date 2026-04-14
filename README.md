# Unreal Pixel Streaming Frontend

A high-performance, modern web application designed to interface with Unreal Engine 5.4+ applications via the Pixel Streaming protocol. This frontend provides a robust UI for interacting with 3D environments, specifically optimized for geographic navigation and session management.

## 🚀 Overview

This project serves as a bridge between web users and an Unreal Engine dedicated server. It leverages the `@epicgames-ps/lib-pixelstreamingfrontend-ue5.4` library to deliver high-fidelity 3D content directly to the browser while providing custom React-based overlays for control and telemetry.

## ✨ Key Features

- **Pixel Streaming Integration**: Deep integration with UE 5.4 Pixel Streaming for low-latency video and interaction.
- **Geographic Navigation (FlyTo)**: A dedicated panel for sending Latitude, Longitude, and Altitude data to the Unreal Engine application to trigger camera movements.
- **Session Management**: Built-in support for starting and joining streaming sessions through a dedicated switcher.
- **Modern React Stack**: Built with **React 19**, **Vite**, and **TypeScript** for a fast and type-safe development experience.
- **Advanced Routing**: Uses **TanStack Router** for file-based routing and seamless state transitions between rooms.
- **Robust State Management**: Powered by **Zustand** for global streaming status and session persistence.
- **Glassmorphism UI**: Beautiful, interactive overlays styled with **Tailwind CSS**, **Radix UI**, and **Framer Motion**.
- **Automatic Reconnection**: Intelligent retry logic to maintain stable connections in various network conditions.

## 🛠 Tech Stack

- **Core**: React 19, TypeScript, Vite
- **Streaming**: @epicgames-ps/lib-pixelstreamingfrontend-ue5.4
- **State**: Zustand
- **Routing**: TanStack Router
- **Data Fetching**: TanStack Query
- **Styling**: Tailwind CSS 4, Radix UI, Lucide React
- **Animations**: Framer Motion
- **Testing**: Vitest

## 📋 Prerequisites

- **Node.js**: 18.x or later
- **Package Manager**: [pnpm](https://pnpm.io/) is recommended (lockfile included)

## 🏗 Getting Started

### 1. Clone & Install

```bash
# Install dependencies
pnpm install
```

### 2. Development

Run the development server with Hot Module Replacement (HMR):

```bash
pnpm dev
```
The app will be available at `http://localhost:3000`.

### 3. Build for Production

```bash
pnpm build
```
The optimized bundle will be generated in the `dist` directory.

## 📁 Project Structure

```text
src/
├── components/          # Reusable UI components and PS wrappers
│   ├── ui/              # Shadcn/Radix UI base components
│   ├── room/            # Room-specific logic
│   └── PixelStreamingWrapper.tsx # Core PS integration
├── hooks/               # Custom React hooks
├── store/               # Zustand state definitions
├── routes/              # TanStack file-based routes
├── styles/              # Global CSS and Tailwind configuration
└── types/               # TypeScript interfaces & types
```

## 🔌 UI Interactions

The frontend communicates with Unreal Engine via `emitUIInteraction`. Key interaction types include:

- **FlyTo**: Sends `{ lat, lng, height, type: 'test' }` to the engine.
- **Session Control**: Sends `{ type: 'create join', session_id: '' }` to manage room availability.

## 🧪 Testing & Linting

```bash
pnpm test    # Run unit tests with Vitest
pnpm lint    # Run ESLint checks
pnpm format  # Format code with Prettier
```

## 📝 License

Internal Project - All Rights Reserved.
