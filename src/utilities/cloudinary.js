import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import sanitize from "sanitize-filename";
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    let sanitizedLocalFilePath = sanitize(localFilePath);

    try {
        if (!sanitizedLocalFilePath) return null;

        const response = await cloudinary.uploader.upload(
            sanitizedLocalFilePath,
            {
                resource_type: "auto",
            }
        );
        fs.unlinkSync(sanitizedLocalFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(sanitizedLocalFilePath); // remove locally saved temporary file
        return null;
    }
};

/*Instead of passing the thumbnail to delete
  we actually passs its public id and the variable thumbnailToDelete which actually stores the public id in the thumbnail
 which  differes from the newly set thumbnail's public id
 */
const deleteOnCloudinary = async (public_id, resource_type = "image") => {
    try {
        if (!public_id) return null;

        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type: `${resource_type}`,
        });
    } catch (error) {
        console.error(error);
        return error;
    }
};

export { uploadOnCloudinary, deleteOnCloudinary };
