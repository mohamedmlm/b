module.exports = (...allowedRoles) => {
    const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

    return (req, res, next) => {
        if (!Array.isArray(roles) || roles.length === 0) {
            return res.status(403).json({ msg: "Access denied" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ msg: "Access denied" });
        }
        next();
    };
}