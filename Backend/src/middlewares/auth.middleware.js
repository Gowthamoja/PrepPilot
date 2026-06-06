const userModel = require("../models/user.model");
const blacklistTokenModel = require("../models/blacklist.model");
const jwt = require("jsonwebtoken");

async function authUser(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized: No token provided",
    });
  }

  const isBlacklisted = await blacklistTokenModel.findOne({
    token,
  });

  if (isBlacklisted) {
    return res.status(400).json({
      message: "Token is invalid",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }

  const user = await userModel.findOne({
    _id: decoded.id,
  });

  if (!user) {
    return res.status(400).json({
      message: "Token is invalid",
    });
  }

  req.user = user;

  return next();
}

module.exports = {
  authUser,
};
