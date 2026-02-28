import { asyncHandler } from '../utils/asyncHandler.js'

const checkOwnership = (Model, paramName = 'id', ownerField = 'owner') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[paramName]

    if (!resourceId) {
       // Should not happen if route matches, but good to be safe
       return res.status(400).json({ message: "Invalid resource ID" });
    }

    const resource = await Model.findById(resourceId)

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' })
    }

    // req.user is guaranteed to exist due to verifyJWT middleware running before this
    const isOwner = resource[ownerField]?.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: 'Access denied: you do not own this resource',
      })
    }

    next()
  })
}

export { checkOwnership }
