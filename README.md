# 🃏 MTG Commander Tracker

A full-stack web application for tracking **Magic: The Gathering Commander** match results, statistics, and player performance.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Contributing](#contributing)

---

## Overview

MTG Commander Tracker lets you log Commander (EDH) matches, track win rates per commander, analyze player performance over time, and browse match history — all through a clean React interface backed by a FastAPI + MySQL server.

---

## Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Frontend  | React, Axios        |
| Backend   | FastAPI (Python)    |
| Database  | MySQL               |
| API Docs  | Swagger UI / ReDoc  |

---

## Features

- 📝 Log Commander match results (players, commanders, winner, date)
- 📊 View win rates and stats per commander
- 🏆 Player leaderboards
- 🔍 Browse and filter match history
- ⚡ Auto-generated interactive API docs

---

## Project Structure

```
python-sql-mtg/
├── backend/
│   ├── FastApi.py                  # FastAPI app entry point
│   ├── database.py                 # MySQL connection & session
|   ├── schemas.py                  # Pydantic schemas
|   ├── login.env                   # create your .env file here
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │    ├── AddButtons.jsx
│   │   │    ├── AddDeckForm.jsx
│   │   │    ├── AddMatchForm.jsx
│   │   │    ├── ...                # more UI components
│   │   ├── pages/                  # Page-level views
│   │   │    ├── DeckDetail.jsx
│   │   │    ├── Decks.jsx
│   │   │    ├── ...                #more Pages
│   │   ├── services/               # Axios API calls
│   │   └── App.jsx
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8.0+

---

### Backend Setup

```bash
# 1. Navigate to the backend folder
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy and fill in environment variables
touch login.env

#5. Edit .env var if neccessary


# 6. Start the development server
uvicorn FastApi:app --reload
```

How the . env file should look like
```
DB_USER=YOUR_DB_USER
DB_PASSWORD=YOUR_DB_PASSWORD
DB_HOST=localhost               #change to webservice-url if you have a online server
DB_PORT=3306
DB_NAME=YOUR_DB_NAME
```


The API will be available at `http://localhost:8000`.
Interactive docs at `http://localhost:8000/docs`.

---

### Frontend Setup

```bash
# 1. Navigate to the frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The React app will be available at `http://localhost:5173`.

---

### Database Setup

```sql
CREATE DATABASE mtg_tracker;
```

Then run the provided migration script (or let SQLAlchemy create the tables on first run):

```bash
cd backend
python -c "from database import Base, engine; Base.metadata.create_all(engine)"
```

---

## Environment Variables

Create a `.env` file in the `backend/` folder based on `.env.example`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mtg_tracker
DB_USER=root
DB_PASSWORD=your_password

# App
APP_ENV=development
SECRET_KEY=your_secret_key
```

---

## API Reference

Once the backend is running, visit:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Main Endpoints

| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| GET    | `/matches`                      | List all matches                   |
| POST   | `/matches`                      | Log a new match                    |
| GET    | `/matches/{id}`                 | Get a specific match               |
| GET    | `/commanders`                   | List all commanders                |
| GET    | `/commanders/{id}/stats`        | Get win rate & stats for commander |
| GET    | `/players`                      | List all players                   |
| GET    | `/players/{id}/stats`           | Get stats for a player             |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

> Built with ❤️ for the Commander community.