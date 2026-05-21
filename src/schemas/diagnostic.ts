import { z } from 'zod';
export const diagnosticCodeSchema = z.object({
    code: z.string().min(1, "Code is required"),
    brandId: z.string().nullable(),
    description: z.string().min(1, "Description is required"),
    symptoms: z.array(z.string()).optional(),
    causes: z.array(z.string()).optional(),
    solutions: z.array(z.string()).optional()
});