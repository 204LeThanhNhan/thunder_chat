import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';
import crypto from 'crypto';

const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; //14 ngày

export const signUp = async (req, res) => {
    //lấy dữ liệu user gửi server qua body
    try {
        const {username, password, email, firstName, lastName} = req.body;

        if(!username || !password || !email || !firstName || !lastName){
            // lỗi 400: không thể hiểu hoặc xử lý
            return res.status(400).json({message: "Vui lòng nhập đủ username, password, email, firstname, lastname"});
        }

        //kiểm tra username có tồn tại hay chưa
        const duplicate = await User.findOne({username});
        if(duplicate){
            //lỗi 409: lỗi xung đột tài nguyên trên server
            return res.status(409).json({message: "Username này đã tồn tại!"});
        }

        // chưa có -> mã hóa pass
        const hashedPassword = await bcrypt.hash(password, 10); // thực hiện hash 10 lần

        // tạo user mới
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${lastName} ${firstName}`
        });

        //return
        return res.sendStatus(204); // mã 204 là thông báo resquest thành công, không trả về dữ liệu
    } catch (error) {
        console.error(`Lỗi xảy ra khi đăng ký tài khoản: ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
    
};

export const signIn = async (req, res) => {
    try {
        // lấy username, pass tuwf body request
        const {username, password} = req.body;

        if(!username || !password){
            // khong the xu ly
            return res.status(400).json({message: "Vui lòng nhập đầy đủ username và password!"});   
        }

        //tìm kiếm user
        const user = await User.findOne({username});
        if(!user){
            //unauthorize
            return res.status(401).json({message: "Username hoặc Password không chính xác!"});
        }

        //check password có đúng không?
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if(!passwordCorrect){
            return res.status(401).json({message: "Username hoặc Password không chính xác!"});
        }

        //đăng nhập thành công -> tạo access token (JWT)
        const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL});

        //tạo refresh token
        const refreshToken = crypto.randomBytes(64).toString('hex');

        //tạo session mới để lưu refresh token
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date((Date.now() + REFRESH_TOKEN_TTL))
        });

        //lưu refreshToken trong cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, //tránh truy cập = javascript
            secure: true, // chỉ gửi qua https
            sameSite: 'none',
            maxAge: REFRESH_TOKEN_TTL,
        });

        // return access token trong res
        //return res.status(200).json({message: `User ${user.displayName} vừa đăng nhập thành công!`}, accessToken);
        return res.status(200).json({
            message: `User ${user.displayName} vừa đăng nhập thành công!`,
            accessToken: accessToken
        });
        

    } catch (error) {
        console.error(`Lỗi xảy ra khi đăng nhập: ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
};

export const signOut = async (req, res) => {
    try {
        //Lấy refresh token từ cookie
        const token = req.cookies.refreshToken;

        if(token){
            //xóa refresh token trong session
            await Session.deleteOne({refreshToken: token});
            //xóa  cookie
            res.clearCookie("refreshToken");
        }
        
        return res.sendStatus(204);
    } catch (error) {
        console.error(`Lỗi xảy ra khi đăng xuất: ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
};

// hàm tạo accessToken mới từ refreshToken
export const refreshToken = async (req, res) => {
    try {
        //lấy refresh token từ cookie
        const token = req.cookies?.refreshToken;
        if(!token){
            return res.status(401).json({message: "Lỗi token không tồn tại!"});
        }

        //so sánh với refresh token có trong db
        const session = await Session.findOne({refreshToken: token});
        if(!session){
            return res.status(403).json({message: "Token không hợp lệ hoặc đã hết hạn"});
        }

        //kiểm tra refresh token có hết hạn
        if(session.expiresAt < new Date()){
            return res.status(403).json({message: "Token đã hết hạn"});
        }

        //return access token mới
        const accessToken = jwt.sign({userId: session.userId}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: ACCESS_TOKEN_TTL});
        return res.status(200).json({accessToken});
    } catch (error) {
        console.error(`Lỗi khi gọi refreshToken: ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống"});
    }
};