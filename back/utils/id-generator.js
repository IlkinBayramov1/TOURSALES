import crypto from 'crypto';
import prisma from '../config/db.js';

export const generateUniqueId = async (prefix, modelName) => {
  let isUnique = false;
  let uniqueId = '';
  while (!isUnique) {
    const randomNum = crypto.randomInt(100000, 999999);
    uniqueId = `${prefix}-${randomNum}`;
    const exists = await prisma[modelName].findUnique({
      where: { id: uniqueId }
    });
    if (!exists) isUnique = true;
  }
  return uniqueId;
};

export default {
  generateUniqueId
};
