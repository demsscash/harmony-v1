import { z } from 'zod';
import { Gender, ContractType, EmployeeStatus, Currency } from '@prisma/client';

const employeeBaseSchema = z.object({
    firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(50),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50),
    cin: z.union([z.literal(''), z.string().regex(/^[0-9]{10}$/, 'Le CIN/NNI doit contenir exactement 10 chiffres')]).optional().nullable(),
    email: z.union([z.literal(''), z.string().email('Email invalide')]).optional().nullable(),
    phone: z.union([z.literal(''), z.string().regex(/^\+222\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/, 'Format invalide — ex: +222 44 00 00 00')]).optional().nullable(),
    dateOfBirth: z.string().refine(val => !isNaN(Date.parse(val)), 'Date invalide').nullable().optional(),
    gender: z.nativeEnum(Gender).optional().nullable(),
    address: z.string().optional().nullable(),
    departmentId: z.union([z.string().uuid(), z.literal('')]).optional().nullable(),
    position: z.string().min(2, 'La fonction est obligatoire'),
    gradeId: z.union([z.string().uuid(), z.literal('')]).optional().nullable(),
    contractType: z.nativeEnum(ContractType),
    hireDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Date invalide'),
    contractEndDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Date invalide').optional().nullable(),
    trialEndDate: z.string().refine(val => !isNaN(Date.parse(val)), 'Date invalide').optional().nullable(),
    baseSalary: z.number().positive('Le salaire doit être positif'),
    currency: z.nativeEnum(Currency).optional(),
    status: z.nativeEnum(EmployeeStatus).optional(),
    managerId: z.union([z.string().uuid(), z.literal('')]).optional().nullable(),
});

export const createEmployeeSchema = employeeBaseSchema.refine(data => {
    if (data.contractType === 'CDD' && !data.contractEndDate) {
        return false;
    }
    return true;
}, { message: 'La date de fin est obligatoire pour un CDD', path: ['contractEndDate'] })
    .refine(data => {
        if (data.contractEndDate && new Date(data.contractEndDate) <= new Date(data.hireDate)) {
            return false;
        }
        return true;
    }, { message: 'La date de fin doit être postérieure à la date d\'embauche', path: ['contractEndDate'] });

export const updateEmployeeSchema = employeeBaseSchema.partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
