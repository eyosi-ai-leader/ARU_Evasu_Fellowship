const multer = require("multer");

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter: (req, file, callback) => {
    if (IMAGE_TYPES.includes(file.mimetype)) return callback(null, true);

    return callback(new Error("Only JPG, PNG and WEBP images are allowed."));
  },
});

/*
 * Reads an optional cover image sent as the "image" field of a multipart
 * form. Problems are answered as JSON, like every other ministry error.
 */
const ministryImageUpload = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();

    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Ministry image must not exceed 10 MB."
        : error.message || "The image could not be uploaded.";

    return res.status(400).json({ success: false, message });
  });
};

module.exports = ministryImageUpload;
