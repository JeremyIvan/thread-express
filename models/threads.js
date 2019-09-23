const mongoose = require('mongoose')
const Schema = mongoose.Schema

let commentSchema = new Schema({
    user: {
        type: String,
        required: true,
    },
    comment: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

let threadSchema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    body: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        data: Buffer
    },
    comments: [commentSchema]
})

module.exports = mongoose.model("Thread", threadSchema)