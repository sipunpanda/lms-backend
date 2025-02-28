import mongoose, { Schema, model } from "mongoose";

const courseSchema = new Schema({
    title: {
        type: String,
        required: true,
        minLength: [8, "minimum length of the title field is 8 characters"],
        maxLength: [50, "maximum length of the title field is 50 characters"],
        trim: true,
    },
    description: {
        type: String,
        required: true,
        minLength: [8, "minimum length of the description field is 8 characters"],
        maxLength: [200, "maximum length of the description field is 200 characters"],
        trim: true,
    },
    category:{
        type: String,
        required: [true, "Category is required"],

    },
    thumbnail:{
        public_id: {
            type: String,
            required: [true, "Thimbnail is required"]
        },
        secure_url: {
            type: String,
            required: [true, "Thimbnail secure_url is required"]
        },

    },
    lectures:[{
        title: String,
        description: String,
        lecture: {
            public_id: {
                type: String,
                required: [true, "Lecture public_id is required"],
            },
            secure_url: {
                type: String,
                required: [true, "Lecture secure_url is required"],
            },

        }
    }
    ],
    numbersOfLectures:{
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        
        required: [true, "Course createdBy is required"],
    }
},{
    timestamps: true
});


const Course = model("Course", courseSchema);

export default Course;