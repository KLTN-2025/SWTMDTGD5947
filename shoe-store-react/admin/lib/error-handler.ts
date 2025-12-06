import { ApiError } from '@/lib/api-client';

/**
 * Extract error message from various error types
 * Prioritizes API error messages over generic messages
 * 
 * Handles BE error structure: {response: {code, status, msgCode, message}}
 */
export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  // Handle ApiError (already parsed by api-client)
  if (error instanceof ApiError) {
    // For validation errors, show all errors
    if (error.getValidationErrors()) {
      return error.getAllValidationErrors();
    }
    // For regular API errors, use the message
    return error.message;
  }
  
  // Handle raw error object with nested response structure from BE
  if (error && typeof error === 'object') {
    const err = error as any;
    
    // Check for nested response.message
    if (err.response?.message) {
      return typeof err.response.message === 'string' 
        ? err.response.message 
        : fallbackMessage;
    }
    
    // Check for direct message
    if (err.message) {
      return err.message;
    }
  }
  
  // Handle Error instance
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string error
  if (typeof error === 'string') {
    return error;
  }
  
  return fallbackMessage;
}

/**
 * Get error code from error object
 */
export function getErrorCode(error: unknown): string | null {
  if (error instanceof ApiError) {
    return error.msgCode;
  }
  
  if (error && typeof error === 'object') {
    const err = error as any;
    return err.response?.msgCode || err.msgCode || null;
  }
  
  return null;
}

/**
 * Check if error is a specific error code
 */
export function isErrorCode(error: unknown, code: string): boolean {
  return getErrorCode(error) === code;
}
