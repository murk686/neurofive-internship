const { User } = require('../models');
const { signToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const signup = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role });

  const token = signToken({ sub: user.id, role: user.role });

  res.status(201).json({
    success: true,
    data: { user: toPublicUser(user), token },
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ sub: user.id, role: user.role });

  res.status(200).json({
    success: true,
    data: { user: toPublicUser(user), token },
  });
});

const me = catchAsync(async (req, res) => {
  res.status(200).json({ success: true, data: { user: toPublicUser(req.user) } });
});

module.exports = { signup, login, me };
