import { Router } from 'express';
import { buySubscription, cancelSubscription, getAllPayments, getRazorpayApiKey, verifySubscription } from '../controllers/payment.controller.js';
import { isLoggedIn, authorizedRole } from '../middlewares/auth.middleware.js'


const router = Router();

router
    .route('/razorpay-key')
    .get(isLoggedIn, getRazorpayApiKey);

router
    .route('/subscribe')
    .post(isLoggedIn, buySubscription);

router
    .route('/verify-subscription')
    .post(isLoggedIn, verifySubscription);

router
    .route('/unsubscribe')
    .post(isLoggedIn, cancelSubscription);

router
    .route('/')
    .get(isLoggedIn, authorizedRole('ADMIN'), getAllPayments);

export default router;







