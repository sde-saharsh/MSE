import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['operator', 'supervisor'], required: true, default: 'operator' }
});

export default mongoose.model('User', userSchema);
