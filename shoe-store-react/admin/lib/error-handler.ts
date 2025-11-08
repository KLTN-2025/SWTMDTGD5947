import { ApiError } from '@/lib/api-client';

/**
 * Extract error message from various error types
 * Prioritizes API error messages over generic messages
 */
export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiError) {
    // For validation errors, show all errors
    if (error.getValidationErrors()) {
      return error.getAllValidationErrors();
    }
    // For regular API errors, use the message
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return fallbackMessage;
}
