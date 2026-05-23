# TaskFlow

A dark-themed task management web app built with React. Organize work with list and Kanban views, filters, and a dashboard—usable immediately with in-browser mock auth and sample data.

**Repository:** [https://github.com/Trisharawat05/TaskFlow.git](https://github.com/Trisharawat05/TaskFlow.git)

## Features

- **Mock authentication** — Sign in, sign up, or continue as Demo (client-side only; no Firebase Auth calls in the UI)
- **Task management** — Create, edit, delete, and toggle completion; priority (high / medium / low), status (todo / in-progress / done), categories, tags, and due dates
- **Dashboard** — Totals, in-progress count, overdue and high-priority counts, completion rate, and category breakdown
- **Views** — List view with search, status/priority filters, and sorting; Kanban board by status
- **Task detail panel** — Inline status changes, metadata, edit, and delete
- **Seed data** — Preloaded sample tasks on first load

> The running UI stores tasks in React state. Root-level `firebase.js` and `server.js` provide optional Firebase client/server integration but are **not** connected to `src/TaskFlow.jsx` yet.

## Tech Stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 18, Create React App (`react-scripts`), inline CSS |
| Optional client SDK | Firebase JS SDK (`firebase.js`) |
| Optional API | Node.js, Express, Firebase Admin, Firestore (`server.js`) |
| Deploy config | Vercel (`vercel.json`) |

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm (included with Node.js)

## Installation

```bash
git clone https://github.com/Trisharawat05/TaskFlow.git
cd TaskFlow
npm install
```

## How to Run

### Frontend (default)

```bash
npm start
```

Opens the app at [http://localhost:3000](http://localhost:3000) (Create React App default).

Other scripts:

```bash
npm run build   # production build
npm test        # test runner
npm run lint    # ESLint on src/
```

### Optional API server

`server.js` is an Express + Firestore REST API (health, user profile, tasks CRUD, stats). It is separate from the current UI.

1. Install server dependencies (not listed in `package.json`):

   ```bash
   npm install express cors firebase-admin dotenv
   ```

2. Create a `.env` file (see [Environment variables](#environment-variables)).

3. Start the API:

   ```bash
   node server.js
   ```

   Default port: `5000` (override with `PORT`).

`package.json` also defines `npm run server` (`node server/index.js`) and `npm run dev` (frontend + server via `concurrently`). Those paths/scripts may need alignment with `server.js` before they work out of the box.

## Environment Variables

Copy values from your Firebase project console. Do not commit `.env` or `credentials.json` (both are gitignored).

### Frontend — `firebase.js` (Create React App)

Create `.env` in the project root:

| Variable | Purpose |
|----------|---------|
| `REACT_APP_FIREBASE_API_KEY` | Firebase web API key |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `REACT_APP_FIREBASE_PROJECT_ID` | Project ID |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `REACT_APP_FIREBASE_APP_ID` | Firebase app ID |

Required only if you wire the app to use `firebase.js` for Auth/Firestore.

### Backend — `server.js`

| Variable | Purpose |
|----------|---------|
| `FIREBASE_PROJECT_ID` | Firebase project ID (Admin SDK) |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key (use `\n` for newlines in `.env`) |
| `ALLOWED_ORIGIN` | CORS origin (defaults to `*`) |
| `PORT` | API port (default `5000`) |

## Project Structure

```
TaskFlow/
├── public/
│   └── index.html          # HTML shell
├── src/
│   ├── index.js            # React entry
│   └── TaskFlow.jsx        # Main app (auth, tasks, dashboard, views)
├── firebase.js             # Firebase client init (env-based; unused by UI)
├── server.js               # Express + Firestore API (optional)
├── TaskFlow.jsx            # Duplicate of src component (not used by entry)
├── package.json
├── vercel.json             # Vercel API routing config
├── .gitignore
└── README.md
```

## License

No license file is included in this repository.
