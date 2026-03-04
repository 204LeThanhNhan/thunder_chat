import jwt from 'jsonwebtoken';

import User from '../models/User.js';


//authorization - xác minh user là ai, có quyền truy cập api hay không
export const protectedRoute = (req, res, next) => {
    try {
        //lấy access token trong header của request
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if(!token){
            return res.status(401).json({message: "Không tìm thấy access token"});
        }
        //xác minh token hợp lệ
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
            if(err){
                console.error(err);
                return res.status(403).json({message: "Access token hết hạn hoặc không đúng!"});
            }
            //tìm user
            const user = await User.findById(decodedUser.userId).select('-hashedPassword');

            if(!user){
                return res.status(404).json({message: "Không tìm thấy User!"});
            }

            //trả thông tin user trong request
            req.user = user;
            next();
        });
    } catch (error) {
        console.log(`Lỗi khi xác minh JWT trong authMiddleware: ${error}`);
        return res.status(500),json({message: "Lỗi hệ thống"});
    }
}