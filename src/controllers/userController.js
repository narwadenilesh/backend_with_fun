import { asyncHandler } from "../utils/asynchandler.js";
import {ApiError}  from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOncloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req , res)=>{
    //get user details from frontend
    //validation - not empty
    //check if already exists  - username, email
    //check for images , check for avtar
    //upload them to cloudinary, avtar
    //crate user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res
    
    //first step get details from frontend 
    const {fullName, email, username, password} = req.body;

    if(
        [fullName, email, username, password] .some((field) => {
            field?.trim() === ""
    })){
        throw new ApiError(400, "all fields are required")
    }

    const existedUser = User.findOne({
        $or : [{username},  {email}]
    })

    if (existedUser) {
        throw new ApiError(409, "user with email or username  already exists")
    }
    
    const avatarLocalPath = req.files ?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await  uploadOncloudinary(avatarLocalPath)
    const coverImage = await  uploadOncloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage ?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser = User.findById(User._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )

})

export {registerUser}