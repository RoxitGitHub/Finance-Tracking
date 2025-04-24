const mongoose = require('mongoose');

// Use environment variable for MongoDB connection
const mongo_url = process.env.MONGO_URI || process.env.MONGO_CONN;

const connectDB = async () => {
    try {
        if (!mongo_url) {
            throw new Error('MongoDB connection string not found in environment variables');
        }

        await mongoose.connect(mongo_url, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Connection Error: ', err);
        // Don't exit the process to allow for retry mechanisms
    }
};

// Execute the connection
connectDB();