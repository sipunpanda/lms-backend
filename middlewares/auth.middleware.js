import AppError from "../utils/appError.js";
import jwt from 'jsonwebtoken';

const isLoggedIn = async (req, res, next) =>{

    const {token} = await (req.cookies);


    if(!token) return next(new AppError("Invalid token provided to login request Please Log In... "))

        const userDetails = await jwt.verify(token, process.env.JWT_SECRET);

        if(!userDetails){
            return next(new AppError("Please LogIn", 500));
        }

        req.user = userDetails ;

        next();

}


const authorizedRole = (...roles)=> (req,res,next)=>{
    const currentUserRole = req.user.role;
    
    if(!roles.includes(currentUserRole)){
        return next(new AppError("You do not have permission to access this route", 500));
    }
    next();

}


const authorizeSubscriber = (req, res, next)=>{
    try {
        
        const subscription = req.user.subscription;
        const currentUserRole = req. user. role;
        if(currentUserRole !== 'ADMIN' && subscription.status !== 'active') return next(new AppError("Please Subscribe to access Lectures", 400));
        
        next();
    } catch (error) {
        console.log(error);
        return next(new AppError("An error occurred while authorizing subscriber", 500));
        
    }
}

export {
    isLoggedIn,
    authorizedRole,
    authorizeSubscriber,
 
}