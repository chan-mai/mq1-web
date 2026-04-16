import bcrypt from "bcryptjs";

export const hashSecret = async (secret: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(secret, salt);
};

export const verifySecret = async (secret: string, hashed: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(secret, hashed);
  } catch {
    return false;
  }
};
