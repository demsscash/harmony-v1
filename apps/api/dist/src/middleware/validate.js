"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync(req.body);
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const zodError = error;
            const details = zodError.errors.map((err) => ({
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
exports.validate = validate;
