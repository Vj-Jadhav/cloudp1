import mongoose from 'mongoose';

/**
 * Middleware to validate whether req.params.id is a valid MongoDB ObjectId.
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'InvalidId',
        message: `Invalid identifier format: "${id}". Expected a valid 24-character hexadecimal MongoDB ObjectId.`,
      });
    }

    next();
  };
};
