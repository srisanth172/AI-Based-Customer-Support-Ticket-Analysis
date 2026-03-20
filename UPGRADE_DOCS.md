# AI Customer Support Ticket Analysis System

A full-stack modern AI-powered customer support system with intelligent ticket triage, priority scoring, role-based access, and OpenRouter chatbot integration.

---

## Features

### Authentication System
- **Login**: Email + password + puzzle verification → [login.html](/login)
- **Register**: Create customer/admin accounts → [register.html](/register)
- **Forgot Password**: Email verification code flow with SMTP fallback → [forgot_password.html](/forgot-password)

### Customer Dashboard → [index.html](/customer)
- Submit support tickets with Title, Description, Category (Billing/Technical/General), Email
- Random ticket ID generation (TKT-XXXXXX)
- Track ticket status by ID
- AI Chat Assistant powered by OpenRouter:
  - Answers questions first
  - Only creates ticket after confirmation
  - Responds to ticket status queries

### Admin Dashboard → [admin.html](/admin)
- **Statistics Cards**:
  - Total Tickets
  - Open Tickets
  - Negative Sentiment Tickets
- **Sentiment Chart**: Visual bar chart showing positive/neutral/negative distribution
- **Recurring Issues List**: AI-detected repeated problem patterns by category
- **Priority Ticket Queue**:
  - Columns: Ticket ID, Title, Category, Sentiment, Priority, Status, Actions
  - Real-time status updates (Open, In Progress, Resolved)
  - Auto-refresh every 12 seconds

### Priority Scoring System

Tickets receive a numeric priority score based on:

| Factor | Score | Rules |
|--------|-------|-------|
| **Sentiment** | 1–5 | Positive: +1, Neutral: +3, Negative: +5 |
| **Ticket Age** | 1–5 | 0–1 days: +1, 2–3 days: +3, 4+ days: +5 |
| **Category** | 1–4 | General: +1, Billing: +3, Technical: +4 |
| **Duplicates** | 0–4 | 0 similar: 0, 1–2 similar: +2, 3+ similar: +4 |

**Priority Levels:**
- **Low**: 0–5 points
- **Medium**: 6–10 points
- **High**: 11+ points

**Ticket Sorting Order:**
1. Resolved tickets → Bottom
2. High priority → Top
3. Status (Open/In Progress/Resolved)
4. Oldest first within same priority/status

---

## Project Structure

```
project-root/
├── backend/
│   ├── app.py              # Flask routes + page serving
│   ├── auth.py             # Login, register, password reset, JWT tokens
│   ├── ticket_handler.py   # Ticket CRUD, priority scoring, sorting
│   ├── ai_module.py        # Sentiment (TextBlob), category (scikit-learn), OpenRouter chat
│   ├── models.py           # SQLAlchemy ORM (User, Ticket, TicketHistory)
│   ├── config.py           # Settings + .env loader (OpenRouter key, SMTP config)
│   ├── utils.py            # Helpers (text preprocessing, datetime utils)
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── login.html          # Login page with puzzle verification
│   ├── register.html       # User registration page
│   ├── forgot_password.html # Password reset flow (request, verify, reset)
│   ├── index.html          # Customer dashboard (submit ticket, status, chatbot)
│   ├── admin.html          # Admin dashboard (queue, analytics, recurring issues)
│   ├── script.js           # Main frontend logic (page-specific init, API calls)
│   ├── chatbot.js          # Chat assistant client (conversation, confirmation flow)
│   └── style.css           # Modern glass-dashboard UI with gradient buttons and pills
├── database/
│   └── support_system.db   # SQLite database (auto-created on first run)
├── .env                    # Local secrets (OpenRouter API key, SMTP config)
├── .gitignore              # Git ignore rules
└── test_smoke.py           # Automated backend smoke tests
```

---

## API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/puzzle` | Generate login puzzle | No |
| `POST` | `/login` or `/auth/login` | Login with email + puzzle | No |
| `POST` | `/register` or `/auth/register` | Create new user account | No |
| `POST` | `/forgot-password/request` | Request password reset code | No |
| `POST` | `/forgot-password/verify` | Verify reset code | No |
| `POST` | `/forgot-password/reset` | Reset password with code | No |
| `GET` | `/auth/me` | Get current user info | Yes |

### Ticket Management Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `POST` | `/create_ticket` or `/submit_ticket` | Create new ticket | Customer | Customer |
| `GET` | `/check_ticket_status/<ticket_id>` | Get ticket status by ID (path param) | Customer | Customer |
| `GET` | `/check_ticket_status?ticket_id=...` | Get ticket status by ID (query param) | Customer | Customer |
| `GET` | `/get_tickets` or `/tickets` | List all tickets with priority sorting | Admin | Admin |
| `PUT` | `/update_ticket_status/<ticket_id>` | Update ticket status (path param) | Admin | Admin |
| `PUT` | `/update_ticket_status` | Update ticket status (JSON body with `ticket_id`) | Admin | Admin |

### Analytics Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `GET` | `/analytics/overview` | Dashboard metrics (counts, sentiment distribution) | Admin | Admin |
| `GET` | `/analytics/recurring` | Recurring issue report (grouped similar tickets) | Admin | Admin |

### Chatbot Routes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| `POST` | `/chatbot` or `/chatbot/ask` | Chat with AI assistant (OpenRouter) | Customer | Customer |

### Page Routes

| Method | Endpoint | Response | Description |
|--------|----------|----------|-------------|
| `GET` | `/` or `/login` | `login.html` | Login page |
| `GET` | `/register` | `register.html` | Registration page |
| `GET` | `/forgot-password` | `forgot_password.html` | Password reset page |
| `GET` | `/customer` | `index.html` | Customer dashboard |
| `GET` | `/admin` | `admin.html` | Admin dashboard |

---

## Setup & Run

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:

```env
SECRET_KEY=your-secret-key-here
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-smtp-password
SMTP_SENDER=your-email@gmail.com
```

If `SMTP_*` values are not configured, password reset codes are printed to the terminal instead of emailed.

### 3. Start the Server
```bash
cd backend
python app.py
```

Server runs at: **http://127.0.0.1:5000**

### 4. Access the Application

- **Login**: http://127.0.0.1:5000/login
- **Register**: http://127.0.0.1:5000/register
- **Forgot Password**: http://127.0.0.1:5000/forgot-password
- **Customer Dashboard**: http://127.0.0.1:5000/customer (after customer login)
- **Admin Dashboard**: http://127.0.0.1:5000/admin (after admin login)

### Demo Credentials

**Customer Account:**
- Email: `customer@support.local`
- Password: `customer123`

**Admin Account:**
- Email: `admin@support.local`
- Password: `admin123`

---

## Priority Scoring Algorithm

The priority score is calculated as:

```python
score = sentiment_points + age_points + category_points + duplicate_points

priority_level = 
    "high" if score >= 11
    "medium" if 6 <= score < 11
    "low" if score < 6
```

**Example:**
- Billing ticket (3 points) + Negative sentiment (5 points) + 2 days old (3 points) = **11 points → High priority**

---

## AI Features

### Sentiment Analysis
- **Library**: TextBlob
- **Output**: `positive`, `neutral`, `negative`
- **Usage**: Priority scoring, admin analytics chart

### Category Prediction
- **Model**: TF-IDF + Logistic Regression (scikit-learn)
- **Categories**: Billing, Technical, General
- **Auto-training**: On app startup with sample dataset

### Duplicate Detection
- **Method**: TF-IDF + Cosine Similarity
- **Threshold**: 0.78+ similarity score marks duplicate
- **Usage**: Priority boosting for repeated issues

### Recurring Issues
- **Method**: Group tickets by category + preprocessed title
- **Output**: Sorted list by frequency
- **Display**: Admin dashboard recurring list

### Chatbot (OpenRouter)
- **Model**: Configured via `.env` (default: `anthropic/claude-3.5-sonnet`)
- **Workflow**:
  1. User asks question
  2. AI responds naturally
  3. If complaint detected, AI asks: "Would you like me to create a ticket?"
  4. On confirmation, ticket is auto-created with escalation
- **Intent Detection**: JSON-structured response parsing (complaint, human agent request, confidence)

---

## UI Design

### Modern SaaS Glass-Dashboard Theme
- **Typography**: Plus Jakarta Sans (body), Sora (headings)
- **Color Palette**:
  - Primary: Blue gradient (`#1d4ed8 → #06b6d4 → #22d3ee`)
  - Background: Multi-layer radial gradients
  - Cards: Glass-morphism effect with blur + opacity
- **Components**:
  - Gradient buttons with hover lift
  - Status/priority pills with color coding
  - Responsive grid layouts (flexbox + CSS grid)
  - Chat bubble interface for chatbot
  - Canvas-based sentiment chart
  - Smooth hover effects and transitions

### Glassmorphism Features
- Semi-transparent card backgrounds with `backdrop-filter: blur(14px)`
- Soft shadows and border overlays
- Layered gradients for depth
- Rounded corners (12–18px radius)

---

## Testing

### Automated Smoke Tests
Run the test script to validate all API endpoints and priority logic:

```bash
python test_smoke.py
```

Test coverage:
- Customer/admin login with puzzle
- Ticket creation with priority scoring
- Status lookup (path + query param)
- Chatbot status query response
- User registration
- Password reset flow
- Admin ticket listing
- Admin status update

---

## Tech Stack

**Backend:**
- Flask (web framework)
- SQLAlchemy (ORM)
- SQLite (database)
- TextBlob (sentiment analysis)
- scikit-learn (category prediction)
- OpenRouter API (chatbot intelligence)

**Frontend:**
- Vanilla HTML5/CSS3/JavaScript (no frameworks)
- localStorage for session persistence
- Fetch API for HTTP requests
- Canvas API for charts

**Security:**
- JWT-based token authentication (itsdangerous)
- Password hashing (werkzeug)
- Login puzzle verification (anti-bot)
- Role-based access control

---

## Development Notes

### Route Aliases
All requested route names are supported:
- `/login` → works alongside `/auth/login`
- `/register` → works alongside `/auth/register`
- `/create_ticket` → works alongside `/submit_ticket`
- `/get_tickets` → works alongside `/tickets`
- `/update_ticket_status` → works alongside `/tickets/<id>/status`
- `/check_ticket_status` → works alongside `/tickets/status/<id>`
- `/chatbot` → works alongside `/chatbot/ask`

Both old and new route patterns remain functional for backward compatibility.

### Status Values
Valid ticket statuses:
- `open` (default)
- `in-progress` (admin update)
- `resolved` (admin update)

Internal escalation logic may set status to `escalated` based on sentiment/age, but this is not directly selectable by admin (internal-only flag).

### Database Migrations
Schema changes are handled via `models.py` migration helpers:
- Existing tables are checked for missing columns
- `ALTER TABLE` statements auto-run on `init_db()`
- Indexes are created if absent

---

## Future Enhancements
- [ ] Real-time WebSocket ticket updates
- [ ] Email notifications for ticket status changes
- [ ] Customer ticket history dashboard
- [ ] Bulk ticket actions (close multiple, tag, export CSV)
- [ ] Advanced analytics charts (time-series trends, category breakdown)
- [ ] SLA tracking and breach alerts
- [ ] File attachment support for tickets
- [ ] Multi-language chatbot support

---

**For support or feature requests, open an issue or contact the development team.**
