function checkRole(roles, checkIfActive = true) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userRoles = Array.isArray(req.user.role)
      ? req.user.role
      : [req.user.role];
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    const hasRole = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        message: `Forbidden: Requires role(s) ${allowedRoles.join(", ")}`,
      });
    }

    if (checkIfActive && req.user.status !== "active") {
      return res.status(403).json({
        message: "Forbidden: User is not active",
      });
    }

    next();
  };
}

module.exports = checkRole;
