# Broadcast Content System

A backend-only content broadcasting system for modern educational environments where teachers distribute subject-based content (question papers, announcements, materials) to students.

## Project Structure

```
src/
├── controllers/        # Request handlers
├── services/          # Business logic
├── middlewares/       # Express middleware
├── models/           # Database queries
├── routes/           # API route definitions
├── utils/            # Helper functions and utilities
├── config/           # Configuration
├── migrations/       # Database migrations
└── app.js           # Express app setup
```

## Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)
- npm

## Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create PostgreSQL database:

```bash
createdb broadcast_system
```

3. Update `.env` with your database credentials

4. Run migrations:

```bash
npm run migrate
```

5. Start the server:

```bash
npm run dev
```

Server runs on http://localhost:3000

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Content Management (Teacher)

- `POST /api/content/upload` - Upload content
- `GET /api/content/my-content` - List own content

### Approval (Principal)

- `GET /api/approval/pending` - List pending content
- `GET /api/approval/all` - List all content
- `POST /api/approval/approve/:contentId` - Approve content
- `POST /api/approval/reject/:contentId` - Reject content

### Broadcasting (Public)

- `GET /api/content/live/:teacherId` - Get active content for teacher

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Password Hashing**: bcryptjs
- **File Upload**: multer
- **Logging**: Winston

## Database Schema

See `architecture-notes.txt` for detailed schema design and implementation decisions.

## Environment Variables

```
NODE_ENV           - Application environment (development/production)
PORT               - Server port (default: 3000)
DB_HOST            - PostgreSQL host
DB_PORT            - PostgreSQL port
DB_NAME            - Database name
DB_USER            - Database user
DB_PASSWORD        - Database password
JWT_SECRET         - JWT signing secret (min 32 chars)
JWT_EXPIRY         - Token expiry (default: 24h)
UPLOAD_DIR         - Upload directory
MAX_FILE_SIZE      - Max file size in bytes (default: 10MB)
```

## Key Features

- **Authentication & RBAC**: JWT-based auth with role-based access control
- **Content Upload**: File validation, local storage with metadata
- **Approval Workflow**: Principal-based content approval system
- **Subject-based Rotation**: Per-subject content rotation with configurable durations
- **Public API**: Anonymous access to active content
- **Edge Case Handling**: Proper handling of no content, scheduling boundaries

## Implementation Notes

This implementation follows clean code principles with:
- Separation of concerns (controllers, services, models)
- DRY principle across all modules
- Proper error handling and validation
- SQL injection prevention via parameterized queries
- Structured logging with Winston
