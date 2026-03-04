import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    hashedPassword: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    displayName: {
        type: String,
        require: true,
        trim: true
    },
    avatarUrl: {
        type: String //link de hien thi hinh
    },
    avatarId: {
        type: String //luu could public_id de xoa hinh khi can
    },
    bio: {
        type: String,
        maxlength: 500 // toi da dai 500 ky tu
    },
    phone: {
        type: String,
        sparse: true //cho phep null, nhung khong duoc trung
    },
},{ 
    timestamps: true//cho mongoose tu them createdAt, u pdatedAt
}
);

const User = mongoose.model("User", userSchema); // tạo model User
export default User; // xuất model User