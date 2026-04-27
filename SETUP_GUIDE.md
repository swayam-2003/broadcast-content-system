# Setup Guide

## Prerequisites

1. PostgreSQL 12+ installed and running
2. Node.js 14+ installed
3. npm 6+

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Database Setup

Create the database:

```bash
createdb broadcast_system
```

Or using psql:

```sql
CREATE DATABASE broadcast_system;
```

## Step 3: Run Migrations

```bash
npm run migrate
```

This creates the necessary tables and indexes.

## Step 4: Configure Environment

Update `.env` file with your database credentials:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=broadcast_system
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=generate_a_random_secret_min_32_chars
```

## Step 5: Start the Server

Development mode with auto-reload:

```bash
npm run dev
```

Or production mode:

```bash
npm start
```

Server runs on http://localhost:3000

## Testing the API

### 1. Register Users

Teacher:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "password123",
    "name": "Ms. Smith",
    "role": "teacher"
  }'
```

Principal:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "principal@school.com",
    "password": "password123",
    "name": "Mr. Johnson",
    "role": "principal"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "password123"
  }'
```

Save the returned `token` for authenticated requests.

### 3. Upload Content (Teacher)

```bash
curl -X POST http://localhost:3000/api/content/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@path/to/image.jpg" \
  -F "title=Math Chapter 1" \
  -F "subject=maths" \
  -F "startTime=2026-04-26T08:00:00Z" \
  -F "endTime=2026-04-26T18:00:00Z" \
  -F "rotationOrder=0" \
  -F "rotationDuration=5"
```

### 4. View Pending Content (Principal)

```bash
curl -X GET http://localhost:3000/api/approval/pending \
  -H "Authorization: Bearer PRINCIPAL_TOKEN"
```

### 5. Approve Content (Principal)

```bash
curl -X POST http://localhost:3000/api/approval/approve/CONTENT_ID \
  -H "Authorization: Bearer PRINCIPAL_TOKEN"
```

### 6. Get Live Content (Public)

```bash
curl -X GET http://localhost:3000/api/content/live/TEACHER_ID
```

## Using Postman

Import `postman-collection.json` into Postman to test all endpoints:

1. Open Postman
2. Import Collection -> Upload `postman-collection.json`
3. Set environment variables:
   - baseUrl: http://localhost:3000
   - authToken: teacher's JWT token
   - principalToken: principal's JWT token
   - contentId: ID from upload response
   - teacherId: ID of teacher

## File Upload

- Supported formats: JPG, PNG, GIF
- Max file size: 10MB
- Files stored in `/uploads` directory
- Accessible at `http://localhost:3000/uploads/filename`

## Database

Tables created:
- `users`: Teacher and principal accounts
- `content`: Uploaded content with metadata

Indexes created for optimal performance:
- idx_content_teacher_subject_status
- idx_content_status_time_window
- idx_content_subject
- idx_users_email

## Troubleshooting

### Database connection fails

Check:
- PostgreSQL is running
- Database credentials in .env are correct
- Database exists: `psql -l | grep broadcast_system`

### Migrations fail

Run:
```bash
npm run migrate
```

Check for SQL errors in console output.

### File upload fails

Check:
- `/uploads` directory exists
- Directory has write permissions
- File size under 10MB
- File type is jpg, png, or gif

### Authentication fails

Check:
- Token is included in Authorization header: `Bearer TOKEN`
- Token is from recent login (expires in 24h)
- Token is for correct user role (teacher vs principal)

## API Documentation

Full API details in `postman-collection.json` and `architecture-notes.txt`

Key Endpoints:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/content/upload (teacher)
- GET /api/content/my-content (teacher)
- GET /api/approval/pending (principal)
- POST /api/approval/approve/:contentId (principal)
- POST /api/approval/reject/:contentId (principal)
- GET /api/content/live/:teacherId (public)

## Performance Tips

1. Database indexes are already configured
2. Queries use efficient filtering
3. No N+1 problems in rotation calculation
4. Can handle 1000+ content items per teacher
5. Stateless design enables horizontal scaling

## Security

- Passwords hashed with bcryptjs (10 rounds)
- JWT tokens with expiry (24h)
- Role-based access control on protected endpoints
- File upload validated by type and size
- SQL injection prevented with parameterized queries

## Logging

Check server logs for:
- User actions (login, upload, approval)
- Errors and validation failures
- Database query performance

## Next Steps

1. Set up automated backups for PostgreSQL
2. Configure SSL/TLS for production
3. Add API rate limiting
4. Set up monitoring/alerting
5. Deploy to production server
