# PrayerPal - Prayer Accountability App

A mobile-first social accountability platform that helps Muslims maintain their 5 daily prayers through photo-based check-ins, friend accountability, and streak tracking.

## Tech Stack

**Backend:**
- Python Flask
- PostgreSQL
- SQLAlchemy ORM
- JWT Authentication

**Frontend:**
- React Native (Expo)
- React Navigation
- Axios for API calls
- AsyncStorage for local data

**Additional Services:**
- Aladhan API (Prayer Times)
- AWS S3 / Cloudinary (Image Storage)
- Firebase Cloud Messaging (Push Notifications)

## Project Structure

```
Mizaan/
├── backend/           # Flask API
│   ├── app/
│   │   ├── models/    # Database models
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic
│   │   └── utils/     # Helper functions
│   ├── config.py      # Configuration
│   ├── run.py         # App entry point
│   └── requirements.txt
│
└── frontend/          # React Native App
    ├── src/
    │   ├── screens/   # App screens
    │   ├── components/ # Reusable components
    │   ├── navigation/ # Navigation setup
    │   ├── services/   # API calls
    │   ├── context/    # State management
    │   └── utils/      # Helper functions
    └── package.json
```

## Setup Instructions

### Backend Setup

1. **Install PostgreSQL** (if not already installed)

2. **Create Database**
   ```bash
   psql -U postgres
   CREATE DATABASE prayerpal_db;
   \q
   ```

3. **Navigate to backend folder**
   ```bash
   cd backend
   ```

4. **Create virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # Mac/Linux
   ```

5. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

6. **Create .env file**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your database credentials:
   ```
   SECRET_KEY=your-secret-key
   JWT_SECRET_KEY=your-jwt-secret
   DATABASE_URL=postgresql://postgres:yourpassword@localhost/prayerpal_db
   FLASK_APP=run.py
   FLASK_ENV=development
   ```

7. **Initialize database**
   ```bash
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

8. **Run the server**
   ```bash
   python run.py
   ```
   Server will run on http://localhost:5000

### Frontend Setup

1. **Navigate to frontend folder**
   ```bash
   cd frontend
   ```

2. **Install dependencies** (if not already done)
   ```bash
   npm install
   ```

3. **Start Expo**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## Development Status

- [x] Phase 1: Project Setup & Foundation
- [ ] Phase 2: Authentication System
- [ ] Phase 3: Prayer Time Integration
- [ ] Phase 4: Photo Check-in System
- [ ] Phase 5: Streak & Statistics
- [ ] Phase 6: Friend System
- [ ] Phase 7: Activity Feed
- [ ] Phase 8: Notifications
- [ ] Phase 9: Polish & UX
- [ ] Phase 10: Testing & Deployment

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Users
- `PUT /api/users/settings` - Update user settings (protected)

### Health Check
- `GET /api/health` - Check API status

## Contributing

This is a personal learning project, but feedback is welcome!

## License

MIT
