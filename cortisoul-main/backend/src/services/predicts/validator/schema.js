import Joi from 'joi';

export const predictTextSchema = Joi.object({
  text: Joi.string().min(1).required(),
});
