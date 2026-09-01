import { z } from "zod";

export const reservationCreateSchema = z.object({
  menuId: z.string().uuid(),
  dateStr: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().trim().min(1).max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9-]{9,15}$/, "電話番号の形式が正しくありません"),
  lineUserId: z.string().min(1),
});

export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>;

export const menuUpsertSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).nullable().optional(),
  durationMinutes: z.number().int().min(5).max(600),
  price: z.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type MenuUpsertInput = z.infer<typeof menuUpsertSchema>;

export const businessHourUpdateSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  isClosed: z.boolean(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
});

export type BusinessHourUpdateInput = z.infer<typeof businessHourUpdateSchema>;

export const closedDateCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().max(200).nullable().optional(),
});

export type ClosedDateCreateInput = z.infer<typeof closedDateCreateSchema>;
