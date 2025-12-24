/**
 * File Upload Middleware
 * Handles multipart/form-data file uploads without external dependencies
 * Following POL-018 (YAGNI) - minimal implementation for current needs
 */

import type { Request, Response, NextFunction } from 'express';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { existsSync } from 'node:fs';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
}

/**
 * Simple file upload middleware
 * Saves uploaded files to a temporary directory
 */
export function uploadMiddleware(
  uploadDir: string
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Ensure upload directory exists
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      // Check if request has file data
      const contentType = req.headers['content-type'] ?? '';
      if (
        contentType.length === 0 ||
        !contentType.includes('multipart/form-data')
      ) {
        next();
        return;
      }

      // Parse multipart data
      const boundary = contentType.split('boundary=')[1];
      if (boundary === undefined || boundary.length === 0) {
        next();
        return;
      }

      let body = Buffer.alloc(0);

      req.on('data', (chunk: Buffer) => {
        body = Buffer.concat([body, chunk]);
      });

      req.on('end', () => {
        void (async (): Promise<void> => {
          try {
            const files = await parseMultipartData(body, boundary, uploadDir);
            // Attach files to request
            // Use a distinct property name to avoid collision with multer's Request.files type
            (
              req as Request & { uploadedFiles?: UploadedFile[] }
            ).uploadedFiles = files;
            next();
          } catch (error) {
            const err = error as Error;
            const BAD_REQUEST_STATUS = 400;
            res.status(BAD_REQUEST_STATUS).json({
              success: false,
              errors: [`File upload failed: ${err.message}`],
            });
          }
        })();
      });
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Parse multipart/form-data buffer
 */
async function parseMultipartData(
  buffer: Buffer,
  boundary: string,
  uploadDir: string
): Promise<UploadedFile[]> {
  const files: UploadedFile[] = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);

  // Split by boundary
  const parts = [];
  let start = 0;
  let pos = buffer.indexOf(boundaryBuffer, start);

  while (pos !== -1) {
    if (start > 0) {
      parts.push(buffer.slice(start, pos));
    }
    start = pos + boundaryBuffer.length;
    pos = buffer.indexOf(boundaryBuffer, start);
  }

  // Parse each part
  for (const part of parts) {
    const HEADER_END_MARKER_LENGTH = 4;
    const TRAILING_CRLF_LENGTH = 2;
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) {
      continue;
    }

    const headers = part.slice(0, headerEnd).toString();
    const fileData = part.slice(
      headerEnd + HEADER_END_MARKER_LENGTH,
      part.length - TRAILING_CRLF_LENGTH
    );

    // Extract filename from Content-Disposition header
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    if (filenameMatch === null) {
      continue;
    }

    const originalname = filenameMatch[1] ?? 'unknown';
    // Sanitize filename to prevent path traversal attacks
    // Remove any path separators and keep only the base filename
    const sanitizedName = basename(originalname).replace(
      /[^a-zA-Z0-9._-]/g,
      '_'
    );
    const timestamp = Date.now();
    const filename = `${timestamp}-${sanitizedName}`;
    const filepath = join(uploadDir, filename);

    // Extract content type
    const contentTypeMatch = headers.match(/Content-Type: ([^\r\n]+)/);
    const mimetype = contentTypeMatch
      ? (contentTypeMatch[1] ?? 'application/octet-stream')
      : 'application/octet-stream';

    // Write file
    await writeFile(filepath, fileData);

    files.push({
      fieldname: 'romFile',
      originalname,
      filename,
      path: filepath,
      size: fileData.length,
      mimetype,
    });
  }

  return files;
}
