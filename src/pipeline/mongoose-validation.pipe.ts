import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { MongoError } from 'mongodb';

@Catch(MongoError)
export class MongooseExceptionFilter implements ExceptionFilter {
  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = 500;
    let errorResponse: {
      data?: any[];
      error: string;
      code: number;
    } = {
      data: [],
      error: 'Internal Server Error',
      code: 500,
    };

    switch (exception.code) {
      case 11000: {
        // Duplicate Key Error
        const field = Object.keys((exception as any).keyValue)[0];
        statusCode = 409;
        errorResponse = {
          data: [
            {
              field,
              message: `${field} must be unique`,
              in: 'body',
            },
          ],
          error: 'Duplicate entry',
          code: statusCode,
        };
        break;
      }

      case 121: {
        // Document Validation Failure
        statusCode = 400;
        errorResponse = {
          error: 'Document validation failed',
          code: statusCode,
        };
        break;
      }

      case 66: {
        // Immutable Field Error
        statusCode = 400;
        errorResponse = {
          error: 'Immutable field cannot be modified',
          code: statusCode,
        };
        break;
      }

      case 2: {
        // Bad Value Error
        statusCode = 400;
        errorResponse = {
          error: 'Invalid data format or value',
          code: statusCode,
        };
        break;
      }

      case 50: {
        // Exceeded Time Limit
        statusCode = 504;
        errorResponse = {
          error: 'Operation timed out',
          code: statusCode,
        };
        break;
      }

      case 112: {
        // Write Conflict
        statusCode = 409;
        errorResponse = {
          error: 'Write conflict occurred. Try again',
          code: statusCode,
        };
        break;
      }

      default:
        // Handle other MongoDB errors
        statusCode = 500;
        errorResponse = {
          error: 'Unknown database error',
          code: statusCode,
        };
    }

    return response.status(statusCode).json(errorResponse);
  }
}
