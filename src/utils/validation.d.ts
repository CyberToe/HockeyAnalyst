import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    displayName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    displayName: string;
}, {
    email: string;
    password: string;
    displayName: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const createTeamSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
}>;
export declare const joinTeamSchema: z.ZodObject<{
    teamCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    teamCode: string;
}, {
    teamCode: string;
}>;
export declare const updateTeamSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
}>;
export declare const createPlayerSchema: z.ZodObject<{
    name: z.ZodString;
    number: z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    name: string;
    number?: number | undefined;
}, {
    name: string;
    number?: unknown;
}>;
export declare const updatePlayerSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    number: z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    number?: number | undefined;
    name?: string | undefined;
}, {
    number?: unknown;
    name?: string | undefined;
}>;
export declare const createGameSchema: z.ZodObject<{
    opponent: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    startTime: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    opponent?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    notes?: string | undefined;
}, {
    opponent?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    notes?: string | undefined;
}>;
export declare const updateGameSchema: z.ZodObject<{
    opponent: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    startTime: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    opponent?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    notes?: string | undefined;
}, {
    opponent?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    notes?: string | undefined;
}>;
export declare const updatePeriodSchema: z.ZodObject<{
    attackingDirection: z.ZodOptional<z.ZodEnum<["left", "right"]>>;
    startedAt: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    endedAt: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
}, "strip", z.ZodTypeAny, {
    attackingDirection?: "left" | "right" | undefined;
    startedAt?: string | undefined;
    endedAt?: string | undefined;
}, {
    attackingDirection?: "left" | "right" | undefined;
    startedAt?: string | undefined;
    endedAt?: string | undefined;
}>;
export declare const updateMultiplePeriodsSchema: z.ZodObject<{
    periods: z.ZodArray<z.ZodObject<{
        periodNumber: z.ZodNumber;
        attackingDirection: z.ZodEnum<["left", "right"]>;
    }, "strip", z.ZodTypeAny, {
        attackingDirection: "left" | "right";
        periodNumber: number;
    }, {
        attackingDirection: "left" | "right";
        periodNumber: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    periods: {
        attackingDirection: "left" | "right";
        periodNumber: number;
    }[];
}, {
    periods: {
        attackingDirection: "left" | "right";
        periodNumber: number;
    }[];
}>;
export declare const createShotSchema: z.ZodObject<{
    periodId: z.ZodString;
    shooterPlayerId: z.ZodOptional<z.ZodString>;
    xCoord: z.ZodNumber;
    yCoord: z.ZodNumber;
    scored: z.ZodDefault<z.ZodBoolean>;
    scoredAgainst: z.ZodDefault<z.ZodBoolean>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    periodId: string;
    xCoord: number;
    yCoord: number;
    scored: boolean;
    scoredAgainst: boolean;
    notes?: string | undefined;
    shooterPlayerId?: string | undefined;
}, {
    periodId: string;
    xCoord: number;
    yCoord: number;
    notes?: string | undefined;
    shooterPlayerId?: string | undefined;
    scored?: boolean | undefined;
    scoredAgainst?: boolean | undefined;
}>;
export declare const updateShotSchema: z.ZodObject<{
    shooterPlayerId: z.ZodOptional<z.ZodString>;
    xCoord: z.ZodOptional<z.ZodNumber>;
    yCoord: z.ZodOptional<z.ZodNumber>;
    scored: z.ZodOptional<z.ZodBoolean>;
    scoredAgainst: z.ZodOptional<z.ZodBoolean>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    shooterPlayerId?: string | undefined;
    xCoord?: number | undefined;
    yCoord?: number | undefined;
    scored?: boolean | undefined;
    scoredAgainst?: boolean | undefined;
}, {
    notes?: string | undefined;
    shooterPlayerId?: string | undefined;
    xCoord?: number | undefined;
    yCoord?: number | undefined;
    scored?: boolean | undefined;
    scoredAgainst?: boolean | undefined;
}>;
export declare const createGoalSchema: z.ZodObject<{
    scorerPlayerId: z.ZodString;
    assister1PlayerId: z.ZodOptional<z.ZodString>;
    assister2PlayerId: z.ZodOptional<z.ZodString>;
    period: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    scorerPlayerId: string;
    period: number;
    notes?: string | undefined;
    assister1PlayerId?: string | undefined;
    assister2PlayerId?: string | undefined;
}, {
    scorerPlayerId: string;
    period: number;
    notes?: string | undefined;
    assister1PlayerId?: string | undefined;
    assister2PlayerId?: string | undefined;
}>;
export declare const updateGoalSchema: z.ZodObject<{
    scorerPlayerId: z.ZodOptional<z.ZodString>;
    assister1PlayerId: z.ZodOptional<z.ZodString>;
    assister2PlayerId: z.ZodOptional<z.ZodString>;
    period: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    scorerPlayerId?: string | undefined;
    assister1PlayerId?: string | undefined;
    assister2PlayerId?: string | undefined;
    period?: number | undefined;
}, {
    notes?: string | undefined;
    scorerPlayerId?: string | undefined;
    assister1PlayerId?: string | undefined;
    assister2PlayerId?: string | undefined;
    period?: number | undefined;
}>;
export declare const createFaceoffSchema: z.ZodObject<{
    playerId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    playerId: string;
}, {
    playerId: string;
}>;
export declare const updateFaceoffSchema: z.ZodObject<{
    taken: z.ZodOptional<z.ZodNumber>;
    won: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    taken?: number | undefined;
    won?: number | undefined;
}, {
    taken?: number | undefined;
    won?: number | undefined;
}>;
export declare const incrementFaceoffSchema: z.ZodObject<{
    won: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    won: boolean;
}, {
    won?: boolean | undefined;
}>;
export declare const validateSchema: (schema: z.ZodSchema) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=validation.d.ts.map