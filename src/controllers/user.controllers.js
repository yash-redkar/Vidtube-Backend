import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userId) => {
  try{
    const user = await User.findById(userId)

    //small check for user existence
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    
    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})
    return {accessToken, refreshToken}
  }
  catch(error){
    throw new ApiError(500,"Something went wrong while generating access and refresh token");
    
  }
}


const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  //  Validate required fields
  if ([fullname, username, email, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  //  Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username: username.toLowerCase() }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  //  Handle file paths from multer
  // console.warn(req.files); // Debug: Check multer file upload structure

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  // Upload images to Cloudinary
  let avatar, coverImage;

  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    //console.log("Uploaded avatar:", avatar);
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw new ApiError(500, "Failed to upload avatar");
  }

  if (coverLocalPath) {
    try {
      coverImage = await uploadOnCloudinary(coverLocalPath);
    //  console.log("✅Uploaded cover image:", coverImage);
    } catch (error) {
      console.error("Error uploading cover image:", error);
      throw new ApiError(500, "Failed to upload cover image");
    }
  }

  // 🔹 Create user
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  try {
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    // Send success response
    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registered successfully"));
  } catch (error) {
    console.error("❌ User creation failed:", error);

    // Clean up uploaded images on error
    if (avatar?.public_id) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage?.public_id) {
      await deleteFromCloudinary(coverImage.public_id);
    }

    throw new ApiError(
      500,
      "User registration failed, uploaded images deleted for cleanup"
    );
  }
});


const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // Validation: at least one of email or username must be provided
  if (!email && !username) {
    throw new ApiError(400, "Email or username is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  // Find user by email or username
  const user = await User.findOne({
    $or: [
      email ? { email } : null,
      username ? { username: username.toLowerCase() } : null,
    ].filter(Boolean),
  });

  if (!user) {
    throw new ApiError(401, "Invalid credentials"); // generic message for security
  }

  // Validate password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // Fetch logged-in user without sensitive fields
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler( async (req,res) => {

  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized request");
  }

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {new: true}
  )

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(
      200,
      {},
      "User Logged out successfully"
    ))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"Refresh token is required")
  }

  try {
     const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id)

    if(!user){
      throw new ApiError(401,"Invalid refresh token")
    }

    if(incomingRefreshToken != user?.refreshToken){
      throw new ApiError(401,"Invalid refresh token")
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    };

    const {accessToken, refreshToken: newRefreshToken}= await generateAccessAndRefreshToken(user._id)

    return res
      .status(200)
      .cookie("accessToken",accessToken, options)
      .cookie("refreshToken",newRefreshToken,options)
      .json(
        new ApiResponse(200,{accessToken,refreshToken: newRefreshToken}, "Access token refreshed successfully")
      );

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Refresh token expired, please login again");
    } else if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid refresh token");
    } else {
      throw new ApiError(
        500,
        "Something went wrong while refreshing access token"
      );
    }
  }

})

const changeCurrentPassword = asyncHandler(async (req,res) => {
  const {oldPassword, newPassword} = req.body

  const user = await User.findById(req.user?._id)

  const isPasswordValid = await user.isPasswordCorrect(oldPassword)

  if(! isPasswordValid){
    throw new ApiError(401, "Old password is incorrect")
  }

  user.password = newPassword

  await user.save({validateBeforeSave: false})

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))

})


const getCurrentUser  = asyncHandler(async (req,res) => {
  return res
  .status(200)
  .json(new ApiResponse(200, req.user, "Current User details"));
})


const updateAccountDetails  = asyncHandler(async (req,res) => {
  const {fullname , email} = req.body

  if(!fullname || !email){
    throw new ApiError(400,"Fullname and email is required");
  }

  const user = await User
  .findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email: email
      }
    },
    {new: true}
  ).select("-password -refreshToken")

  return res.status(200).json(new ApiResponse(200,user, " Account Details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req,res) => {
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"File is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(500, "Something went wrong while uplodaing avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password -refreshToken")

  res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req,res) => {
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400, "File is required")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(500, "Something went wrong while uploading cover image")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {new: true}
  ).select("-password -refreshToken")

  return res.status(200).json(new ApiResponse(200, user, "Cover image is updated successfully"))

})

export {
   registerUser,
   loginUser, 
   refreshAccessToken, 
   logoutUser,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,updateUserAvatar,updateUserCoverImage
  };
