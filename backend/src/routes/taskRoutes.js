const express = require('express');
const router = express.Router();
const {
  getTasks, getTask, createTask, updateTask, deleteTask, getTaskStats,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { taskValidator, taskUpdateValidator, mongoIdValidator, paginationValidator } = require('../validators');

// All task routes require authentication
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management CRUD
 */

/**
 * @swagger
 * /tasks/stats:
 *   get:
 *     summary: Get task statistics
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', getTaskStats);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks (paginated)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in-progress, completed, archived] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, urgent] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.route('/')
  .get(paginationValidator, validate, getTasks)
  .post(taskValidator, validate, createTask);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 */
router.route('/:id')
  .get(mongoIdValidator('id'), validate, getTask)
  .put(mongoIdValidator('id'), taskUpdateValidator, validate, updateTask)
  .delete(mongoIdValidator('id'), validate, deleteTask);

module.exports = router;
