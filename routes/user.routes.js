import { Router } from "express";
import {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    updatePassword,
    updateUser
} from '../controllers/user.controller.js'
import upload from "../middlewares/multer.middleware.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = Router();

router.post('/register', upload.single("avatar"), register);
router.post('/login', login);
router.get('/logout', isLoggedIn, logout);
router.get('/me', isLoggedIn, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);
router.post('/update-password', isLoggedIn, updatePassword);
router.post('/update-user/:id', isLoggedIn, upload.single("avatar"), updateUser);







export default router

