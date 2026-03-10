/**
 * Generic Joi validation middleware factory.
 * Usage: router.post("/", validate(myJoiSchema), controller)
 */
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    res.status(400);
    return next(new Error(error.details.map((d) => d.message).join(", ")));
  }
  req.body = value;
  next();
};
