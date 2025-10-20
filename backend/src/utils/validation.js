"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = exports.incrementFaceoffSchema = exports.updateFaceoffSchema = exports.createFaceoffSchema = exports.updateGoalSchema = exports.createGoalSchema = exports.updateShotSchema = exports.createShotSchema = exports.updateMultiplePeriodsSchema = exports.updatePeriodSchema = exports.updateGameSchema = exports.createGameSchema = exports.updatePlayerSchema = exports.createPlayerSchema = exports.updateTeamSchema = exports.joinTeamSchema = exports.createTeamSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// User validation schemas
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    displayName: zod_1.z.string().min(1, 'Display name is required').max(100, 'Display name too long')
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
// Team validation schemas
exports.createTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
    description: zod_1.z.string().max(500, 'Description too long').optional()
});
exports.joinTeamSchema = zod_1.z.object({
    teamCode: zod_1.z.string().length(7, 'Team code must be 7 characters').toUpperCase()
});
exports.updateTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Team name is required').max(100, 'Team name too long').optional(),
    description: zod_1.z.string().max(500, 'Description too long').optional()
});
// Player validation schemas
exports.createPlayerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Player name is required').max(100, 'Player name too long'),
    number: zod_1.z.preprocess((val) => {
        if (val === '' || val === null || val === undefined)
            return undefined;
        // Handle string inputs from iOS by parsing them as integers
        if (typeof val === 'string') {
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? val : parsed; // Return original if parsing fails
        }
        return Number(val);
    }, zod_1.z.number().int().min(0).max(99).optional())
});
exports.updatePlayerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Player name is required').max(100, 'Player name too long').optional(),
    number: zod_1.z.preprocess((val) => {
        if (val === '' || val === null || val === undefined)
            return undefined;
        // Handle string inputs from iOS by parsing them as integers
        if (typeof val === 'string') {
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? val : parsed; // Return original if parsing fails
        }
        return Number(val);
    }, zod_1.z.number().int().min(0).max(99).optional())
});
// Game validation schemas
exports.createGameSchema = zod_1.z.object({
    opponent: zod_1.z.string().max(100, 'Opponent name too long').optional(),
    location: zod_1.z.string().max(200, 'Location too long').optional(),
    startTime: zod_1.z.string().optional().refine((val) => {
        if (!val)
            return true; // Optional field
        // Accept both datetime-local format (YYYY-MM-DDTHH:MM) and full ISO format
        const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
        return datetimeLocalRegex.test(val) || isoRegex.test(val) || !isNaN(Date.parse(val));
    }, 'Invalid datetime format'),
    notes: zod_1.z.string().max(1000, 'Notes too long').optional()
});
exports.updateGameSchema = zod_1.z.object({
    opponent: zod_1.z.string().max(100, 'Opponent name too long').optional(),
    location: zod_1.z.string().max(200, 'Location too long').optional(),
    startTime: zod_1.z.string().optional().refine((val) => {
        if (!val)
            return true; // Optional field
        // Accept both datetime-local format (YYYY-MM-DDTHH:MM) and full ISO format
        const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
        return datetimeLocalRegex.test(val) || isoRegex.test(val) || !isNaN(Date.parse(val));
    }, 'Invalid datetime format'),
    notes: zod_1.z.string().max(1000, 'Notes too long').optional()
});
exports.updatePeriodSchema = zod_1.z.object({
    attackingDirection: zod_1.z.enum(['left', 'right']).optional(),
    startedAt: zod_1.z.string().optional().refine((val) => {
        if (!val)
            return true; // Optional field
        // Accept both datetime-local format (YYYY-MM-DDTHH:MM) and full ISO format
        const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
        return datetimeLocalRegex.test(val) || isoRegex.test(val) || !isNaN(Date.parse(val));
    }, 'Invalid datetime format'),
    endedAt: zod_1.z.string().optional().refine((val) => {
        if (!val)
            return true; // Optional field
        // Accept both datetime-local format (YYYY-MM-DDTHH:MM) and full ISO format
        const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
        return datetimeLocalRegex.test(val) || isoRegex.test(val) || !isNaN(Date.parse(val));
    }, 'Invalid datetime format')
});
exports.updateMultiplePeriodsSchema = zod_1.z.object({
    periods: zod_1.z.array(zod_1.z.object({
        periodNumber: zod_1.z.number().int().min(1).max(3),
        attackingDirection: zod_1.z.enum(['left', 'right'])
    }))
});
// Shot validation schemas
exports.createShotSchema = zod_1.z.object({
    periodId: zod_1.z.string().uuid('Invalid period ID'),
    shooterPlayerId: zod_1.z.string().uuid('Invalid player ID').optional(),
    xCoord: zod_1.z.number().min(0).max(1000, 'Invalid X coordinate'),
    yCoord: zod_1.z.number().min(0).max(1000, 'Invalid Y coordinate'),
    scored: zod_1.z.boolean().default(false),
    scoredAgainst: zod_1.z.boolean().default(false),
    notes: zod_1.z.string().max(500, 'Notes too long').optional()
});
exports.updateShotSchema = zod_1.z.object({
    shooterPlayerId: zod_1.z.string().uuid('Invalid player ID').optional(),
    xCoord: zod_1.z.number().min(0).max(1000, 'Invalid X coordinate').optional(),
    yCoord: zod_1.z.number().min(0).max(1000, 'Invalid Y coordinate').optional(),
    scored: zod_1.z.boolean().optional(),
    scoredAgainst: zod_1.z.boolean().optional(),
    notes: zod_1.z.string().max(500, 'Notes too long').optional()
});
// Goal validation schemas
exports.createGoalSchema = zod_1.z.object({
    scorerPlayerId: zod_1.z.string().uuid('Invalid scorer player ID'),
    assister1PlayerId: zod_1.z.string().uuid('Invalid assister1 player ID').optional(),
    assister2PlayerId: zod_1.z.string().uuid('Invalid assister2 player ID').optional(),
    period: zod_1.z.number().int().min(1).max(3, 'Period must be between 1 and 3'),
    notes: zod_1.z.string().max(500, 'Notes too long').optional()
});
exports.updateGoalSchema = zod_1.z.object({
    scorerPlayerId: zod_1.z.string().uuid('Invalid scorer player ID').optional(),
    assister1PlayerId: zod_1.z.string().uuid('Invalid assister1 player ID').optional(),
    assister2PlayerId: zod_1.z.string().uuid('Invalid assister2 player ID').optional(),
    period: zod_1.z.number().int().min(1).max(3, 'Period must be between 1 and 3').optional(),
    notes: zod_1.z.string().max(500, 'Notes too long').optional()
});
// Faceoff validation schemas
exports.createFaceoffSchema = zod_1.z.object({
    playerId: zod_1.z.string().uuid('Invalid player ID')
});
exports.updateFaceoffSchema = zod_1.z.object({
    taken: zod_1.z.number().int().min(0, 'Taken must be non-negative').optional(),
    won: zod_1.z.number().int().min(0, 'Won must be non-negative').optional()
});
exports.incrementFaceoffSchema = zod_1.z.object({
    won: zod_1.z.boolean().default(false)
});
// Validation middleware
const validateSchema = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            next(error);
        }
    };
};
exports.validateSchema = validateSchema;
//# sourceMappingURL=validation.js.map