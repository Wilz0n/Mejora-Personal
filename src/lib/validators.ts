import { z } from "zod";

export const createHabitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(60, "Máximo 60 caracteres"),
  icon: z.string().trim().min(1).max(40).default("check_circle"),
});
export type CreateHabitInput = z.infer<typeof createHabitSchema>;

export const toggleHabitLogSchema = z.object({
  habitId: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  completed: z.boolean(),
});
export type ToggleHabitLogInput = z.infer<typeof toggleHabitLogSchema>;

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  targetAmount: z.coerce
    .number()
    .positive("El costo total debe ser mayor a 0"),
  allocatedAmount: z.coerce
    .number()
    .min(0, "El monto ahorrado no puede ser negativo")
    .default(0),
  tag: z.string().trim().min(1).max(30).default("General"),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const createExpenseSchema = z.object({
  category: z.string().trim().min(1, "La categoría es obligatoria").max(40),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const setIncomeSchema = z.object({
  monthlyIncome: z.coerce
    .number()
    .min(0, "El ingreso no puede ser negativo"),
});
export type SetIncomeInput = z.infer<typeof setIncomeSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(60),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
export type RegisterInput = z.infer<typeof registerSchema>;
