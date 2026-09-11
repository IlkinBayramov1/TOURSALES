export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const isValidAzerbaijanPhone = (phone: string): boolean => {
  // Matches +994XXXXXXXXX or 0XXXXXXXXX
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const re = /^(\+994|0)(50|51|55|70|77|99|10|60)[0-9]{7}$/;
  return re.test(cleaned);
};

export const isStrongPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Şifrə ən azı 6 simvoldan ibarət olmalıdır' };
  }
  return { valid: true };
};
