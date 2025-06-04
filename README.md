# The Click Game

This project was bootstrapped and primarily built using [bolt.new](https://bolt.new).

## Project Description

"The Click Game" is a real-time multiplayer game where users try to find a hidden pixel on a 1000x1000 grid. Successfully clicking the target pixel awards the current jackpot, which grows with each missed attempt and automatically over time. The target pixel changes daily, offering a fresh challenge each day.

## How to Play

1.  **Objective:** Click the single secret pixel hidden somewhere on the 1000x1000 grid.
2.  **Daily Attempts:** You get one attempt per day to find the pixel.
3.  **Jackpot:**
    *   If you find the pixel, you win the current jackpot! The jackpot then resets to its base amount.
    *   If you miss, your click reveals how far you were from the target, and the jackpot increases by a small amount.
    *   The jackpot also increases automatically at regular intervals.

## Features

*   **Real-time Jackpot:** The jackpot amount updates live for all players.
*   **Daily Target:** A new target pixel is generated each day.
*   **Persistent Jackpot:** The jackpot value is stored in a database and persists across sessions.
*   **Click Feedback:** After a click, the game shows the distance to the target.
*   **Developer Mode:** An optional mode (`?dev=true` in the URL) for testing purposes, allowing multiple attempts.

## Tech Stack

### Frontend
*   React
*   TypeScript
*   Vite
*   Tailwind CSS
*   Socket.io Client

### Backend
*   Node.js
*   Express
*   Socket.io
*   SQLite (using `better-sqlite3`)

## Getting Started / Development Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd the-click
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    This command starts both the frontend (Vite) and backend (Node.js) servers concurrently.
    ```bash
    npm run dev
    ```
    *   The backend server will typically run on `http://localhost:3001`.
    *   The frontend development server will typically run on `http://localhost:5173`.

## Available Scripts

*   `npm run dev`: Runs the client (Vite) and server (Node.js) concurrently in development mode.
*   `npm run start:server`: Starts only the backend server.
*   `npm run start:client`: Starts only the frontend Vite development server.
*   `npm run build`: Builds the React application for production (using TypeScript and Vite).
*   `npm run lint`: Lints the codebase using ESLint.
*   `npm run preview`: Serves the production build locally for preview.

## API Endpoints

The application uses WebSockets for most real-time communication. However, some HTTP endpoints exist:

*   `GET /api/jackpot`: Fetches the current total jackpot amount.
*   `GET /api/health`: Provides a system health check (status, connected clients, uptime).

### WebSocket Events (Server-side)
*   `connection`: When a new client connects.
*   `click`: When a client submits a click, expects `{ x: number, y: number }`.
*   `heartbeat_response`: Client acknowledging a server heartbeat.
*   `disconnect`: When a client disconnects.

### WebSocket Events (Client-side)
*   `jackpot_update`: Server sends updated jackpot information, provides `{ amount: number }`.
*   `click_result`: Server sends result of a click, provides `{ distance: number, success: boolean }`.
*   `jackpot_won`: Server broadcasts when jackpot is won, provides `{ amount: number, timestamp: string }`.
*   `heartbeat`: Server sends a heartbeat ping.
*   `error`: Server sends an error message, provides `{ message: string }`.


## Contributing

Contributions are welcome! Please feel free to open an issue to discuss a new feature or bug, or submit a pull request.

## License

This project is currently unlicensed. (Or specify MIT License / other if applicable)
