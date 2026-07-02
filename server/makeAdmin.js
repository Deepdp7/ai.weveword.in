import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

const email = process.argv[2];

if (!email) {
  console.log('Please provide the user email: node makeAdmin.js <user_email>');
  process.exit(1);
}

const makeAdmin = async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email });
    
    if (user) {
      user.role = 'admin';
      await user.save();
      console.log('Successfully made ' + user.name + ' (' + user.email + ') an admin!');
    } else {
      console.log('User with email ' + email + ' not found. Please sign up first.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};

makeAdmin();
