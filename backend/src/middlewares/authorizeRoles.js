const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is expected to be populated by the verifyJWT middleware
    // If we use req.user (Mongoose doc), it has .role
    // If we use req.user (Decoded token), it has .role
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Access denied: insufficient permissions',
      })
    }
    next()
  }
}

export { authorizeRoles }
