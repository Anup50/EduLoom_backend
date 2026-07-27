const cloudinary = require("../utils/cloudinary");

const signUpload = (req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = req.body.folder || "default";

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder,
  });
};

module.exports = { signUpload };
