import Course from "../models/course.model.js"
import AppError from "../utils/appError.js"
import fs from 'fs/promises'
import cloudinary from 'cloudinary'


const getAllCourses = async (req, res, next) => {
    
    try {
        const courses = await Course.find({}).select('-lectures')

        if (!courses) {
            return next(new AppError("No courses found", 404))  // If no courses are found, throw an error with status 404. 404 means not found. 400 means bad request. 401 means unauthorized. 403 means forbidden. 404 means not found. 410 means gone. 500 means server error.
        }


        res.status(200).json({
            success: true,
            message: "All courses",
            courses

        })
    } catch (e) {
        return next(new AppError("Unable to Fetch all courses", 400))
    }

}

const getLectureById = async (req, res, next) => {
    try {
        const { id } = req.params;


        const course = await Course.findById(id);

        if (!course) {
            return next(new AppError("Course not found", 404))
        }
        res.status(200).json({
            success: true,
            message: "Course lectures",
            lectures: course.lectures
        })

    } catch (e) {
        return next(new AppError("Unable to fetch course lectures", 400))

    }
}

const createCourse = async (req, res, next) => {
    try {

        const { title, description, category, createdBy } = req.body;
        if (!title || !description || !category || !createdBy) {
            return next(new AppError("All fields are required", 400))
        }

        const newCourse = await Course.create({
            title,
            description,
            category,
            createdBy,
            thumbnail: {
                public_id: 'Dummy Data',
                secure_url: 'Dummy Data'
            }
        })

        if (!newCourse) {
            return next(new AppError("Unable to create course", 400))
        }
        try {

            if (req.file) {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms'
                });

                if (result) {
                    newCourse.thumbnail.public_id = result.public_id;
                    newCourse.thumbnail.secure_url = result.secure_url;
                }
                fs.rm(`uploads/${req.file.filename}`);
            }
        } catch (e) {
            fs.rm(`uploads/${req.file.filename}`);
            return next(new AppError(`Error uploading image: ${e.message}`, 400))

        }
        await newCourse.save();
        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course: newCourse
        })

    } catch (e) {
        return next(new AppError("Unable to create course", 400))

    }

}

const updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params; //test param id

        if (!(await Course.findById(id))) {
            return next(new AppError("Invalid Id, Active Id is required", 400))
        }

        const course = await Course.findByIdAndUpdate(
            id,
            {
                $set: req.body
            },
            {
                runValidators: true
            }
        );
        if (!course) {
            return next(new AppError("Unable to update course Id does not exist", 500))
        }
        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            course: course
        }

        );


    } catch (e) {
        return next(new AppError("Unable to update course", 400))


    }

}

const deleteCourse = async (req, res, next) => {
    try {
        const { id } = req.params; //test param id

        if (!(await Course.findById(id))) {
            return next(new AppError("Invalid Id, Active Id is required", 400))
        }
        const course = await Course.findByIdAndDelete(id)
        if (!course) {
            return next(new AppError("Unable to delete course Id does not exist", 500))
        }



        res.status(200).json({
            success: true,
            message: "Course deleted successfully",
            course: course
        })




    } catch (e) {
        return next(new AppError(`Unable to delete course: ${e.message}`, 400))

    }
}

const addLectureToCourseById = async (req, res, next) => {
    try {
        const { title, description } = req.body;
        const { id } = req.params;
        if (!title || !description) {
            return next(new AppError("Title and Description are required", 400))
        }
        const course = await Course.findById(id);
        if (!course) {
            return next(new AppError("Course not found, Invalid id !", 404))
        }

        const lectureData = {
            title,
            description,
            lecture: {}
        };

        try {
            if (req.file) {

                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms', // Save files in a folder named lms
                    chunk_size: 50000000, // 50 mb size
                    resource_type: 'video',
                });
                console.log("file print>>", req.file);


                if (result) {

                    lectureData.lecture.public_id = result.public_id;
                    lectureData.lecture.secure_url = result.secure_url;
                }
                fs.rm(`uploads/${req.file.filename}`);
            }

        } catch (e) {
            fs.rm(`uploads/${req.file.filename}`);
            return next(new AppError(`Error uploading video: ${e}`, 400));

        }

        course.lectures.push(lectureData);
        course.numbersOfLectures = course.lectures.length;
        await course.save();

        res.status(200).json({
            success: true,
            message: "Lecture added successfully",
            course: course
        });


    } catch (error) {
        return next(new AppError("Unable to add lecture", 400));

    }


}


const deleteLectureFromCourseById = async (req, res, next) => {
    try {
        // Get the  course data from the server and remove it from the database  
        const { id, lectureId } = req.params;
        if (!id || !lectureId) {
            return next(new AppError("Id and Lecture Id are required", 400))
        }
        const course = await Course.findById(id);
        if (!course) {
            return next(new AppError("Course not found, Invalid id!", 404))

        }
        if (course.lectures.length === 0) {
            return next(new AppError("No lectures found in this course", 404))

        }
        // Check if the lecture exists in the course
        const lectureIndex = course.lectures.findIndex(lecture => lecture.id.toString() === lectureId);
        if (lectureIndex === -1) {
            return next(new AppError("Lecture not found in this course", 404))

        }
        // Delete the lecture from the course

        // Delete the lecture from cloudinary
       try {
         await cloudinary.v2.uploader.destroy(
             course.lectures[lectureIndex].lecture.public_id,
             {
                 resource_type: 'video',
             }
         );
        } catch(error){
             console.error(`Error deleting lecture from cloudinary: ${error}`);
             return next(new AppError(`Error deleting lecture from cloudinary: ${error.message}`, 500));

 
        }

        // Remove the lecture from the array
        course.lectures.splice(lectureIndex, 1);
        // Update the number of lectures in the course document
        course.numbersOfLectures = course.lectures.length;
        await course.save();
        res.status(200).json({
            success: true,
            message: "Lecture deleted successfully",
            course: course
        });

    }
    catch (error) {
        return next(new AppError("Unable to delete lecture", 400));

    }
}


export {
    getAllCourses,
    getLectureById,
    createCourse,
    updateCourse,
    deleteCourse,
    addLectureToCourseById,
    deleteLectureFromCourseById
}