import AppError from "../utils/appError.js";
import User from '../models/user.model.js';
import { razorpay } from "../server.js";
import Payment from "../models/payment.model.js";

import crypto from 'crypto';






export const getRazorpayApiKey = async (req, res, next) => {
   
    res.status(200).json({
        success: true,
        message: "Razorpay API key",
        apiKey: process.env.RAZORPAY_KEY_ID
    });

}


export const buySubscription = async (req, res, next) => {

    try {
        
        const { id } = req.user;
        const user = await User.findById(id);
        
        
        if (!user) return next(new AppError("Unauthorized, please login", 401));
        
        if (user.role == 'ADMIN') {
            return next(new AppError("Admin cannot purchase a subscription", 400));
        }
        
        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 1,
            total_count: 12,
        });
        
        
        // console.log("subscription created", subscription);
        

        if (!subscription) return next(new AppError(" subscription is not available for subscription ", 404));

        // subscription is already in the subscription list and we can purchase it immediately 
        user.subscription.id = subscription.id;
        user.subscription.status = subscription.status;
        
        await user.save();
        
        // console.log("in payment contriloller");
        res.status(200).json({
            success: true,
            message: "Successfully purchased a subscription",
            subscription_id: subscription.id
        });




    } catch (e) {
        next(new AppError("Failed to buy subscription", 500));
    }

}

export const verifySubscription = async (req, res, next) => {
    const { id } = req.user
    
    const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = req.body;
    

    const user = await User.findById(id);
    if (!user) return next(new AppError("Unauthorized, please login", 401));

    const subscriptionId =  user.subscription.id;    

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_SECRET)
        .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
        .digest('hex');

    if (generatedSignature !== razorpay_signature) return next(new AppError("Invalid signature", 400));

    const payment = await Payment.create({
        razorpay_payment_id,
        razorpay_signature,
        razorpay_subscription_id

    });

    if (!payment) return next(new AppError("Unable to create payment", 400));

    user.subscription.status = 'active';// remember to add created
    await payment.save();
    await user.save();

    res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        payment_id: payment.id
    });


}

export const cancelSubscription = async (req, res, next) => {
    try {
        const { id } = req.user
    
        const user = await User.findById(id);
        if (!user) return next(new AppError("Unauthorized, please login", 401));
    
        if (user.role == 'ADMIN') {
            return next(new AppError("Admin cannot purchase a subscription", 400));
        }
    
    
        const subscriptionId = user.subscription.id;
    
        const subscription = await razorpay.subscriptions.fetch(subscriptionId);
        if (!subscription) return next(new AppError("Subscription not found", 404));
        if (subscription.status == 'active') {
            await razorpay.subscriptions.cancel(subscriptionId);
            user.subscription.status = 'cancelled';
            await user.save();
    
            
            return res.status(200).json({
                success: true,
                message: "Subscription cancelled successfully",
                subscription_id: subscriptionId
            });
        } else {
            return res.status(500).json({
                success: false,
                message: "Subscription is already cancelled, Subscription status is Not Active please try again later",
                subscription_id: subscriptionId
            });
            }
    } catch (error) {
        return next(new AppError("Unable to cancel subscription", 500));
        
    }


    }


export const getAllPayments = async (req, res, next) => {
    try {
        const { count } = req.query;
        console.log("heeeeee");
        

        const subscriptions = await razorpay.subscriptions.all({
            count: count || 10,
        });

        res.status(200).json({
            success: true,
            message: "Payments fetched successfully",
            subscriptions:subscriptions,
        })


    }
    catch (error) {
        return next(new AppError("Unable to get payments", 500));
        
    }

}
