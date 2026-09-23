import { z } from 'zod';

export const createAppointmentSchema = z.object({
  body: z.object({
    doctorId: z.string().uuid(),
    patientId: z.string().uuid(),
    timeSlotId: z.string().uuid(),
  }),
});

export const updateAppointmentStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Upcoming', 'Completed', 'Canceled']),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});
