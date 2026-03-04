import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js"

const pair = (a,b) => {
    if(a < b){
        return [a,b];
    }
    return [b,a];
}

export const checkFriendship = async (req, res, next) => {
    try {
        const me = req.user._id.toString();
        const recipientId = req.body?.recipientId ?? null;
        const memberIds = req.body?.memberIds ?? [];

        if(!recipientId && memberIds.length === 0){
            return res.status(400).json({message : "Vui lòng cung cấp thông tin người nhận!"});
        }

        if(recipientId){
            const [userA, userB] = pair(me, recipientId);

            const isFriend = await Friend.findOne({userA, userB});
            if(!isFriend){
                return res.status(400).json({message : "Bạn không thể gửi tin nhắn khi chưa kết bạn với người này"});
            }
            return next();
        }
        // chat nhóm
        const friendChecks = memberIds.map(async (memberId) => {
            const [userA, userB] = pair(me, memberId);
            const friend = await Friend.findOne({userA, userB});
            return friend ? null : memberId;
        }) ;

        const results = await Promise.all(friendChecks);
        const notFriend = results.filter(Boolean);

        if(notFriend.length > 0){
            return res.status(403).json({message: "Bạn chỉ có thể thêm bạn bè vào nhóm!", notFriend});
        }

        next();
    } catch (error) {
        console.error(`Lỗi khi check friendship ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
}

export const checkGroupMembership = async(req, res, next) => {
    try {
        const {conversationId} = req.body;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);
        if(!conversation){
            return res.status(404).json({message: "Không tìm thấy cuộc trò chuyện"});
        }

        const isMember = conversation.participants.some(
            (p) => p.userId.toString() === userId.toString()
        );

        if(!isMember){
            return res.status(403).json({message: "Bạn không phải là thành viên của nhóm này!"});
        }

        req.conversation = conversation;
        next();

    } catch (error) {
        console.error(`Lỗi khi check Group Membership ${error}`);
        return res.status(500).json({message: "Lỗi hệ thống!"});
    }
}