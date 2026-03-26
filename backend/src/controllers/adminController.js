const User = require('../models/User');
const Task = require('../models/Task');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @route   GET /api/v1/admin/users
 * @access  Admin only
 */
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive) filter.isActive = req.query.isActive === 'true';

    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return successResponse(res, 'Users fetched', users, 200, {
      total, page, limit, totalPages: Math.ceil(total / limit),
    });
  } catch (error) { next(error); }
};

/**
 * @route   GET /api/v1/admin/users/:id
 * @access  Admin only
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found.', 404);
    return successResponse(res, 'User fetched', user);
  } catch (error) { next(error); }
};

/**
 * @route   PATCH /api/v1/admin/users/:id
 * @desc    Update user role or status
 * @access  Admin only
 */
const updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, isActive },
      { new: true, runValidators: true }
    );
    if (!user) return errorResponse(res, 'User not found.', 404);
    return successResponse(res, 'User updated', user);
  } catch (error) { next(error); }
};

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Admin only
 */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return errorResponse(res, 'You cannot delete your own account.', 400);
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return errorResponse(res, 'User not found.', 404);
    // Clean up user's tasks
    await Task.deleteMany({ owner: req.params.id });
    return successResponse(res, 'User deleted successfully');
  } catch (error) { next(error); }
};

/**
 * @route   GET /api/v1/admin/dashboard
 * @access  Admin only
 */
const getDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalTasks, recentUsers, tasksByStatus] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      User.find().sort('-createdAt').limit(5),
      Task.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    return successResponse(res, 'Dashboard data', {
      totalUsers,
      totalTasks,
      recentUsers,
      tasksByStatus: tasksByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
    });
  } catch (error) { next(error); }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, getDashboard };
