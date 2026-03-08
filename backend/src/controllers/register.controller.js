import { asyncHandler } from '../utils/asyncHandler.js'
import ApiError from './../utils/ApiError.js'
import { User } from '../models/user.model.js'
import fs from 'fs'
import crypto from 'crypto'
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponce.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { sendRegistrationOtpEmail } from '../utils/email.js'

const EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES = 10

const hashOtp = otp => crypto.createHash('sha256').update(otp).digest('hex')

const generateOtp = () => crypto.randomInt(100000, 1000000).toString()

const removeLocalFile = filePath => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

const sendRegistrationOtp = async user => {
  const otp = generateOtp()

  user.emailVerificationOtpHash = hashOtp(otp)
  user.emailVerificationOtpExpiry = new Date(
    Date.now() + EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES * 60 * 1000,
  )

  await user.save({ validateBeforeSave: false })

  await sendRegistrationOtpEmail({
    email: user.email,
    fullName: user.fullName || user.username,
    otp,
    expiresInMinutes: EMAIL_VERIFICATION_OTP_EXPIRY_MINUTES,
  })
}

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password } = req.body || {}

  // Enhanced validation with sanitization
  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    throw new ApiError(400, 'Username must be at least 3 characters long')
  }
  
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    throw new ApiError(400, 'Full name must be at least 2 characters long')
  }
  
  if (!email || typeof email !== 'string') {
    throw new ApiError(400, 'Valid email is required')
  }
  
  // Email validation with regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    throw new ApiError(400, 'Please provide a valid email address')
  }
  
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters long')
  }

  // Sanitize inputs
  const sanitizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
  const sanitizedFullName = fullName.trim().replace(/<[^>]*>/g, '') // Remove HTML tags
  const sanitizedEmail = email.trim().toLowerCase()

  if (sanitizedUsername !== username.trim().toLowerCase()) {
    throw new ApiError(400, 'Username can only contain letters, numbers, and underscores')
  }

  const existUser = await User.findOne({
    $or: [{ username: sanitizedUsername }, { email: sanitizedEmail }],
  })

  if (existUser) {
    throw new ApiError(409, 'User with username or email already exists')
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path
  const coverLocalPath = req.files?.coverImage?.[0]?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file is missing')
  }

  let avatar
  let coverImage = null
  let createdUserRecord = null

  try {
    avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar?.url) {
      throw new ApiError(400, 'failed to upload avatar')
    }
  } catch (error) {
    removeLocalFile(avatarLocalPath)
    console.log('Error while uploading avatar', error)
    throw new ApiError(400, 'failed to upload avatar')
  }

  if (coverLocalPath) {
    try {
      coverImage = await uploadOnCloudinary(coverLocalPath)

      if (!coverImage?.url) {
        throw new ApiError(400, 'failed to upload coverImage')
      }
    } catch (error) {
      removeLocalFile(coverLocalPath)
      console.log('Error while uploading coverImage', error)

      if (avatar?.public_id) {
        await deleteFromCloudinary(avatar.public_id)
      }

      throw new ApiError(400, 'failed to upload coverImage')
    }
  }

  try {
    createdUserRecord = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      fullName: fullName.trim(),
      avatar: avatar?.url,
      coverImage: coverImage?.url || '',
    })

    await sendRegistrationOtp(createdUserRecord)

    const createdUser = await User.findById(createdUserRecord._id).select(
      '-password -refreshToken',
    )

    if (!createdUser) {
      throw new ApiError(500, 'something went wrong while creating user')
    }

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          {
            user: createdUser,
            email: createdUser.email,
            requiresEmailVerification: true,
          },
          'user created successfully. Please verify the OTP sent to your email',
        ),
      )
  } catch (error) {
    console.error('User creation failed:', error)

    if (createdUserRecord?._id) {
      await User.findByIdAndDelete(createdUserRecord._id)
    }

    if (coverImage?.public_id) {
      await deleteFromCloudinary(coverImage.public_id)
    }

    if (avatar?.public_id) {
      await deleteFromCloudinary(avatar.public_id)
    }

    throw new ApiError(error.statusCode || 500, error.message || 'something went wrong while registering the user')
  }
})

const generateAccessAndRefreshToken = async userId => {
  try {
    const user = await User.findById(userId).select('-password')

    if (!user) {
      throw new ApiError(404, 'User not found while generating tokens')
    }

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken

    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  } catch (error) {
    console.log('Error while generating access and refresh tokens', error)
    throw new ApiError(500, 'Error while generating Tokens')
  }
}

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required')
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() })
  if (!user) {
    throw new ApiError(401, 'User does not exist')
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, 'Please verify your email before logging in')
  }

  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid user credentials')
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  )

  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken',
  )
  if (!loggedInUser) {
    throw new ApiError(500, 'Something went wrong while logging in')
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  }

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        'User logged in successfully',
      ),
    )
})

const verifyRegistrationOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body || {}

  if ([email, otp].some(field => !field || field.trim() === '')) {
    throw new ApiError(400, 'Email and OTP are required')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+emailVerificationOtpHash +emailVerificationOtpExpiry',
  )

  if (!user) {
    throw new ApiError(404, 'User does not exist')
  }

  if (user.isEmailVerified) {
    return res
      .status(200)
      .json(new ApiResponse(200, { email: user.email }, 'Email is already verified'))
  }

  if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpiry) {
    throw new ApiError(400, 'No OTP found. Please request a new one')
  }

  if (user.emailVerificationOtpExpiry.getTime() < Date.now()) {
    throw new ApiError(400, 'OTP has expired. Please request a new one')
  }

  if (hashOtp(otp.trim()) !== user.emailVerificationOtpHash) {
    throw new ApiError(400, 'Invalid OTP')
  }

  user.isEmailVerified = true
  user.emailVerificationOtpHash = undefined
  user.emailVerificationOtpExpiry = undefined

  await user.save({ validateBeforeSave: false })

  const verifiedUser = await User.findById(user._id).select('-password -refreshToken')

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        verifiedUser,
        'Email verified successfully. You can now log in',
      ),
    )
})

const resendRegistrationOtp = asyncHandler(async (req, res) => {
  const { email } = req.body || {}

  if (!email || email.trim() === '') {
    throw new ApiError(400, 'Email is required')
  }

  const normalizedEmail = email.trim().toLowerCase()
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+emailVerificationOtpHash +emailVerificationOtpExpiry',
  )

  if (!user) {
    throw new ApiError(404, 'User does not exist')
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, 'Email is already verified')
  }

  await sendRegistrationOtp(user)

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: user.email },
        'A new OTP has been sent to your email',
      ),
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      refreshToken: null,
    },
    {
      new: true,
    },
  )

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  }

  res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'user logout successfully'))
})

const generateAccessRefreshToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken

  if (!incommingRefreshToken) {
    throw new ApiError(401, 'refreshToken is required')
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    )

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, 'invalid refresh token')
    }

    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'invalid refresh token')
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id)

    res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          'New access and refresh token generated successfully',
        ),
      )
  } catch (error) {
    throw new ApiError(
      500,
      'something went wrong while creating access and refresh token ',
    )
  }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body

  const user = await User.findById(req.user?._id)

  const isPasswordValid = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordValid) {
    throw new ApiError(402, 'invalid old password')
  }

  user.password = newPassword

  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'password change successfully'))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'Current user details'))
})

const changeAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body

  if (!fullName && !email) {
    throw new ApiError(401, 'all fields are required')
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true },
  ).select('-password')

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'account details updated successfuly'))
})

const updateAvatarImage = asyncHandler(async (req, res) => {
  const localFilePath = req?.file?.path

  if (!localFilePath) {
    throw new ApiError(401, 'new avatar is missing')
  }

  const avatar = await uploadOnCloudinary(localFilePath)
  try {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath)
    }
  } catch (err) {
    console.error('Error deleting local file:', err)
  }

  if (!avatar) {
    throw new ApiError(500, 'error while uploading image on cloadinary')
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true },
  ).select('-password -refreshToken')

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'avatar image update sucessfully'))
})
const updateCoverImage = asyncHandler(async (req, res) => {
  const localFilePath = req?.file?.path

  if (!localFilePath) {
    throw new ApiError(401, 'new coverImage is missing')
  }

  const coverImage = await uploadOnCloudinary(localFilePath)

  try {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath)
    }
  } catch (err) {
    console.error('Error deleting local file:', err)
  }

  if (!coverImage) {
    throw new ApiError(500, 'error while uploading image on cloadinary')
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true },
  ).select('-password -refreshToken')

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'coverImage image update sucessfully'))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params

  if (!username.trim()) {
    throw new ApiError(401, 'username is missing')
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
      },
    },
    {
      $addFields: {
        subscribersToCount: {
          size: '$subscribers',
        },
        channelSubcribedToCount: {
          size: '$subscribedTo',
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [
                req.user._id,
                {
                  $map: {
                    input: '$subscribers',
                    as: 's',
                    in: '$$s.subscriber',
                  },
                },
              ],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersToCount: 1,
        channelSubcribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ])

  console.log('channel checking...........', channel)

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], 'user channel fetched successfully'))
})

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'watchHistory',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: '$owner',
              },
            },
          },
        ],
      },
    },
  ])

  if (!user.length) {
    throw new ApiError(404, 'User not found')
  }

  if (!user[0].watchHistory.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], 'No watch history yet.'))
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        'watchHistory fetched successfully',
      ),
    )
})

export {
  registerUser,
  loginUser,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  generateAccessRefreshToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  changeAccountDetails,
  updateAvatarImage,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
}
