import { Elysia } from 'elysia';

import { isProduction } from '../utils/env';
import { logger } from './logger';

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR'
    ) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request') {
        super(message, 400, 'BAD_REQUEST');
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Conflict') {
        super(message, 409, 'CONFLICT');
    }
}

interface ErrorResponse {
    error: string;
    message: string;
    statusCode: number;
    code: string;
    stack?: string;
}

function formatErrorResponse(
    error: unknown,
    statusCode: number,
    code: string
): ErrorResponse {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    const errorName = error instanceof Error ? error.name : 'Error';

    const response: ErrorResponse = {
        error: errorName,
        message,
        statusCode,
        code,
    };

    if (!isProduction() && error instanceof Error && error.stack) {
        response.stack = error.stack;
    }

    return response;
}

export const errorHandlerPlugin = new Elysia({ name: 'error-handler' }).onError(
    { as: 'global' },
    ({ error, set }) => {
        const isAppError = error instanceof AppError ||
            (error instanceof Error &&
                'statusCode' in error &&
                'code' in error &&
                'isOperational' in error &&
                (error as AppError).isOperational === true);

        if (isAppError) {
            const appError = error as AppError;
            logger.warn(
                {
                    error: appError.name,
                    message: appError.message,
                    code: appError.code,
                    statusCode: appError.statusCode,
                },
                'Application error'
            );

            set.status = appError.statusCode;
            return formatErrorResponse(appError, appError.statusCode, appError.code);
        }

        const isErrorLike = error instanceof Error ||
            (typeof error === 'object' && error !== null && 'name' in error && 'message' in error);

        if (isErrorLike && 'name' in error && error.name === 'ValidationError') {
            logger.warn(
                {
                    error: error.name,
                    message: 'message' in error ? String(error.message) : 'Validation failed',
                },
                'Validation error'
            );

            set.status = 400;
            return formatErrorResponse(error, 400, 'VALIDATION_ERROR');
        }

        if (isErrorLike && 'name' in error && (error.name === 'NotFoundError' || (error as { code?: string }).code === 'NOT_FOUND')) {
            set.status = 404;
            return formatErrorResponse(
                new Error('Route not found'),
                404,
                'ROUTE_NOT_FOUND'
            );
        }

        logger.error(
            {
                error: error instanceof Error ? error.name : 'UnknownError',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            },
            'Unexpected error'
        );

        set.status = 500;
        return formatErrorResponse(error, 500, 'INTERNAL_ERROR');
    }
);
