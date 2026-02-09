
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export interface ValidationResult {
  isValid: boolean;
  message: string | null;
}

/**
 * Validates a GSTIN against Indian tax department patterns
 */
export const validateGSTIN = (gstin: string): ValidationResult => {
  if (!gstin) return { isValid: true, message: null }; // Optional field in some contexts
  
  const upperGstin = gstin.toUpperCase();
  
  if (upperGstin.length !== 15) {
    return { isValid: false, message: "GSTIN must be exactly 15 characters." };
  }

  if (!GSTIN_REGEX.test(upperGstin)) {
    return { isValid: false, message: "Invalid format. Expected: 2-digit state code, 10-char PAN, 1 entity code, 'Z', and 1 check digit." };
  }

  const stateCode = parseInt(upperGstin.substring(0, 2));
  if (isNaN(stateCode) || stateCode < 1 || stateCode > 38) {
    return { isValid: false, message: "Invalid State Code (First 2 digits must be between 01-38)." };
  }

  return { isValid: true, message: "Valid GSTIN format." };
};

/**
 * Simulates a server-side validation against a government database
 */
export const simulateServerGstinCheck = async (gstin: string): Promise<ValidationResult> => {
  return new Promise((resolve) => {
    // Artificial latency to simulate network request
    setTimeout(() => {
      const basicValidation = validateGSTIN(gstin);
      if (!basicValidation.isValid) {
        resolve(basicValidation);
        return;
      }
      
      // Simulation: In a real app, this would check if the GSTIN is active/valid in the GST database
      // Here we just return success for anything that passes the regex
      resolve({ isValid: true, message: "Verified against GST Portal." });
    }, 800);
  });
};
