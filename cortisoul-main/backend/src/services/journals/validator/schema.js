import Joi from 'joi';

export const journalPayloadSchema = Joi.object({
  title: Joi.string().required().max(50),
  content: Joi.string().required(),
});
