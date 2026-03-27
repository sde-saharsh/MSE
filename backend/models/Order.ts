import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    workStation: { type: String, required: true },
    status: {
        type: String,
        enum: ['Planned', 'In Progress', 'On Hold', 'Completed'],
        default: 'Planned'
    },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    assignedTo: { type: String }, // can be username or generic name
    startTime: { type: Date },
    endTime: { type: Date }
}, {
    timestamps: true
});

export default mongoose.model('Order', orderSchema);
