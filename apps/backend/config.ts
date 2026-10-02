const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET is not set");
}
if (secret.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters");
}

export const jwtSecret = secret;