const { query } = require('../utils/db');
const { v4: uuid } = require('uuid');

class ContentModel {
  async create(contentData) {
    const {
      title,
      description,
      subject,
      filePath,
      fileType,
      fileSize,
      uploadedBy,
      startTime,
      endTime,
      rotationOrder,
      rotationDuration,
    } = contentData;

    const id = uuid();
    const result = await query(
      `INSERT INTO content 
       (id, title, description, subject, file_path, file_type, file_size, uploaded_by, 
        status, start_time, end_time, rotation_order, rotation_duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        id,
        title,
        description || null,
        subject,
        filePath,
        fileType,
        fileSize,
        uploadedBy,
        'pending',
        startTime || null,
        endTime || null,
        rotationOrder || 0,
        rotationDuration || 5,
      ]
    );

    return result.rows[0];
  }

  async findById(contentId) {
    const result = await query('SELECT * FROM content WHERE id = $1', [contentId]);
    return result.rows[0] || null;
  }

  async findByTeacher(teacherId) {
    const result = await query(
      'SELECT * FROM content WHERE uploaded_by = $1 ORDER BY created_at DESC',
      [teacherId]
    );
    return result.rows;
  }

  async findPending() {
    const result = await query(
      'SELECT * FROM content WHERE status = $1 ORDER BY created_at ASC',
      ['pending']
    );
    return result.rows;
  }

  async findAll() {
    const result = await query(
      'SELECT * FROM content ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async findEligibleContent(teacherId, currentTime) {
    const result = await query(
      `SELECT * FROM content 
       WHERE uploaded_by = $1 
       AND status = $2
       AND start_time <= $3
       AND end_time >= $3
       ORDER BY subject, rotation_order ASC`,
      [teacherId, 'approved', currentTime]
    );
    return result.rows;
  }

  async approve(contentId, principalId) {
    const result = await query(
      `UPDATE content 
       SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      ['approved', principalId, contentId]
    );
    return result.rows[0] || null;
  }

  async reject(contentId, reason) {
    const result = await query(
      `UPDATE content 
       SET status = $1, rejection_reason = $2
       WHERE id = $3
       RETURNING *`,
      ['rejected', reason, contentId]
    );
    return result.rows[0] || null;
  }

  async findWithFilters(filters = {}, page = 1, limit = 10) {
    const { subject, teacher, status } = filters;
    let sqlQuery = 'SELECT * FROM content WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (subject) {
      sqlQuery += ` AND subject = $${paramCount}`;
      params.push(subject);
      paramCount++;
    }

    if (teacher) {
      sqlQuery += ` AND uploaded_by = $${paramCount}`;
      params.push(teacher);
      paramCount++;
    }

    if (status) {
      sqlQuery += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Add pagination
    sqlQuery += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, (page - 1) * limit);

    const result = await query(sqlQuery, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM content WHERE 1=1';
    const countParams = [];
    let countParamCount = 1;

    if (subject) {
      countQuery += ` AND subject = $${countParamCount}`;
      countParams.push(subject);
      countParamCount++;
    }

    if (teacher) {
      countQuery += ` AND uploaded_by = $${countParamCount}`;
      countParams.push(teacher);
      countParamCount++;
    }

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    return {
      items: result.rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }
}

module.exports = new ContentModel();
