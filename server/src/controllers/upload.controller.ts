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
