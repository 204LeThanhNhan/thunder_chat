import mongoose, { mongo } from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        require: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    content: {
        type: String,
        trim: true
    },
    imgUrl: {
        type: String,

    }
},
{
    timestamps: true
}
);

//index: database tạo ra bảng tra cứu nhanh
//trong mongodb : 1-> tăng dần , -1 -> giảm dần
//kết quả: các message nằm chung conversation sẽ dc sắp chung với nhau, thời gian từ mới tới cũ
messageSchema.index({conversationId: 1, createdAt: -1});

const Message = mongoose.model("Message", messageSchema);
export default Message;