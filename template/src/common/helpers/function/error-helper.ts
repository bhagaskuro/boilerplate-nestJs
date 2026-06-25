import { Prisma } from '@prisma/client';

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  // Prisma known error
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (error as any).message;
  }

  // Prisma validation error
  if (error instanceof Prisma.PrismaClientValidationError) {
    return (error as any).message;
  }

  // String thrown
  if (typeof error === 'string') {
    return error;
  }

  // Object with message
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  ) {
    return (error as any).message;
  }

  // Fallback
  return 'Unexpected error occurred';
}
