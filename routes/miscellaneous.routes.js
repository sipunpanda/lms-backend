import { Router } from 'express';
import {
  contactUs,
  userStats,
} from '../controllers/miscellaneous.controller.js';
import { authorizedRole, isLoggedIn } from '../middlewares/auth.middleware.js';

const router = Router();

// {{URL}}/api/v1/
router.route('/contact').post(contactUs);
router
  .route('/admin/stats/users')
  .get(isLoggedIn, authorizedRole('ADMIN'), userStats);

export default router;
