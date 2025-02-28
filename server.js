import dotenv from 'dotenv';
import cloudinary from 'cloudinary';
import Razorpay from 'razorpay'

import app from './app.js';
import connectToDB from './config/dbConnection.js';


dotenv.config();

//cloudinary config 
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
 // secure: true,
});

//razorpay config
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
 //   version: '4.6.0', // optional
});


const PORT = process.env.PORT || 8080

app.listen(PORT, async() => {
    await connectToDB();
  console.log(`Server is running on port ${PORT}`);
});




