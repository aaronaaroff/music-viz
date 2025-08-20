// Production-safe logging utility
const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  // Always log errors (important for production debugging)
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },
  
  // Always log warnings (important for production debugging)
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  },
  
  // Only log info in development
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  },
  
  // Only log debug in development
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  }
};