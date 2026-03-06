import Router from 'express'
import {
  registerUser,
  logoutUser,
  loginUser,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  generateAccessRefreshToken,
  changeCurrentPassword,
  getCurrentUser,
  changeAccountDetails,
  updateAvatarImage,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from '../controllers/register.controller.js'
import upload from './../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

// unsecured routes
router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]),
  registerUser,
)

router.route('/login').post(loginUser)
router.route('/verify-registration-otp').post(verifyRegistrationOtp)
router.route('/resend-registration-otp').post(resendRegistrationOtp)
router.route('/refresh-token').post(generateAccessRefreshToken)

// secure routes
router.route('/logout').post(verifyJWT, logoutUser)
router.patch('/password', verifyJWT, changeCurrentPassword)
router.get('/me', verifyJWT, getCurrentUser)
router.patch('/profile', verifyJWT, changeAccountDetails)
router.patch('/avatar', verifyJWT, upload.single('avatar'), updateAvatarImage)
router.patch('/cover', verifyJWT, upload.single('coverImage'), updateCoverImage)
router.get('/channel/:username', verifyJWT, getUserChannelProfile)
router.get('/history', verifyJWT, getWatchHistory)
export default router
