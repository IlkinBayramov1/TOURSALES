import ApiError from '../../core/api.error.js';

export const validateRegister = (req, res, next) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return next(ApiError.badRequest('Email, password, and name are required'));
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(ApiError.badRequest('Email and password are required'));
  }
  next();
};
