import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

export const validate = (schema: ZodTypeAny) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error: any) {
            if (error instanceof ZodError) {
                const zodError = error as any;
                const details = zodError.errors.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Erreurs de validation',
                        details
                    }
                });
                return;
            }
            res.status(500).json({ success: false, error: 'Internal Server Error during validation' });
        }
    };
