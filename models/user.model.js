import mongoose, { model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new Schema({
    fullName: {
        type: String,
        required: [true, 'Name must be provided'],
        minLength: [5, 'Name must be at least 5 characters'],
        maxLength: [50, 'Name must be at most 50 characters'],
        lowercase: true,
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email must be provided'],
        unique: true,
        trim: true,
        unique: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
        lowercase: true,
    },

    password: {
        type: String,
        required: [true, 'Password must be provided'],
        minLength: [8, 'Password must be at least 8 characters'],
        trim: true,
        select: false, // Do not show password in response
    },
    avatar: {
        public_id: {
            type: String,
        },
        secure_url: {
            type: String,
        }
    },
    role: {
        type: String,
        enum: ['ADMIN', 'USER'],
        default: 'USER',
    },
    forgotPasswordToken: String,
    forgotPasswordExpiryDate: Date,
    subscription:{
        id: String,
        status: String,
    }

}, {
    timestamps: true, // Add createdAt and updatedAt fields automatically
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hashSync(this.password, 10);

});

userSchema.methods = {
    generateJWTToken: function () {
        return jwt.sign({
            id: this._id,
            email: this.email,
            subscription: this.subscription,
            role: this.role
        }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
    },
    comparePassword: async function (password) {
        return await bcrypt.compare(password, this.password);
    },
    generatePasswordResetToken: async function () {
        const resetToken = crypto.randomBytes(20).toString('hex');

        this.forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        this.forgotPasswordExpiryDate = Date.now() + 15 * 60 * 1000
        return resetToken;
    }
};

const User = model("User", userSchema)

// Export the model
export default User;
