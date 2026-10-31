const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const SIGN_SECRET = process.env.JWT_SECRET || 'nebula-file-storage-secret-2026';

/**
 * Validates and stores an uploaded file.
 * Handles buffers or base64 data URLs.
 */
async function saveFile({
  organizationId,
  fileData, // Buffer or base64 data URL
  originalName,
  mimeType,
  expiryDate = null,
}) {
  if (!fileData) {
    throw new Error('No file data provided.');
  }

  let buffer;
  let detectedMime = mimeType;

  if (Buffer.isBuffer(fileData)) {
    buffer = fileData;
  } else if (typeof fileData === 'string') {
    const match = /^data:([a-zA-Z0-9/+.-]+);base64,(.*)$/.exec(fileData);
    if (match) {
      detectedMime = match[1];
      buffer = Buffer.from(match[2], 'base64');
    } else {
      buffer = Buffer.from(fileData, 'base64');
    }
  } else {
    throw new Error('Invalid file data format.');
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
  }

  if (detectedMime && !ALLOWED_MIME_TYPES.includes(detectedMime.toLowerCase())) {
    throw new Error(`File type ${detectedMime} is not allowed. Supported formats: PDF, PNG, JPEG, WebP, DOC, DOCX.`);
  }

  const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');
  const ext = path.extname(originalName || '') || (detectedMime === 'application/pdf' ? '.pdf' : '.bin');
  const safeBaseName = (path.basename(originalName || 'file', ext) || 'doc').replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueName = `${safeBaseName}_${Date.now()}_${contentHash.substring(0, 8)}${ext}`;

  // Store in uploads directory
  const uploadsDir = path.join(__dirname, '../../uploads/documents', organizationId.toString());
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, uniqueName);
  fs.writeFileSync(filePath, buffer);

  const fileUrl = `/api/v1/hr/documents/files/${organizationId}/${uniqueName}`;

  return {
    fileName: originalName || uniqueName,
    storedName: uniqueName,
    fileUrl,
    mimeType: detectedMime || 'application/octet-stream',
    fileSizeBytes: buffer.length,
    contentHash,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
  };
}

/**
 * Generates a signed access token for secure time-limited document download.
 */
function generateSignedUrl(fileUrl, expiryMinutes = 60) {
  const expires = Date.now() + expiryMinutes * 60 * 1000;
  const signature = crypto
    .createHmac('sha256', SIGN_SECRET)
    .update(`${fileUrl}:${expires}`)
    .digest('hex');

  return `${fileUrl}?expires=${expires}&sig=${signature}`;
}

/**
 * Verifies a signed URL token.
 */
function verifySignedUrl(fileUrl, expires, signature) {
  if (!expires || !signature) return false;
  if (Date.now() > Number(expires)) return false;

  const expectedSig = crypto
    .createHmac('sha256', SIGN_SECRET)
    .update(`${fileUrl}:${expires}`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
}

module.exports = {
  saveFile,
  generateSignedUrl,
  verifySignedUrl,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
};
