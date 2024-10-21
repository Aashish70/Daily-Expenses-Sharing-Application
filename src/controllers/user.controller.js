import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from '../utils/ApiResponse.js'
import { User } from '../models/user.model.js'
import jwt from "jsonwebtoken"
import mongoose from "mongoose"



const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        console.log("User in method", user)

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return {accessToken, refreshToken}

    } catch (error) {
        console.error('Error generating tokens:', error);
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}


// Register a new user
const registerUser = asyncHandler(async (req, res) => {

    const { name, email, mobile, password } = req.body;

    if([name, email, mobile, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({ email });
    if(existedUser){
        throw new ApiError(400, "User with this email already exists")
    }

    const user = await User.create(
        {
            name,
            email,
            mobile,
            password
        }
    )

    const createdUser = await User.findById(user._id).select("-password -refreshToken ")

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser)
    )
});


// Login a user
const loginUser = asyncHandler(async (req, res) => {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if(!user){
        throw new ApiError(400, "User with this email does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(400, "Invalid password")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken ")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Logged In Successfully"
    ))
})


// Logout a user

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(req.user._id, 
        {
            $unset: { 
                refreshToken: 1
            }
        },

        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User Logged Out Successfully"))
})



const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    console.log("incoming refresh token", incomingRefreshToken)
    if(!incomingRefreshToken || incomingRefreshToken === "null"){
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401, "Refresh Token is Expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
       
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { accessToken: accessToken, refreshToken: refreshToken}, "Access Token Refreshed"));

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

const getUserDetails = asyncHandler(async (req, res) => {
    const userId = req.params.userId;

    // console.log("Received userId:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, 'Invalid User ID');
    }

    const user = await User.findById(userId).select("-password -refreshToken");
    
    if(!user){
        throw new ApiError(404, "User not found")
    }

    return res.status(200).json(new ApiResponse(200, user, "User details retrieved successfully"));
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getUserDetails
}