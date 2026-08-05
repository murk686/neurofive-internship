const Joi = require('joi');

const createPostSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  body: Joi.string().min(10).required(),
  category: Joi.string().valid('Technology', 'Science', 'Health', 'Business', 'Travel').required(),
  status: Joi.string().valid('published', 'draft').default('published'),
});

const updatePostSchema = Joi.object({
  title: Joi.string().min(3).max(100),
  body: Joi.string().min(10),
  category: Joi.string().valid('Technology', 'Science', 'Health', 'Business', 'Travel'),
  status: Joi.string().valid('published', 'draft'),
}).min(1);

const createCommentSchema = Joi.object({
  body: Joi.string().min(1).max(500).required(),
});

module.exports = { createPostSchema, updatePostSchema, createCommentSchema };
