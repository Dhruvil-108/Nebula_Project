const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Magic byte signatures for file verification
const MAGIC_NUMBERS = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  png: [0x89, 0x50, 0x4E, 0x47], // .PNG
  jpeg: [0xFF, 0xD8, 0xFF],       // JPEG
  docx: [0x50, 0x4B, 0x03, 0x04], // PK.. (ZIP archive used by docx)
};

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

class FileService {
  constructor() {
    this.storageDir = path.join(__dirname, '../../uploads/recruitment');
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Sniffs file buffer to verify that actual file contents match claimed type.
   * Rejects renamed executables (e.g. evil.exe renamed to resume.pdf).
   */
  validateFile(buffer, originalName, mimeType) {
    if (!buffer || buffer.length === 0) {
      throw new Error('File buffer is empty.');
    }

    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`File exceeds maximum size limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
    }

    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error(`Unsupported file extension: "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // Magic bytes verification
    if (ext === '.pdf') {
      const isPdf = MAGIC_NUMBERS.pdf.every((byte, idx) => buffer[idx] === byte);
      if (!isPdf) {
        throw new Error('File contents do not match PDF specification (invalid magic bytes). Upload rejected.');
      }
    } else if (ext === '.png') {
      const isPng = MAGIC_NUMBERS.png.every((byte, idx) => buffer[idx] === byte);
      if (!isPng) {
        throw new Error('File contents do not match PNG specification. Upload rejected.');
      }
    } else if (ext === '.jpg' || ext === '.jpeg') {
      const isJpg = MAGIC_NUMBERS.jpeg.every((byte, idx) => buffer[idx] === byte);
      if (!isJpg) {
        throw new Error('File contents do not match JPEG specification. Upload rejected.');
      }
    } else if (ext === '.docx') {
      const isDocx = MAGIC_NUMBERS.docx.every((byte, idx) => buffer[idx] === byte);
      if (!isDocx) {
        throw new Error('File contents do not match DOCX specification. Upload rejected.');
      }
    }

    // Optional virus scan hook placeholder
    this.scanForViruses(buffer);

    return true;
  }

  /**
   * Extensible virus scan hook
   */
  scanForViruses(buffer) {
    // Check for obvious binary executable signatures (.exe / PE headers: MZ)
    if (buffer[0] === 0x4D && buffer[1] === 0x5A) {
      throw new Error('Suspicious executable binary signature detected. Upload rejected.');
    }
    // Production can hook into ClamAV or cloud virus scanners here
    return true;
  }

  /**
   * Stores file buffer to local storage adapter organized by tenant
   */
  async storeFile(organizationId, buffer, originalName) {
    this.validateFile(buffer, originalName);

    const orgDir = path.join(this.storageDir, String(organizationId));
    if (!fs.existsSync(orgDir)) {
      fs.mkdirSync(orgDir, { recursive: true });
    }

    const ext = path.extname(originalName).toLowerCase();
    const fileId = crypto.randomUUID();
    const diskFileName = `${fileId}${ext}`;
    const filePath = path.join(orgDir, diskFileName);

    await fs.promises.writeFile(filePath, buffer);

    return {
      fileId,
      originalName,
      diskFileName,
      sizeBytes: buffer.length,
      relativePath: `/uploads/recruitment/${organizationId}/${diskFileName}`,
    };
  }

  /**
   * Generates a signed token for expiring access to a file
   */
  generateSignedUrl(fileId, organizationId, ttlSeconds = 3600) {
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const secret = process.env.JWT_SECRET || 'nebula-file-secret-key';
    const payload = `${fileId}:${organizationId}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    return `/api/v1/recruitment/files/${fileId}?org=${organizationId}&exp=${expiresAt}&sig=${signature}`;
  }

  /**
   * Validates a signed expiring token
   */
  verifySignedUrl(fileId, organizationId, expiresAt, signature) {
    const now = Math.floor(Date.now() / 1000);
    if (now > parseInt(expiresAt, 10)) {
      throw new Error('Signed URL has expired.');
    }

    const secret = process.env.JWT_SECRET || 'nebula-file-secret-key';
    const payload = `${fileId}:${organizationId}:${expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (signature !== expectedSig) {
      throw new Error('Invalid signature for file access.');
    }

    return true;
  }
}

module.exports = new FileService();
