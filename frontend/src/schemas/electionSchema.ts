import { z } from 'zod'

export const electionSchema = z.object({
  election_title: z.string()
    .min(3, 'Election title must be at least 3 characters')
    .max(255, 'Election title must not exceed 255 characters'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters'),
  
  startDate: z.string()
    .min(1, 'Start date is required'),
  
  startTime: z.string()
    .min(1, 'Start time is required'),
  
  endDate: z.string()
    .min(1, 'End date is required'),
  
  endTime: z.string()
    .min(1, 'End time is required'),
  
  img: z.instanceof(File).nullable().optional(),
}).refine((data) => {
  // Validate that end date/time is after start date/time
  const startDateTime = new Date(`${data.startDate}T${data.startTime}`)
  const endDateTime = new Date(`${data.endDate}T${data.endTime}`)
  return endDateTime > startDateTime
}, {
  message: 'End date and time must be after start date and time',
  path: ['endDate'],
})

export type ElectionFormData = z.infer<typeof electionSchema>

