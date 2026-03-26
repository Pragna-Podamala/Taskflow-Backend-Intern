const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, getDashboard } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { mongoIdValidator } = require('../validators');

// All admin routes require auth + admin role
router.use(protect, authorize('admin'));

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only operations
 */

router.get('/dashboard', getDashboard);

router.route('/users')
  .get(getAllUsers);

router.route('/users/:id')
  .get(mongoIdValidator('id'), validate, getUserById)
  .patch(mongoIdValidator('id'), validate, updateUser)
  .delete(mongoIdValidator('id'), validate, deleteUser);

module.exports = router;
