import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

function isValidMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;

  // JPEG check: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG check: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }

  // WEBP check: RIFF .... WEBP
  if (
    buffer[0] === 0x52 && // 'R'
    buffer[1] === 0x49 && // 'I'
    buffer[2] === 0x46 && // 'F'
    buffer[3] === 0x46 && // 'F'
    buffer[8] === 0x57 && // 'W'
    buffer[9] === 0x45 && // 'E'
    buffer[10] === 0x42 && // 'B'
    buffer[11] === 0x50   // 'P'
  ) {
    return true;
  }

  return false;
}

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized access' });
    }

    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    // Match data URL pattern: data:image/png;base64,iVBORw0KGgo...
    const matches = image.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/i);
    if (!matches) {
      return res.status(400).json({
        error: 'Invalid image format. Only JPG, JPEG, PNG, and WebP images are allowed.',
      });
    }

    const mimeType = matches[1].toLowerCase();
    const base64Data = matches[2];

    const extension = ALLOWED_MIME_TYPES[mimeType];
    if (!extension) {
      return res.status(400).json({
        error: 'Unsupported file type. Only JPG, JPEG, PNG, and WebP images are allowed.',
      });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({
        error: 'File size exceeds maximum allowed limit of 5MB.',
      });
    }

    // Magic-Byte Binary File Signature Validation (Prevents MIME spoofing, SVG, Executables, XSS payloads)
    if (!isValidMagicBytes(buffer)) {
      return res.status(400).json({
        error: 'File content validation failed. Uploaded file is corrupted, spoofed, or not a valid JPG/PNG/WebP image.',
      });
    }

    // Prevent Path Traversal & Generate Safe Unique Filename
    const uniqueFilename = `img_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${extension}`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'images');

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, uniqueFilename);
    await fs.promises.writeFile(filePath, buffer);

    // Return safe public relative URL (Never expose server filesystem paths)
    const publicUrl = `/uploads/images/${uniqueFilename}`;
    res.json({ url: publicUrl, message: 'Image uploaded successfully.' });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to process image upload.' });
  }
};
