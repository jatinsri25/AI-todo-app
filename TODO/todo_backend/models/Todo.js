const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    task: {
        type: String,
        required: [true, 'Task is required'],
        trim: true,
        minlength: [1, 'Task cannot be empty']
    },
    done: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Todo', todoSchema);