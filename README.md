<h1 align="center">E-Connect</h1>

<h4 align="center">An environmental sustainability platform that helps users track their eco-friendly activities and make a positive impact</h4>

<p align="center">
  <img src="src/assets/logo.png" alt="E-Connect Logo" width="200">
</p>

## About E-Connect

E-Connect is a web application designed to help users track their environmental impact, complete eco-friendly challenges, and build a community around sustainability. The platform motivates users through gamification elements like badges, rewards, and leaderboards.

## Key Features

- 📊 **Dashboard**: Track your environmental impact with personalized metrics
- 🎯 **Personalized Goals**: Set and monitor custom sustainability goals
- 🏆 **Challenges**: Complete predefined eco-friendly challenges to earn points
- 🏅 **Badges & Rewards**: Earn badges for your achievements
- 📈 **Leaderboards**: Compare your progress with others in the community
- 👤 **User Profiles**: Manage your account and settings
- 🔐 **Admin Panel**: Full admin functionality for platform management

## Tech Stack

- **Frontend**: Vue 3, TypeScript, Vite
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Email Service**: Nodemailer

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- PostgreSQL database

### Installation

1. Clone the repository:
```sh
git clone https://github.com/axiomproject/E-connect.git
cd E-connect
```

2. Install dependencies:
```sh
npm install
```

3. Create a `.env` file in the project root with the following variables:
```
# Backend environment variables
JWT_SECRET=your_jwt_secret
HOSTNAME=localhost
PORT=5173

# Database
DATABASE_URL=postgres://username:password@localhost:5432/econnect_db

# Email service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_FROM=E-Connect <your_email@gmail.com>

# Frontend environment variables (must start with VITE_)
VITE_API_URL=http://localhost:5173
```

4. Set up the database:
```sh
# Create the database
psql -c "CREATE DATABASE econnect_db;"

# Run migrations (if applicable)
npm run migrations
```

## Development

Start the development server:

```sh
npm run dev
```

This will start both the backend API and frontend development server with hot module replacement.

## Build for Production

```sh
npm run build
```

## Run in Production

```sh
npm run start
```

## Project Structure

```
project root
|- backend/   # Express backend API
|- src/       # Vue frontend application
|  |- assets/   # Static assets (images, fonts)
|  |- components/ # Reusable Vue components
|  |- views/    # Vue route components
|  |- stores/   # Pinia/Vuex stores
|- lib/       # Shared code between frontend and backend
|- public/    # Public static files
```

## Features in Detail

### Environmental Challenges
Users can participate in various eco-friendly challenges like reducing plastic usage, using public transportation, or planting trees.

### Personalized Goals
Users can set their own sustainability goals with customized targets and timeframes.

### Reward System
Complete challenges and goals to earn points and unlock badges that showcase your environmental commitment.

### Community Leaderboard
See how your efforts compare to others in the community and get motivated to do more.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support or inquiries, please contact us at econnect@gmail.com.