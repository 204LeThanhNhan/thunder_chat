import mongoose from 'mongoose'; 

export const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
        console.log(`Liên kết cơ sở dữ liệu thành công!`);
    } catch (error) {
        console.log(`Error when connect to database: ${error}`);
        process.exit(1);
    }
}