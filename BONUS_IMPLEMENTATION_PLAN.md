# GET /api/content/my-content - Complete Flow Analysis

## 🔄 How This Endpoint Works

### Endpoint Details
```
GET /api/content/my-content
Authorization: Bearer {{teacherToken}}
```

### Flow Diagram
```
Request arrives
    ↓
[1] authMiddleware.verifyToken
    - Extracts JWT token from Authorization header
    - Decodes and verifies token
    - Attaches req.user = { userId, email, role }
    ↓
[2] rbacMiddleware.requireRole('teacher')
    - Checks req.user.role === 'teacher'
    - If not teacher → 403 Forbidden
    ↓
[3] contentController.getMyContent(req, res, next)
    - Calls contentService.getTeacherContent(req.user.userId)
    ↓
[4] contentService.getTeacherContent(userId)
    - Calls contentModel.findByTeacher(userId)
    ↓
[5] contentModel.findByTeacher(userId)
    - Executes SQL:
      SELECT * FROM content 
      WHERE uploaded_by = $1 
      ORDER BY created_at DESC
    - Returns all content items uploaded by this teacher
    ↓
[6] Response sent
    {
      "success": true,
      "count": 3,
      "content": [
        {
          "id": "uuid",
          "title": "Calculus Chapter 1",
          "subject": "maths",
          "status": "pending" | "approved" | "rejected",
          "rejection_reason": null,
          "rotation_order": 0,
          "rotation_duration": 5,
          "created_at": "2026-04-27T22:00:00Z",
          ...
        },
        ...
      ]
    }
```

## 📊 What This Shows (For Teacher)

| Field | Value | Meaning |
|-------|-------|---------|
| `id` | UUID | Content identifier |
| `title` | String | Content name |
| `subject` | "maths" | Category |
| `status` | "pending" | Waiting for approval |
| `status` | "approved" | Live/broadcasting |
| `status` | "rejected" | Rejected with reason |
| `rejection_reason` | String or null | Why it was rejected |
| `rotation_order` | 0 | When it shows in rotation |
| `rotation_duration` | 5 | Minutes active before next item |
| `file_path` | String | Where file stored |

## ✅ What Teacher Can See

1. **All content uploaded by them** (regardless of status)
2. **Current status** (pending/approved/rejected)
3. **Rejection reasons** (if rejected, why)
4. **Upload timestamps** (when uploaded)
5. **Rotation settings** (order and duration they set)

## ❌ What Teacher CANNOT See

- Content from other teachers
- File paths (security)
- Who approved it
- When it was approved

---

# BONUS FEATURES PLAN

## 🎁 Bonus 1: Redis Caching (Est. 30 min)

### What It Does
Cache `/api/content/live` results for 1 minute to reduce database load

### Implementation Steps

**Step 1: Install Redis package**
```bash
npm install redis
```

**Step 2: Create cache service** (`src/services/cache.service.js`)
```javascript
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

class CacheService {
  async get(key) {
    const cached = await client.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key, value, ttl = 60) {
    await client.setEx(key, ttl, JSON.stringify(value));
  }

  async delete(key) {
    await client.del(key);
  }
}

module.exports = new CacheService();
```

**Step 3: Update scheduler service** (`src/services/scheduler.service.js`)
```javascript
const cacheService = require('./cache.service');

async getCurrentActiveContent(teacherId) {
  // Try cache first
  const cacheKey = `live:${teacherId}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  // If not cached, calculate (existing logic)
  const now = new Date();
  const eligibleContent = await contentModel.findEligibleContent(teacherId, now);
  // ... rest of algorithm ...

  // Cache result for 1 minute
  await cacheService.set(cacheKey, activeContent, 60);
  return activeContent;
}
```

**Step 4: Invalidate cache on approval**
```javascript
// In approval.service.js
async approveContent(contentId, principalId) {
  const content = await contentModel.findById(contentId);
  
  // ... approval logic ...
  
  // Invalidate cache for this teacher
  await cacheService.delete(`live:${content.uploaded_by}`);
  
  return approvedContent;
}
```

**Step 5: Update .env**
```
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Expected Benefit
- Reduce DB queries by 60% for hot teachers
- Response time: 1ms (cache hit) vs 50ms (DB query)

---

## 🎁 Bonus 2: Rate Limiting (Est. 20 min)

### What It Does
Protect public `/api/content/live` from abuse

### Implementation Steps

**Step 1: Install rate limiter**
```bash
npm install express-rate-limit
```

**Step 2: Create limiter** (`src/middlewares/rate-limit.middleware.js`)
```javascript
const rateLimit = require('express-rate-limit');

const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { publicLimiter };
```

**Step 3: Apply to public endpoint** (`src/routes/broadcast.routes.js`)
```javascript
const { publicLimiter } = require('../middlewares/rate-limit.middleware');

router.get(
  '/live/:teacherId',
  publicLimiter,  // ← Add this
  (req, res, next) => broadcastController.getLiveContent(req, res, next)
);
```

### Expected Benefit
- Prevent DDoS attacks
- Fair usage for all students
- Response: 429 Too Many Requests if exceeded

---

## 🎁 Bonus 3: S3 File Upload (Est. 45 min)

### What It Does
Store uploaded files in AWS S3 instead of local disk

### Implementation Steps

**Step 1: Install AWS SDK**
```bash
npm install aws-sdk
```

**Step 2: Create S3 service** (`src/services/s3.service.js`)
```javascript
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

class S3Service {
  async uploadFile(file) {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: `${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const result = await s3.upload(params).promise();
    return {
      filename: params.Key,
      filePath: result.Location,
    };
  }

  async deleteFile(key) {
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    }).promise();
  }
}

module.exports = new S3Service();
```

**Step 3: Update upload middleware** (`src/middlewares/upload.middleware.js`)
```javascript
// Use memoryStorage instead of diskStorage for S3
const storage = multer.memoryStorage();
```

**Step 4: Update content service** (`src/services/content.service.js`)
```javascript
const s3Service = require('./s3.service');

async uploadContent(file, userId, contentMetadata) {
  // ... validation ...

  // Upload to S3
  const s3Result = await s3Service.uploadFile(file);

  // Create database record
  const contentData = {
    title,
    subject,
    filePath: s3Result.filePath,  // S3 URL
    fileType: file.mimetype,
    fileSize: file.size,
    uploadedBy: userId,
    // ... rest ...
  };

  return contentModel.create(contentData);
}
```

**Step 5: Update .env**
```
AWS_ACCESS_KEY=your_key
AWS_SECRET_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name
```

### Expected Benefit
- Scalability: No disk space limits
- CDN delivery: Files served from edge locations
- Reliability: AWS infrastructure

---

## 🎁 Bonus 4: Subject-wise Analytics (Est. 40 min)

### What It Does
Track which subjects are most popular and accessed

### Implementation Steps

**Step 1: Create analytics table**
```sql
CREATE TABLE IF NOT EXISTS content_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_subject ON content_analytics(subject);
```

**Step 2: Create analytics service** (`src/services/analytics.service.js`)
```javascript
const { query } = require('../utils/db');

class AnalyticsService {
  async recordAccess(contentId, subject) {
    await query(
      `INSERT INTO content_analytics (content_id, subject, access_count, last_accessed)
       VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (content_id) DO UPDATE
       SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP`,
      [contentId, subject]
    );
  }

  async getMostActiveSubject() {
    const result = await query(
      `SELECT subject, SUM(access_count) as total_accesses
       FROM content_analytics
       GROUP BY subject
       ORDER BY total_accesses DESC
       LIMIT 1`
    );
    return result.rows[0];
  }

  async getSubjectStats() {
    const result = await query(
      `SELECT subject, SUM(access_count) as total, COUNT(*) as items
       FROM content_analytics
       GROUP BY subject
       ORDER BY total DESC`
    );
    return result.rows;
  }
}

module.exports = new AnalyticsService();
```

**Step 3: Track access** (`src/controllers/broadcast.controller.js`)
```javascript
const analyticsService = require('../services/analytics.service');

async getLiveContent(req, res, next) {
  try {
    const { teacherId } = req.params;
    const activeContent = await schedulerService.getCurrentActiveContent(teacherId);

    // Track analytics for each active item
    for (const item of activeContent) {
      await analyticsService.recordAccess(item.id, item.subject);
    }

    // ... rest of response ...
  } catch (err) {
    next(err);
  }
}
```

**Step 4: Create analytics endpoint** (`src/controllers/analytics.controller.js`)
```javascript
class AnalyticsController {
  async getStats(req, res, next) {
    try {
      const stats = await analyticsService.getSubjectStats();
      res.json({
        success: true,
        stats,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMostActive(req, res, next) {
    try {
      const mostActive = await analyticsService.getMostActiveSubject();
      res.json({
        success: true,
        mostActive,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticsController();
```

**Step 5: Add routes** (`src/routes/analytics.routes.js`)
```javascript
const { Router } = require('express');
const analyticsController = require('../controllers/analytics.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const rbacMiddleware = require('../middlewares/rbac.middleware');

const router = Router();

// Principal only
router.get(
  '/stats',
  authMiddleware.verifyToken,
  rbacMiddleware.requireRole('principal'),
  (req, res, next) => analyticsController.getStats(req, res, next)
);

router.get(
  '/most-active',
  authMiddleware.verifyToken,
  rbacMiddleware.requireRole('principal'),
  (req, res, next) => analyticsController.getMostActive(req, res, next)
);

module.exports = router;
```

**Step 6: Register routes** (`src/app.js`)
```javascript
const analyticsRoutes = require('./routes/analytics.routes');
app.use('/api/analytics', analyticsRoutes);
```

### New Endpoints
```
GET /api/analytics/stats          (Principal only)
GET /api/analytics/most-active    (Principal only)
```

### Expected Benefit
- Identify popular subjects
- Allocate resources efficiently
- Track engagement patterns

---

## 🎁 Bonus 5: Pagination & Filters (Est. 35 min)

### What It Does
Filter and paginate content lists by subject, teacher, or status

### Implementation Steps

**Step 1: Update content model** (`src/models/content.model.js`)
```javascript
async findWithFilters(filters = {}, page = 1, limit = 10) {
  const { subject, teacher, status } = filters;
  let query = 'SELECT * FROM content WHERE 1=1';
  const params = [];
  let paramCount = 1;

  if (subject) {
    query += ` AND subject = $${paramCount}`;
    params.push(subject);
    paramCount++;
  }

  if (teacher) {
    query += ` AND uploaded_by = $${paramCount}`;
    params.push(teacher);
    paramCount++;
  }

  if (status) {
    query += ` AND status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  // Pagination
  const offset = (page - 1) * limit;
  query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);

  const result = await query(query, params);
  
  // Get total count
  const countQuery = 'SELECT COUNT(*) as total FROM content WHERE 1=1' +
    (subject ? ' AND subject = $1' : '') +
    (teacher ? ' AND uploaded_by = $2' : '') +
    (status ? ' AND status = $3' : '');
  
  const countResult = await query(countQuery, params.slice(0, paramCount - 2));

  return {
    items: result.rows,
    total: parseInt(countResult.rows[0].total),
    page,
    limit,
    pages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
  };
}
```

**Step 2: Update approval controller** (`src/controllers/approval.controller.js`)
```javascript
async getPending(req, res, next) {
  try {
    const { page = 1, limit = 10, subject } = req.query;

    const result = await approvalService.getPendingContent(
      { subject },
      parseInt(page),
      parseInt(limit)
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}
```

**Step 3: New endpoint** 
```
GET /api/approval/all?page=1&limit=10&subject=maths&status=approved
```

### Expected Benefit
- Faster data loading (pagination)
- Better search (filters)
- Improved UX

---

## 📋 Quick Implementation Priority

### Easy (Do first) - 20 min
- ✅ Rate Limiting
- ✅ Pagination & Filters

### Medium - 30 min each
- ✅ Redis Caching
- ✅ Subject Analytics

### Advanced - 45 min
- ✅ S3 Upload

---

## 💡 Recommended Bonus Order

1. **Start**: Rate Limiting (simplest, lowest risk)
2. **Then**: Pagination & Filters (improves UX)
3. **Then**: Redis Caching (performance boost)
4. **Then**: Analytics (tracking feature)
5. **Finally**: S3 (if time permits)

---

## 🎯 Expected Score Impact

- All 5 bonuses: +50% bonus points
- Any 3: +30% bonus
- Any 1: +10% bonus

---

## ✅ Implementation Checklist

**Before starting bonuses:**
- [ ] Core system works (all 11 todos done)
- [ ] Rotation demo working
- [ ] Postman collection complete
- [ ] Database has data

**For each bonus:**
- [ ] Install required packages
- [ ] Write service logic
- [ ] Add routes/endpoints
- [ ] Update .env if needed
- [ ] Test in Postman
- [ ] Document in README

---

**Ready to implement bonuses? Start with Rate Limiting!**
