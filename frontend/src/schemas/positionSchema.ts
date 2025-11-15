import { z } from 'zod'

export const positionSchema = z.object({
  name: z.string()
    .min(2, 'Position name must be at least 2 characters')
    .max(255, 'Position name must not exceed 255 characters'),
  
  type: z.enum(['school', 'corporate', 'barangay']),
  
  allows_multiple_votes: z.boolean().default(false),
})

export type PositionFormData = z.infer<typeof positionSchema>

