export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
};

export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

export const validateBusinessHours = (openTime: string, closeTime: string): boolean => {
  const openHour = parseInt(openTime.split(':')[0]);
  const closeHour = parseInt(closeTime.split(':')[0]);
  return openHour < closeHour || (openHour === closeHour && openTime < closeTime);
};

export const isBusinessOpen = (
  hours: Array<{
    dayOfWeek: string;
    openTime: string | null;
    closeTime: string | null;
    isClosed: boolean;
  }>,
  date: Date = new Date()
): boolean => {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[date.getDay()];
  const currentTime = date.toTimeString().slice(0, 5); // HH:MM format

  const todayHours = hours.find(h => h.dayOfWeek === currentDay);
  
  if (!todayHours || todayHours.isClosed || !todayHours.openTime || !todayHours.closeTime) {
    return false;
  }

  return currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;
};

export const generateStoreCode = (storeName: string): string => {
  const prefix = storeName.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}${timestamp}`;
};

export const calculateAverageRating = (ratings: number[]): number => {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return Math.round((sum / ratings.length) * 100) / 100; // Round to 2 decimal places
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return phone; // Return original if not a 10-digit US number
};

export const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};