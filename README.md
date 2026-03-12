# Field Map Flow

This repository contains the **Field Map Flow** application, a mobile/web hybrid built with React, Capacitor, and Tailwind CSS.

## 🚀 Project Overview

Field Map Flow is designed for census field data collection. The app allows users to:

1. **Create and manage households** with detailed information.
2. **Add and edit people records** linked to households.
3. **Capture photos** using the device camera.
4. **Export and synchronize data** with a backend service.
5. **Install as a standalone mobile or PWA app** via Capacitor.

The interface is built with a custom component library (in `src/components/ui`) inspired by Radix/Headless UI, styled with Tailwind CSS. Data persistence is handled locally using SQLite via `src/components/db` modules, with operations exposed through custom hooks and utilities.


## 🏗️ Tech Stack

- **Framework:** React (JSX/JS)
- **Bundler:** Vite
- **Mobile Integration:** Capacitor (Android directory included)
- **Styling:** Tailwind CSS
- **State & Data:** React hooks, context (`AuthContext.jsx`), and a local SQLite database
- **API layer:** `src/api/base44Client.js` for backend communication
- **Utilities:** `src/lib/utils.js`, `src/hooks/use-mobile.jsx`, etc.


## 📁 Repository Structure

```
src/
  App.jsx                  # Root component
  main.jsx                 # Vite entry point
  components/              # Reusable React components
    census/                # Census-specific UI components
    db/                    # Database helpers (database.jsx, exportOps.jsx, etc.)
    ui/                    # Shared UI primitives (button, modal, table, etc.)
  hooks/                   # Custom hooks
  lib/                     # Context providers and helper modules
  pages/                   # Route components (AddPerson.jsx, Home.jsx, etc.)
  utils/                   # TypeScript utilities

android/                   # Capacitor Android project (auto-generated)

package.json              # dependencies & scripts
vite.config.js            # Vite configuration
tailwind.config.cjs       # Tailwind setup

README.md                 # this file
```


## 🧩 Getting Started

### Prerequisites

1. **Node.js** (>= 16) and **npm** or **yarn**
2. **Java JDK** for Android builds
3. **Android Studio** if you plan to run on an emulator/device

### Local Development

```bash
# clone the repo
git clone <repo-url>
cd field-map-flow

# install dependencies
npm install

# create environment file for configuration
cp .env.example .env.local
# or manually create .env.local with the following:
# VITE_BASE44_APP_ID=<your_app_id>
# VITE_BASE44_APP_BASE_URL=<your_backend_url>

# start development server
npm run dev
```

The app will be available at `http://localhost:5173` by default. Any code changes will trigger HMR.

### Running on Android

```bash
# build and open Android project
npm run build
npx cap sync android
npx cap open android
```

From Android Studio you can run the app on an emulator or connected device.


## ✅ Key Features

- Household CRUD operations with link to persons
- Person CRUD with biometric/camera photo capture
- Local database with export to file or remote API
- Responsive layout for desktop and mobile
- Installable as PWA or native via Capacitor


## 📦 Publishing & Deployment

### Web/PWA

1. Build the production bundle: `npm run build`
2. Host the `dist/` directory on any static file server (Netlify, Vercel, S3, etc.)
3. Ensure environment variables are set appropriately.

### Android

Follow the Capacitor docs to generate a signed APK or AAB from Android Studio.


## 📘 Documentation & Support

- React: https://reactjs.org/
- Vite: https://vitejs.dev/
- Capacitor: https://capacitorjs.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

For project-specific documentation refer to the code in `src/` and the inline comments.

If you encounter issues, please open an issue in this repository or contact the maintainer.


---

*This README was last updated on March 12, 2026.*
