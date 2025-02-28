import mongoose from 'mongoose';

mongoose.set('strictQuery', false);

const connectToDB = async () => {
    try {
        const {connection} = await mongoose.connect(
            process.env.MONGO_URI ||'mongodb://127.0.0.1:27017/lms'
        );
        if (connection) {
            console.log(`Connected to MongoDB: ${connection.host}`);
        }
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}


export default connectToDB;




