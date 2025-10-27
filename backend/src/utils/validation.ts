import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Team validation schemas
export const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  type: z.enum(['BASIC_FREE', 'STANDARD_MONTHLY', 'STANDARD_YEARLY']).default('BASIC_FREE'),
  state: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE')
});

export const joinTeamSchema = z.object({
  teamCode: z.string().length(7, 'Team code must be 7 characters').toUpperCase()
});

export const updateTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100, 'Team name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  type: z.enum(['BASIC_FREE', 'STANDARD_MONTHLY', 'STANDARD_YEARLY']).optional(),
  state: z.enum(['ACTIVE', 'DISABLED']).optional()
});

// Player validation schemas
export const createPlayerSchema = z.object({
  name: z.string().min(1, 'Player name is required').max(100, 'Player name too long'),
  number: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      // Handle string inputs from iOS by parsing them as integers
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed; // Return original if parsing fails
      }
      return Number(val);
    },
    z.number().int().min(0).max(99).optional()
  ),
  type: z.enum(['TEAM_PLAYER', 'SUBSTITUTE']).default('TEAM_PLAYER')
});

export const updatePlayerSchema = z.object({
  name: z.string().min(1, 'Player name is required').max(100, 'Player name too long').optional(),
  number: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      // Handle string inputs from iOS by parsing them as integers
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed; // Return original if parsing fails
      }
      return Number(val);
    },
    z.number().int().min(0).max(99).optional()
  ),
  type: z.enum(['TEAM_PLAYER', 'SUBSTITUTE']).optional()
});

// Game validation schemas
export const createGameSchema = z.object({
  opponent: z.string().max(100, 'Opponent name too long').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  startTime: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    // Accept both datetime-local format (YYYY-MM-DDTHH:MM) and full ISO format
    const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return datetimeLocalRegex.test(val) || isoRegex.test(val) || !isNaN(Date.parse(val));
  }, 'Invalid datetime format'),
  notes: z.string().max(1000, 'Notes too long').optional()
});

export const updateGameSchema = z.object({
  opponent: z.string().max(100, 'Opponent name too long').optional(),
  location: z.string().max(200, 'Location too long').optional(),
  startTime: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    // Accept both datetime-local format (YYYY-MM-DDTHH:MM) and full ISO format
    const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return datetimeLocalRegex.test(val) || isoRegex.test(val) || !isNaN(Date.parse(val));
  }, 'Invalid datetime format'),
  notes: z.string().max(1000, 'Notes too long').optional()
});

export const updatePeriodSchema = z.object({
  attackingDirection: z.enum(['left', 'right']).optional(),
  startedAt: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    // Accept both datetime-local format (YYYY-MM-DDTHH:MM) and full ISO format
    const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return datetimeLocalRegex.test(val) || isoRegex.test(val) || !isNaN(Date.parse(val));
  }, 'Invalid datetime format'),
  endedAt: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    // Accept both datetime-local format (YYYY-MM-DDTHH:MM) and full ISO format
    const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return datetimeLocalRegex.test(val) || isoRegex.test(val) || !isNaN(Date.parse(val));
  }, 'Invalid datetime format')
});

export const updateMultiplePeriodsSchema = z.object({
  periods: z.array(z.object({
    periodNumber: z.number().int().min(1).max(3),
    attackingDirection: z.enum(['left', 'right'])
  }))
});

// Shot validation schemas
export const createShotSchema = z.object({
  periodId: z.string().uuid('Invalid period ID'),
  shooterPlayerId: z.string().uuid('Invalid player ID').optional(),
  xCoord: z.number().min(0).max(1000, 'Invalid X coordinate'),
  yCoord: z.number().min(0).max(1000, 'Invalid Y coordinate'),
  scored: z.boolean().default(false),
  scoredAgainst: z.boolean().default(false),
  notes: z.string().max(500, 'Notes too long').optional()
});

export const updateShotSchema = z.object({
  shooterPlayerId: z.string().uuid('Invalid player ID').optional(),
  xCoord: z.number().min(0).max(1000, 'Invalid X coordinate').optional(),
  yCoord: z.number().min(0).max(1000, 'Invalid Y coordinate').optional(),
  scored: z.boolean().optional(),
  scoredAgainst: z.boolean().optional(),
  notes: z.string().max(500, 'Notes too long').optional()
});

// Goal validation schemas
export const createGoalSchema = z.object({
  scorerPlayerId: z.string().uuid('Invalid scorer player ID'),
  assister1PlayerId: z.string().uuid('Invalid assister1 player ID').optional(),
  assister2PlayerId: z.string().uuid('Invalid assister2 player ID').optional(),
  period: z.number().int().min(1).max(3, 'Period must be between 1 and 3'),
  notes: z.string().max(500, 'Notes too long').optional()
});

export const updateGoalSchema = z.object({
  scorerPlayerId: z.string().uuid('Invalid scorer player ID').optional(),
  assister1PlayerId: z.string().uuid('Invalid assister1 player ID').optional(),
  assister2PlayerId: z.string().uuid('Invalid assister2 player ID').optional(),
  period: z.number().int().min(1).max(3, 'Period must be between 1 and 3').optional(),
  notes: z.string().max(500, 'Notes too long').optional()
});

// Faceoff validation schemas
export const createFaceoffSchema = z.object({
  playerId: z.string().uuid('Invalid player ID')
});

export const updateFaceoffSchema = z.object({
  taken: z.number().int().min(0, 'Taken must be non-negative').optional(),
  won: z.number().int().min(0, 'Won must be non-negative').optional()
});

export const incrementFaceoffSchema = z.object({
  won: z.boolean().default(false)
});

// Game Player validation schemas
export const updateGamePlayerSchema = z.object({
  included: z.boolean().optional(),
  number: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? val : parsed;
      }
      return Number(val);
    },
    z.number().int().min(0).max(99).optional()
  )
});

export const bulkUpdateGamePlayersSchema = z.object({
  updates: z.array(z.object({
    gamePlayerId: z.string().uuid('Invalid game player ID'),
    included: z.boolean().optional(),
    number: z.preprocess(
      (val) => {
        if (val === '' || val === null || val === undefined) return undefined;
        if (typeof val === 'string') {
          const parsed = parseInt(val, 10);
          return isNaN(parsed) ? val : parsed;
        }
        return Number(val);
      },
      z.number().int().min(0).max(99).optional()
    )
  }))
});

// Validation middleware
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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
