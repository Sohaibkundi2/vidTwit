import mongoose from "mongoose";

const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGO_URI)
        console.log(`\nMongoDB Connected : ${connectionInstance.connection.host}`);
        return connectionInstance;
    } catch (error) {
        console.error('Error Occurred While Connecting to DB:', error);
        
        // Graceful shutdown
        setTimeout(() => {
            console.log('Shutting down due to database connection failure...');
            process.exit(1);
        }, 5000);
        
        throw error;
    }
}

export default connectDB;