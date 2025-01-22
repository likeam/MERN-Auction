import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { generateToken } from "../utils/jwtToken.js";

export const register = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Profile Image Required", 400));
  }

  const { profileImage } = req.files;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];

  if (!allowedFormats.includes(profileImage.mimetype)) {
    return next(new ErrorHandler("File format not supported", 400));
  }

  const {
    name,
    email,
    password,
    phone,
    address,
    role,
    bankAccountNumber,
    bankAccountName,
    bankName,
    jazzcashAccountNumber,
    easypasiaAccountNumber,
    paypalEmail,
  } = req.body;

  if (!name || !email || !phone || !password || !address || !role) {
    return next(new ErrorHandler("Please fill full form.", 400));
  }

  if (role === "Actioneer") {
    if (!bankAccountName || !bankAccountNumber || !bankName) {
      return next(
        new ErrorHandler("Please provide your full bank detail", 400)
      );
    }

    if (!easypasiaAccountNumber) {
      return next(
        new ErrorHandler("Please provide Easy paisa Account number", 400)
      );
    }

    if (!jazzcashAccountNumber) {
      return next(
        new ErrorHandler("Please provide Jazz Cash Account number", 400)
      );
    }

    if (!paypalEmail) {
      return next(new ErrorHandler("Please provide Paypal Email", 400));
    }
  }

  const isRegistered = await User.findOne({ email });

  if (isRegistered) {
    return next(new ErrorHandler("User is already registered", 400));
  }

  const cloudinaryResponse = await cloudinary.uploader.upload(
    profileImage.tempFilePath,
    {
      folder: "MERN_AUCTION_USERS",
    }
  );
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.log(
      "Cloudinary error : ",
      cloudinaryResponse.error || "Unknown Cloudianry "
    );
    return next(
      new ErrorHandler("Failed to upload  image to cloudinary", 500)
    );
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    role,
    profileImage: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
    paymentMethods: {
      bankTransfer: {
        bankAccountName,
        bankAccountNumber,
        bankName,
      },
      easypasia: {
        easypasiaAccountNumber,
      },
      jazzcash: {
        jazzcashAccountNumber,
      },
      paypal: {
        paypalEmail,
      },
    },
  });
  res.status(201).json({
    success: true,
    message: "User Registered Successfully",
  });
  generateToken(user, "User Resgiterd Successfully", 201, res);
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please fill full form."));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid credentials", 400));
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid credentials", 400));
  }
  generateToken(user, "Login Successfully", 201, res);
});

export const getProfile = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnley: true,
    })
    .json({
      success: true,
      message: "Logout Successfully",
    });
});

export const fetchLeaderboard = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({ monySpent: { $gt: 0 } });
  const leadreboard = users.sort((a, b) => b.monySpent - a.monySpent);
  res.status(200).json({
    success: true,
    leadreboard,
  });
});
