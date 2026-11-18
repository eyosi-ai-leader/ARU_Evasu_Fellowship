const { validationResult } = require("express-validator");

const {
  successResponse,
  errorResponse,
} = require("../utils/response");

const { signInWithGoogle } = require("../services/googleAuthService");

const googleSignIn = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return errorResponse(res, "Invalid Google sign-in request.", 400);
  }

  try {
    const result = await signInWithGoogle(req.body.credential);

    return successResponse(
      res,
      result.isNew ? "Account created with Google." : "Login successful",
      {
        user: result.user,
        token: result.token,
        isNew: result.isNew,
      }
    );
  } catch (error) {
    // Inactive account: let the login page show the gentle message.
    if (error.code === "ACCOUNT_INACTIVE") {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_INACTIVE",
        message: error.message,
        data: error.data || null,
      });
    }

    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }

    if (error.code === "ER_DUP_ENTRY") {
      return errorResponse(
        res,
        "This Google account could not be linked. Please try again.",
        409
      );
    }

    console.error("Google sign-in failed:", error.message);

    return errorResponse(
      res,
      "We couldn't sign you in with Google. Please try again.",
      500
    );
  }
};

module.exports = {
  googleSignIn,
};