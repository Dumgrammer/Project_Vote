import { z } from 'zod'

export const partySchema = z.object({
  party_name: z.string()
    .min(2, 'Party name must be at least 2 characters')
    .max(255, 'Party name must not exceed 255 characters'),
  
  party_code: z.string()
    .min(2, 'Party code must be at least 2 characters')
    .max(50, 'Party code must not exceed 50 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Party code must be uppercase letters, numbers, underscores, or hyphens'),
  
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
})

export type PartyFormData = z.infer<typeof partySchema>

