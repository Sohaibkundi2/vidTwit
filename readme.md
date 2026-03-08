# VidTwit - Video Platform

VidTwit is a full-featured backend and frontend for a YouTube-style video sharing platform. It supports authentication, video uploads, comments, subscriptions, and more..., Along with posting like X(twitter),  built using **Node.js, Express.js, MongoDB, Cloudinary, JWT** on the backend, and **React.js, Tailwind CSS, Axios** on the frontend.

---
# Preview
[click to check live](https://my-tube-red.vercel.app/)


## Features

### Backend
- JWT-based Authentication (Register, Login, Refresh, Logout)
- Profile Management (avatar, cover image, password update)
- Video CRUD (upload, get, update, delete, publish toggle)
- Tweet CRUD (upload, get, update, delete)
- Comments System (create, read, update, delete, paginated)
- Likes System (toggle likes on videos)
- Subscriptions (subscribe/unsubscribe, channels, fetch subscribers)
- Playlists (create, update, delete, add/remove videos)
- Channel Stats (views, likes, total videos/subscribers)
- Cloudinary Integration (for image/video uploads)
- Async handlers, custom API response/error utilities
- Pagination support via Mongoose plugins
- Modular code structure & middleware system

### Frontend (excluding Likes and Playlists)
- User Authentication (Login/Register, logout)
- Profile Management (avatar, cover image, password) and also updation
- Video Upload, Watch, and Browse Pages (update, delete, publish)
- Tweet Upload, Watch, and Browse Pages (update, delete)
- Comment Section with Live Updates
- Subscriptions (subscribe/unsubscribe channels, view subscribers)
- Channel Pages with Statistics
- Responsive UI (mobile and desktop)
- API integration with backend services

---

## Tech Stack

| Layer       | Technologies |
|-------------|--------------|
| Backend     | Node.js, Express.js, MongoDB, Mongoose, Cloudinary, JWT, Multer |
| Frontend    | React.js, Tailwind CSS, Axios, React Router |
| Database    | MongoDB |

---

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [Run Locally](#run-locally)
  - [Docker Setup (Recommended)](#docker-setup-recommended)
  - [Manual Setup](#manual-setup)
- [Author](#author)
- [Contributors](#contributors)

---

## Environment Variables

### Backend
Create a `.env` file with the following keys:
```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=your_jwt_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

MY_CLOUD_NAME=your_cloud_name
MY_CLOUD_API_KEY=your_api_key
MY_CLOUD_SECRET_KEY=your_api_secret

# Email Service Configuration (Required for OTP functionality)
EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
EMAIL_FROM=your_sender_email

NODE_ENV=development
```

### Frontend
Create a `.env` file with the following keys:
```env
VITE_BACKEND_URL=http://localhost:3000/api/v1
```

---

## Run Locally

### Docker Setup (Recommended)

The easiest way to get VidTwit running locally is with Docker. This ensures all services work together without manual setup.

**Prerequisites:**
- Docker Desktop installed and running
- Git repository cloned locally

**Quick Start:**
```bash
# Clone the repository
git clone https://github.com/vallabhatech/vidTwit.git
cd vidTwit

# Start all services (builds containers if needed)
docker-compose up --build

# Stop all services
docker-compose down
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Database: mongodb://localhost:27017

**Features:**
- ✅ Database persists automatically across restarts
- ✅ Hot-reloading enabled for frontend development
- ✅ All environment variables pre-configured
- ✅ Services communicate via dedicated Docker network

**Configuration:**
Edit `docker-compose.yml` to customize:
- Database credentials
- Cloudinary settings
- Email service configuration

### Backend
```bash
# Clone repo
git clone https://github.com/sohaibkundi2/myTube.git
cd vidtwit/backend

# Install dependencies
npm install

# Setup .env file (see above)

# Run the server
npm run dev
```

Server should start on `http://localhost:3000`

### Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Setup .env file (see above)

# Run the frontend
npm run dev
```

Frontend should start on `http://localhost:5173`

---


---

## Author

**Muhammad Sohaib**  
- BSCS, 4th Semester — Tank Campus GU 
- MERN Stack Developer | Backend-focused  
- LinkedIn: [https://linkedin.com/in/sohaibkundi2](https://linkedin.com/in/sohaibkundi2)  
- GitHub: [https://github.com/sohaibkundi2](https://github.com/sohaibkundi2)

---

## Contributors

Thanks to all the amazing people who have contributed to this project!

[![Contributors](https://contrib.rocks/image?repo=Sohaibkundi2/vidTwit)](https://github.com/Sohaibkundi2/vidTwit/graphs/contributors)
