import { z } from 'zod'

/**
 * Validation schemas for all user inputs
 * Zod is used for runtime validation to catch invalid data early
 */

// Guest upload metadata validation
export const uploadFormSchema = z.object({
  uploaderName: z
    .string()
    .min(1, 'Please enter your name')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  guestTag: z
    .string()
    .max(50, 'Tag must be less than 50 characters')
    .optional()
    .nullable(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable(),
})

export type UploadFormInput = z.infer<typeof uploadFormSchema>

// Admin password validation
export const adminLoginSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .max(200, 'Password too long'),
})

export type AdminLoginInput = z.infer<typeof adminLoginSchema>

// Sanitization function for user-provided strings
export function sanitizeInput(input: string, maxLength: number = 200): string {
  if (typeof input !== 'string') return ''

  // Remove any HTML/script tags
  const sanitized = input
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()

  // Limit length
  return sanitized.substring(0, maxLength)
}

// Validate and sanitize guest uploader name
export function validateUploaderName(name: string): { valid: boolean; error?: string; sanitized?: string } {
  try {
    const validated = uploadFormSchema.pick({ uploaderName: true }).parse({
      uploaderName: name,
    })
    return { valid: true, sanitized: sanitizeInput(validated.uploaderName) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message }
    }
    return { valid: false, error: 'Invalid input' }
  }
}

// Validate and sanitize guest tag
export function validateGuestTag(tag: string | null | undefined): { valid: boolean; error?: string; sanitized?: string | null } {
  if (!tag) return { valid: true, sanitized: null }

  try {
    const validated = uploadFormSchema.pick({ guestTag: true }).parse({
      guestTag: tag,
    })
    return { valid: true, sanitized: validated.guestTag ? sanitizeInput(validated.guestTag, 50) : null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message }
    }
    return { valid: false, error: 'Invalid tag' }
  }
}

const uuidSchema = z.string().uuid()
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024 // 50 MB

// Inputs for requesting a server-issued signed upload URL
export const requestUploadUrlSchema = z.object({
  eventId: uuidSchema,
  fileName: z.string().min(1).max(256),
  fileType: z.string().regex(/^image\//, 'Only image files are allowed'),
  fileSize: z.number().int().positive().max(MAX_UPLOAD_BYTES, 'File exceeds 50 MB limit'),
})

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>

// Inputs for confirming a completed upload and inserting the media row
export const confirmUploadSchema = z.object({
  eventId: uuidSchema,
  storagePath: z.string().min(1).max(512).refine(s => !s.includes('..'), 'Invalid path'),
  thumbnailPath: z.string().min(1).max(512).refine(s => !s.includes('..'), 'Invalid path').optional(),
  uploadedBy: z.string().min(1).max(100),
  guestTag: z.string().max(50).nullable().optional(),
  guestToken: uuidSchema,
  fileSize: z.number().int().positive(),
  fileHash: z.string().max(128).nullable().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>

// Validate admin login password
export function validateAdminPassword(password: string): { valid: boolean; error?: string } {
  try {
    adminLoginSchema.parse({ password })
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message }
    }
    return { valid: false, error: 'Invalid password' }
  }
}
