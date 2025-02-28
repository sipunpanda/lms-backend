import { model, Schema } from "mongoose";

const paymentSchema = Schema({
    razorpay_payment_id: {
        type: String,
        required: true
    },
    razorpay_subscription_id: {
        type: String,
        required: true
    },
    razorpay_signature: {
        type: String,
        required: true
    },
    // razorpay_payment_amount:{
    //     type: Number,
    //     required: true
    //     },

}, {
    timestamps: true
});

const Payment = model('Payment', paymentSchema);

export default Payment;