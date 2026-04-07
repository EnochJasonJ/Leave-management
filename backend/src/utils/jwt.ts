export const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set. This is required for authentication.');
  }
  
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security.');
  }
  
  return secret;
};

export const JWT_EXPIRE_TIME = '1d';
