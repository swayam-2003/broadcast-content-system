const AWS = require('aws-sdk');
const config = require('../config');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

let s3;
let useS3 = false;

const initializeS3 = () => {
  try {
    if (!config.s3.accessKeyId || !config.s3.secretAccessKey) {
      logger.warn('S3 credentials not configured, using local storage');
      useS3 = false;
      return;
    }

    AWS.config.update({
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
      region: config.s3.region,
    });

    s3 = new AWS.S3();
    useS3 = true;
    logger.info('S3 initialized successfully');
  } catch (err) {
    logger.warn('S3 initialization failed, using local storage', err);
    useS3 = false;
  }
};

class S3Service {
  async uploadFile(file) {
    if (!useS3 || !s3) {
      throw new ValidationError('S3 not configured');
    }

    try {
      const ext = file.originalname.split('.').pop();
      const key = `content/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

      const params = {
        Bucket: config.s3.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
        Metadata: {
          'original-name': file.originalname,
        },
      };

      const result = await s3.upload(params).promise();

      logger.info(`File uploaded to S3: ${key}`);

      return {
        filename: key,
        filePath: result.Location,
        fileSize: file.size,
      };
    } catch (err) {
      logger.error('S3 upload error', err);
      throw new ValidationError('Failed to upload file to S3');
    }
  }

  async deleteFile(key) {
    if (!useS3 || !s3) return;

    try {
      await s3.deleteObject({
        Bucket: config.s3.bucket,
        Key: key,
      }).promise();

      logger.info(`File deleted from S3: ${key}`);
    } catch (err) {
      logger.error('S3 delete error', err);
    }
  }

  async getFile(key) {
    if (!useS3 || !s3) {
      throw new ValidationError('S3 not configured');
    }

    try {
      const result = await s3.getObject({
        Bucket: config.s3.bucket,
        Key: key,
      }).promise();

      return result.Body;
    } catch (err) {
      logger.error('S3 get error', err);
      throw new ValidationError('Failed to retrieve file from S3');
    }
  }

  isConfigured() {
    return useS3;
  }
}

module.exports = { S3Service: new S3Service(), initializeS3 };
