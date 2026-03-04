import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js"
export const authMe = async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json({user});
    } catch (error) {
        console.error(`Lỗi khi gọi authMe ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
};

export const test = async (req, res) => {
    return res.sendStatus(204);
};

export const searchUserByUsername = async (req, res) => {
    try {
        const {username} = req.query;

        if(!username || username.trim() === ""){
            return res.status(400).json({message: "Bạn cần phải nhập username"});
        }

        const user = await User.findOne({username}).select(" _id username displayName avatarUrl");
        return res.status(200).json({user});

    } catch (error) {
        console.error(`Lỗi khi gọi searchUserByUsername ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
};

export const uploadAvatar = async(req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;

        if(!file){
            return res.status(400).json({message: "Không tìm thấy dữ liệu file!"});
        }

        const result = await uploadImageFromBuffer(file.buffer);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                avatarUrl: result.secure_url,
                avatarId: result.public_id,
            },
            {
                new: true,
            }
        ).select("avatarUrl");

        if(!updatedUser || !updatedUser.avatarUrl){
            return res.status(400).json({message: "AvatarUrl trả về null"});
        }

        return res.status(200).json({avatarUrl: updatedUser.avatarUrl});
    } catch (error) {
        console.error(`Lỗi khi gọi upload Avatar: ${error}`);
        return res.status(500).json({message: "Có lỗi xảy ra khi upload Avatar"});
    }
};