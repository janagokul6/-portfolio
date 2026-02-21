/**
 * Validation utilities
 */

/**
 * Validate image format
 */
export function isValidImageFormat(filename: string): boolean {
  const validExtensions = ['png', 'jpg', 'jpeg', 'webp'];
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? validExtensions.includes(extension) : false;
}

/**
 * Validate image size (max 5MB)
 */
export function isValidImageSize(sizeInBytes: number): boolean {
  const maxSize = 5 * 1024 * 1024; // 5MB
  return sizeInBytes <= maxSize;
}

/**
 * Validate base64 image data
 */
export function validateBase64Image(base64Data: string): { valid: boolean; error?: string } {
  // Check if it's a data URL
  if (base64Data.startsWith('data:image/')) {
    const match = base64Data.match(/^data:image\/(png|jpg|jpeg|webp);base64,/);
    if (!match) {
      return { valid: false, error: 'Invalid image format. Please upload PNG, JPG, JPEG, or WebP' };
    }
    
    // Extract base64 part and check size
    const base64Part = base64Data.split(',')[1];
    const sizeInBytes = (base64Part.length * 3) / 4;
    
    if (!isValidImageSize(sizeInBytes)) {
      return { valid: false, error: 'Image size must be less than 10MB' };
    }
    
    return { valid: true };
  }
  
  // If it's just base64 without data URL prefix, check size only
  const sizeInBytes = (base64Data.length * 3) / 4;
  if (!isValidImageSize(sizeInBytes)) {
    return { valid: false, error: 'Image size must be less than 10MB' };
  }
  
  return { valid: true };
}

/**
 * Log error with context
 */
export function logError(error: Error, context: string, additionalInfo?: Record<string, unknown>): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    ...additionalInfo
  };
  
  console.error(JSON.stringify(errorLog));
}
