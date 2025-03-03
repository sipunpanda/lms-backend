import cloudinary from 'cloudinary'
import fs from 'fs/promises'
import crypto from 'crypto'

import User from '../models/user.model.js'
import AppError from '../utils/appError.js'
import sendEmail from '../utils/sendEmail.js'




const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? true : false,
    sameSite: "None",
}


const register = async (req, res, next) => {
    const { fullName, email, password } = req.body;


    try {


        if (!fullName || !email || !password || !req.file) {
            return next(new AppError('All fields are required', 400))
        }

        const userExist = await User.findOne({ email });
        if (userExist) {
            return next(new AppError('Email already in use', 400))
        }

        const user = await User.create({
            
            fullName,
            email,
            password,
            avatar: {
                public_id: email,
                secure_url: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1674647316/avatar_drzgxv.jpg', // replace with your cloudinary url
            }
        });
        if (!user) {
            return next(new AppError('Failed to create user', 500))

        }

        //Upload file to cloudinary
        if (req.file) {

            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms', // save files in a folder named avatars
                    width: 250,
                    height: 250,
                    gravity: 'faces', // center the image around detected faces
                    crop: 'fill',

                });

                if (result) {
                    user.avatar = {
                        public_id: result.public_id,
                        secure_url: result.secure_url,
                    }
                }
                //Remove temporary files
                fs.rm(`uploads/${req.file.filename}`)

                //for extra data upload if available
                if(req.body.role){
                    user.role = req.body.role
                }

                await user.save();

            } catch (e) {
                fs.rm(`uploads/${req.file.filename}`)

                return next(new AppError('Failed to upload avatar', 500))

            }
        }

        user.password = undefined;

        const token = await user.generateJWTToken();
        res.cookie("token", token, cookieOptions);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user
        })


    } catch (e) {
        return next(new AppError('Failed to Resister an User'));
    }
};

const login = async (req, res, next) => {




    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new AppError('Email and password are required', 400))
        }
        const user = await User.findOne({ email }).select('+password');
        if (!(user && await user.comparePassword(password))) {

            return next(new AppError('Invalid email or password does not match', 401))
        }

        user.password = undefined;


        const token = await user.generateJWTToken();
        res.cookie("token", token, cookieOptions);

        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            user
        })
    } catch (error) {
        return next(new AppError(error.message, 500))
    }
};

const logout = (req, res, next) => {
    res.cookie("token", null, { maxAge: 0, secure: true, httpOnly: true });
    res.status(200).json({
        success: true,
        message: 'User logged out successfully'
    })

};

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        

        if (!user) {
            return next(new AppError('User not found', 404))
        }
        res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            user
        })
    } catch (error) {
        return next(new AppError("Failed to fetch User profile", 500))

    }

};

const forgotPassword = async (req, res, next) => {
    // TODO: Implement forgot password logic
    const { email } = req.body;

    if (!email) {
        return next(new AppError('Email is required', 400))
    }

    const user = await User.findOne({ email })
    if (!user) {
        return next(new AppError('User not found', 404))
    }

    const resetToken = await user.generatePasswordResetToken();

    await user.save();

    const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // console.log(resetPasswordUrl);


    // We here need to send an email to the user with the token
    const subject = 'Reset Password';
    const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n This is valid for 15 minutes.\n If you have not requested this, kindly ignore.`;

    try {
        await sendEmail(email, subject, message);

        res.status(200).json({
            success: true,
            message: `Email sent to ${email} successfully, please check your email to reset your password.`
        });
    } catch (e) {

        user.forgotPasswordExpiryDate = undefined;
        user.forgotPasswordToken = undefined;

        await user.save();
        return next(new AppError(e.message, 500));

    }

};

const resetPassword = async (req, res, next) => {
    // TODO: Implement reset password logic
    const { resetToken } = req.params;

    const { password } = req.body;
    if (!password) {
        return next(new AppError('Password is required', 400))
    }

    const forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // console.log(forgotPasswordToken);

    // Checking if token matches in DB and if it is still valid(Not expired)
    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiryDate: { $gt: Date.now() }, // $gt will help us check for greater than value, with this we can check if token is valid or expired
    });




    if (!user) {
        return next(new AppError('Invalid token or token expired', 400))
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiryDate = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        //    user
    })




};

const updatePassword = async (req, res, next) => {

    try {
        const userId = req.user.id;
        const newPassword = req.body.password;

        if (!newPassword) {
            return next(new AppError('Password is required', 400))
        }

        const user = await User.findById(userId);
        
        if (!user) {
            return next(new AppError('User not found', 404))
        }


        // user.password = newPassword

        await user.save();

        user.password = undefined; // Remove password from response to avoid security issues

        res.status(200).json({
            success: true,
            message: 'Password updated successfully',
            user
        })

    } catch (e) {
        return next(new AppError('Failed to update password', 400))

    }
};


const updateUser = async (req, res, next) => {
    // Destructuring the necessary data from the req object
    const { fullName } = req.body;
    const { id } = req.user;
  
    const user = await User.findById(id);
  
    if (!user) {
      return next(new AppError('Invalid user id or user does not exist'));
    }
  
    if (fullName) {
      user.fullName = fullName;
    }
  
    // Run only if user sends a file
    if (req.file) {
      // Deletes the old image uploaded by the user
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
  
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: 'lms', // Save files in a folder named lms
          width: 250,
          height: 250,
          gravity: 'faces', // This option tells cloudinary to center the image around detected faces (if any) after cropping or resizing the original image
          crop: 'fill',
        });
  
        // If success
        if (result) {
          // Set the public_id and secure_url in DB
          user.avatar.public_id = result.public_id;
          user.avatar.secure_url = result.secure_url;
  
          // After successful upload remove the file from local storage
          fs.rm(`uploads/${req.file.filename}`);
        }
      } catch (error) {
        return next(
          new AppError(error || 'File not uploaded, please try again', 400)
        );
      }
    }
  
    // Save the user object
    await user.save();
  
    res.status(200).json({
      success: true,
      message: 'User details updated successfully',
    });
  };
  


export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    updatePassword,
    updateUser
};
