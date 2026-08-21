import 'dotenv/config';
import express from 'express';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { errorHandler, setConfig, initGlobalHandlers, gracefulHttpClose } from 'ds-express-errors';
import authRoutes from './routes/auth.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import { setupSwagger } from './config/swagger.js';
import clinicsRoutes from './routes/clinics.routes.js';
import doctorsRoutes from './routes/doctors.routes.js';
import favoritesRoutes from './routes/favorites.routes.js';
import profileRoutes from './routes/profile.routes.js';
import locationsRoutes from './routes/locations.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import schedulesRoutes from './routes/schedules.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import miscRoutes from './routes/misc.routes.js';

// setConfig must run before errorHandler is registered (and can only be called once
// per process, per the "ConfigAlreadySet" note in the docs).
// Passing the Prisma/Zod namespaces switches the Prisma + Zod mappers from
// duck-typing to the "strict checks" mode described in the Configuration docs.
setConfig({
  errorClasses: {
    Prisma,
    Zod: z,
  },
});

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Middleware
app.use(express.json());

// Setup Swagger UI at /swagger
setupSwagger(app);

// Routes
app.use('/api/identity', authRoutes);
app.use('/api/clinics', clinicsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/patientlocations', locationsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api', miscRoutes); // Mounts /banners, /categories, /termsAndConditions

// ds-express-errors: "Error handler MUST be after all routes" - it has to be the
// last app.use() call or it will never see errors from the routes above it.
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// initGlobalHandlers can only be called once per process (throws
// GlobalHandlerAlreadySet otherwise). gracefulHttpClose wraps server.close in
// a promise; onShutdown fires on SIGINT/SIGTERM, onCrash on uncaught/rejected.
initGlobalHandlers({
  closeServer: gracefulHttpClose(server),
  onShutdown: async () => {
    await prisma.$disconnect();
  },
  onCrash: async (err) => {
    console.error('Fatal crash:', err);
  },
});

export { prisma };
