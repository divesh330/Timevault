// Serial number validation patterns for different watch brands
const serialPatterns = {
  rolex: /^[A-Z0-9]{8}$/,
  omega: /^[0-9]{7,8}$/,
  seiko: /^[0-9]{6,7}$/,
  casio: /^[A-Z0-9]{6,10}$/,
};

/**
 * Validate serial number based on watch brand
 * @param {string} brand - Watch brand name
 * @param {string} serialNumber - Serial number to validate
 * @returns {Object} - { valid: boolean, message: string }
 */
export const validateSerialNumber = (brand, serialNumber) => {
  if (!brand || !serialNumber) {
    return {
      valid: false,
      message: 'Brand and serial number are required',
    };
  }

  const brandLower = brand.toLowerCase();
  const pattern = serialPatterns[brandLower];

  if (!pattern) {
    return {
      valid: false,
      message: `Unsupported brand: ${brand}. Supported brands are: Rolex, Omega, Seiko, Casio`,
    };
  }

  if (!pattern.test(serialNumber)) {
    const formatMessages = {
      rolex: 'Rolex serial numbers must be 8 alphanumeric characters (e.g., A1B2C3D4)',
      omega: 'Omega serial numbers must be 7-8 digits (e.g., 12345678)',
      seiko: 'Seiko serial numbers must be 6-7 digits (e.g., 123456)',
      casio: 'Casio serial numbers must be 6-10 alphanumeric characters (e.g., ABC123)',
    };

    return {
      valid: false,
      message: formatMessages[brandLower] || 'Invalid serial number format',
    };
  }

  return {
    valid: true,
    message: 'Serial number is valid',
  };
};

/**
 * Check if serial number already exists in active listings
 * @param {Object} db - Firestore database instance
 * @param {string} serialNumber - Serial number to check
 * @param {string} excludeWatchId - Optional watch ID to exclude from check (for updates)
 * @returns {Promise<Object>} - { exists: boolean, message: string }
 */
export const checkDuplicateSerial = async (db, serialNumber, excludeWatchId = null) => {
  try {
    let query = db
      .collection('watches')
      .where('serialNumber', '==', serialNumber)
      .where('status', '==', 'active');

    const snapshot = await query.get();

    // Filter out the watch being updated
    const duplicates = snapshot.docs.filter(doc => doc.id !== excludeWatchId);

    if (duplicates.length > 0) {
      return {
        exists: true,
        message: `A watch with serial number ${serialNumber} is already listed. Duplicate serial numbers are not allowed.`,
      };
    }

    return {
      exists: false,
      message: 'Serial number is unique',
    };
  } catch (error) {
    console.error('Error checking duplicate serial:', error);
    throw new Error('Failed to validate serial number uniqueness');
  }
};

/**
 * Get supported brands
 * @returns {Array<string>} - List of supported brands
 */
export const getSupportedBrands = () => {
  return Object.keys(serialPatterns).map(brand => 
    brand.charAt(0).toUpperCase() + brand.slice(1)
  );
};
