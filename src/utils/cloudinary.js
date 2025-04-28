import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOncloudinary = async (LocalFilePath)=>{
    try {
        if(!LocalFilePath)return null
        // upload the file on cloudinary
        const response =  await cloudinary.uploader.upload(LocalFilePath, {
            resource_type : "auto"
        })
        // file has bee uploaded successfully
        console.log("File is uploaded on cloudinary", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(LocalFilePath)  // remove the locally saved file as the upload
        // operation got failed
        return null
    }
}

// Upload an image
// const uploadResult = await cloudinary.uploader
// .upload(
//     'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//         public_id: 'shoes',
//     }
// )
// .catch((error) => {
//     console.log(error);
// });



export {uploadOncloudinary}