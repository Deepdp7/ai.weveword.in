import mongoose from 'mongoose';
import connectDB from './config/db.js';

const resetDb = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();
        
        console.log('Dropping database...');
        await mongoose.connection.db.dropDatabase();
        console.log('Database dropped successfully!');
        
        process.exit(0);
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
};

resetDb();
