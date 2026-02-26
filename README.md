# AI-Powered Customer Support System

A modular full-stack customer support platform with AI ticket analysis, chatbot escalation, recurring issue insights, and authentication skeleton.

## Project Structure

- `frontend/`
  - `index.html` - customer ticket submission + chatbot
  - `admin.html` - support dashboard with ticket actions and analytics
  - `style.css` - responsive modern styles
  - `script.js` - customer/admin frontend logic
  - `chatbot.js` - chatbot interaction logic
- `backend/`
  - `app.py` - Flask app and REST APIs
  - `ai_module.py` - category prediction, sentiment, duplicates, chatbot response logic
  - `auth.py` - authentication and role-based access skeleton
  - `ticket_handler.py` - ticket CRUD service layer and recurring issue report
  - `models.py` - SQLAlchemy models and DB session setup
  - `utils.py` - preprocessing and helper utilities
  - `config.py` - app settings and database path
- `database/`
  - `schema.sql` - relational schema reference
- `requirements.txt` - Python dependencies

## Features

- AI/NLP:
  - ticket category prediction
  - sentiment analysis
  - duplicate ticket detection
  - recurring issue identification
- Chatbot:
  - automated responses
  - escalation to human ticket when confidence is low or sentiment is negative
- Admin:
  - ticket queue with status updates
  - recurring issue analytics
- Auth skeleton:
  - register, verify-email, login endpoints
  - role-based decorator helper for secured routes

## Setup

1. Create/activate virtual environment
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Run backend:
   - `cd backend`
   - `python app.py`
4. Open in browser:
   - Customer portal: `http://127.0.0.1:5000/`
   - Admin dashboard: `http://127.0.0.1:5000/admin`

## Key APIs

- `POST /submit_ticket`
- `GET /tickets`
- `PUT /tickets/<ticket_id>/status`
- `GET /analytics/recurring`
- `POST /chatbot/ask`
- `POST /auth/register`
- `POST /auth/verify-email`
- `POST /auth/login`
