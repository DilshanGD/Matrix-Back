import cloudinary from "cloudinary";
import 'dotenv/config';

cloudinary.config({
  cloud_name: process.env.IMG_CLOUD_NAME, // Using environment variables for security
  api_key: process.env.IMG_API, // Ensure these are set in environment variables
  api_secret: process.env.IMG_SECRET,
});

const uploadImage = async (image) => {
  try {
    const result = await cloudinary.uploader.upload(image, {
      overwrite: true,
      invalidate: true,
      resource_type: "auto",
    });

    console.log("Uploaded Image URL:", result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error("Upload Error:", error.message);
    throw new Error(error.message);
  }
};

const uploadMultipleImages = async (images) => {
  try {
    const results = await Promise.all(images.map((image) => uploadImage(image)));
    return results;
  } catch (error) {
    console.error("Multiple Upload Error:", error.message);
    throw new Error("Failed to upload multiple images.");
  }
};

// Export functions
export { uploadImage, uploadMultipleImages };
