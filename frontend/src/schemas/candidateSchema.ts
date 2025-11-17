import { z } from 'zod'

export const candidateSchema = z.object({
  fname: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(255, 'First name must not exceed 255 characters'),
  
  mname: z.string()
    .max(255, 'Middle name must not exceed 255 characters')
    .optional(),
  
  lname: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(255, 'Last name must not exceed 255 characters'),
  
  party_id: z.number({
    error: 'Party is required'
  }).min(1, 'Please select a party'),
  
  position_id: z.number({
    error: 'Position is required'
  }).min(1, 'Please select a position'),
  
  bio: z.string()
    .min(10, 'Bio must be at least 10 characters')
    .max(1000, 'Bio must not exceed 1000 characters'),
  
  photo: z.instanceof(File).nullable().optional(),
})

export type CandidateFormData = z.infer<typeof candidateSchema>

