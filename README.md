# AI-Based Customer Support Ticket Analysis

An AI-powered customer support ticketing platform with a React frontend and an Express/MongoDB backend. The app supports customer and admin workflows, AI-assisted replies, real-time chat, ticket tracking, notifications, and analytics.

## Features

- Customer registration, login, email verification, and password reset
- Admin and customer dashboards
- Create, view, update, and track support tickets
- AI assistance for ticket analysis and suggested replies
- Real-time live chat with Socket.IO
- Notifications for ticket and support activity
- Analytics and reporting views
- File uploads and cloud asset storage
- Google sign-in support
- Email delivery for account and support workflows
- Scheduled automation tasks and database utilities

## Technologies Used

### Frontend
- React 18
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- Axios
- Socket.IO Client
- Chart.js and Recharts
- Lucide React and Heroicons
- React Hot Toast
- Canvas Confetti

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- Socket.IO
- JWT authentication
- bcryptjs
- Nodemailer
- Cloudinary
- Multer
- express-session and connect-mongo
- node-cron
- express-validator
- dotenv

### AI and External Services
- Groq API
- OpenRouter API
- Google OAuth
- Brevo SMTP/email delivery
- Cloudinary file storage

## Project Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── seed.js
│   ├── migrate.js
│   └── package.json
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+ recommended
- npm
- MongoDB connection string if you are not using the in-memory mode

### Install Dependencies

From the project root:

```bash
npm install
npm run install:all
```

### Environment Variables

Create or update the following files:

#### `backend/.env`

```env
ALLOW_IN_MEMORY_DB=true
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PASS=your_brevo_smtp_password_here
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_brevo_username_here
EMAIL_FROM=your_email@example.com
FRONTEND_URL=http://localhost:5173
FRONTEND_URLS=http://localhost:5173,http://localhost:3000,https://your-frontend-domain.example/
GOOGLE_CLIENT_ID=your_google_client_id_here
GROQ_API_KEY=your_groq_api_key_here
JWT_RESET_SECRET=replace_with_a_strong_random_secret
MONGODB_URI="mongodb+srv://username:password@cluster0.example.mongodb.net/?appName=Cluster0"
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_APP_NAME="Support System Backend"
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_MODEL=openai/gpt-4o-mini
PORT=5003
```

#### `Frontend/.env`

```env
VITE_API_URL=http://localhost:5003
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Available Scripts

Run these from the project root:

```bash
npm run dev
```
Starts the backend and frontend together in development mode.

```bash
npm run start
```
Starts the backend and frontend using the production-style start command.

```bash
npm run seed
```
Seeds the backend database.

```bash
npm run install:all
```
Installs dependencies for both the backend and frontend.

### Frontend-only

```bash
npm --prefix Frontend run dev
npm --prefix Frontend run build
npm --prefix Frontend run preview
```

### Backend-only

```bash
npm --prefix backend run dev
npm --prefix backend run start
npm --prefix backend run seed
```

## Main Application Areas

- Landing page with sign-up and sign-in entry points
- Customer dashboard and ticket views
- Admin dashboard with support operations tools
- Live chat and chat widgets
- Notification center
- AI copilot and suggested replies for support work
- Analytics and reporting screens

## Notes

- The backend includes utilities for seed, cleanup, migration, and password reset workflows.
- The project is set up to support both local development and external service integrations.
- Some features depend on API keys and a configured MongoDB instance.

## License

MIT

## Screenshots

Add visual screenshots of the running application below. To capture screenshots locally, start the frontend (`npm --prefix Frontend run dev`) and open `http://localhost:5173` in a browser. Save screenshots into `docs/screenshots/` and reference them here:

- Landing page: `docs/screenshots/landing.png`
- Customer dashboard: `docs/screenshots/customer-dashboard.png`
- Admin dashboard: `docs/screenshots/admin-dashboard.png`

(I can capture these now and add them to the repo if you want — I will take live screenshots from the running frontend and show them here.)
