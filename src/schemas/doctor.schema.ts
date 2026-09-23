import { z } from 'zod';

export const createDoctorSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    clinicId: z.string().uuid(),
    categoryId: z.string().uuid(),
    bio: z.string().optional(),
    experienceYears: z.number().int().min(0).default(0),
  }),
});
