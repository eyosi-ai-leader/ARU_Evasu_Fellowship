const { verifyToken } = require("../utils/jwt");
const { checkAccountActive } = require("../utils/accountStatus");

const authMiddleware = async (req, res, next) => {
  let decoded;

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    decoded = verifyToken(token);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  try {
    const state = await checkAccountActive(decoded.id);

    if (!state.exists) {
      return res.status(401).json({
        success: false,
        message: "Account not found",
      });
    }

    if (!state.active) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_INACTIVE",
        message:
          "Your account is inactive. Please contact your fellowship admin or main leaders.",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth status check failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "We couldn't verify your account. Please try again.",
    });
  }
};

module.exports = authMiddleware;