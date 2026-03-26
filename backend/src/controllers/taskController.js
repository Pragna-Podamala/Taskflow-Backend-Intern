const Task = require('../models/Task');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Build filter query from request params
 */
const buildFilter = (req) => {
  const filter = {};
  // Regular users only see their own tasks; admins can see all
  if (req.user.role !== 'admin') filter.owner = req.user._id;

  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.tags) filter.tags = { $in: req.query.tags.split(',') };
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }
  if (req.query.dueBefore) filter.dueDate = { ...filter.dueDate, $lte: new Date(req.query.dueBefore) };
  if (req.query.dueAfter) filter.dueDate = { ...filter.dueDate, $gte: new Date(req.query.dueAfter) };

  return filter;
};

/**
 * @route   GET /api/v1/tasks
 * @desc    Get all tasks (paginated, filtered)
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortField = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const filter = buildFilter(req);

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('owner', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter),
    ]);

    return successResponse(res, 'Tasks fetched', tasks, 200, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/tasks/:id
 * @desc    Get single task
 * @access  Private
 */
const getTask = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.owner = req.user._id;

    const task = await Task.findOne(query)
      .populate('owner', 'name email')
      .populate('assignedTo', 'name email');

    if (!task) return errorResponse(res, 'Task not found.', 404);

    return successResponse(res, 'Task fetched', task);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/tasks
 * @desc    Create a new task
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const taskData = { ...req.body, owner: req.user._id };
    const task = await Task.create(taskData);
    await task.populate('owner', 'name email');

    return successResponse(res, 'Task created successfully', task, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/tasks/:id
 * @desc    Update a task
 * @access  Private (owner or admin)
 */
const updateTask = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.owner = req.user._id;

    // Disallow changing owner
    delete req.body.owner;

    const task = await Task.findOneAndUpdate(query, req.body, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name email');

    if (!task) return errorResponse(res, 'Task not found or unauthorized.', 404);

    return successResponse(res, 'Task updated', task);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/tasks/:id
 * @desc    Delete a task
 * @access  Private (owner or admin)
 */
const deleteTask = async (req, res, next) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.owner = req.user._id;

    const task = await Task.findOneAndDelete(query);
    if (!task) return errorResponse(res, 'Task not found or unauthorized.', 404);

    return successResponse(res, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/tasks/stats
 * @desc    Get task statistics for dashboard
 * @access  Private
 */
const getTaskStats = async (req, res, next) => {
  try {
    const matchFilter = req.user.role !== 'admin' ? { owner: req.user._id } : {};

    const stats = await Task.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await Task.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const overdueTasks = await Task.countDocuments({
      ...matchFilter,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'archived'] },
    });

    const formatted = {
      byStatus: stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      byPriority: priorityStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      overdue: overdueTasks,
      total: Object.values(stats).reduce((sum, s) => sum + s.count, 0),
    };

    return successResponse(res, 'Stats fetched', formatted);
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getTaskStats };
