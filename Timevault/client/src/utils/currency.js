/**
 * Utility functions for currency formatting in Malaysian Ringgit (RM)
 */

export const formatRMPrice = (price) => {
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return 'RM 0.00';
  
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numPrice);
};

export const formatRMPriceCompact = (price) => {
  const numPrice = parseFloat(price);
  if (isNaN(numPrice)) return 'RM 0';
  
  // For large numbers, show compact format
  if (numPrice >= 1000000) {
    return `RM ${(numPrice / 1000000).toFixed(1)}M`;
  } else if (numPrice >= 1000) {
    return `RM ${(numPrice / 1000).toFixed(1)}K`;
  }
  
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
};

export const parseRMPrice = (priceString) => {
  if (typeof priceString === 'number') return priceString;
  if (!priceString) return 0;
  
  // Remove RM prefix and any non-numeric characters except decimal point
  const cleanPrice = priceString.toString().replace(/[^\d.]/g, '');
  return parseFloat(cleanPrice) || 0;
};
