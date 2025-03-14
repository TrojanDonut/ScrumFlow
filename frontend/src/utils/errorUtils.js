/**
 * Formats error messages from various error object formats
 * @param {string|object} error - The error to format
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (error) => {
  if (!error) return '';
  
  if (typeof error === 'string') return error;
  
  // Skip 2FA required messages as they're handled separately
  if (error.two_factor_required) {
    return '';
  }
  
  if (error.detail) return error.detail;
  
  if (error.non_field_errors) {
    return Array.isArray(error.non_field_errors) 
      ? error.non_field_errors.join(', ') 
      : error.non_field_errors;
  }
  
  // Handle other error object formats
  if (typeof error === 'object') {
    // Filter out the otp_token field if it's related to 2FA
    const entries = Object.entries(error).filter(([key]) => 
      !(key === 'otp_token' && error.two_factor_required)
    );
    
    return entries
      .map(([key, value]) => {
        const valueStr = Array.isArray(value) ? value.join(', ') : String(value);
        return `${key}: ${valueStr}`;
      })
      .join('; ');
  }
  
  return 'An error occurred';
}; 