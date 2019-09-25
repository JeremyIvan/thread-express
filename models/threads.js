const mongoose = require('mongoose')
const Schema = mongoose.Schema

let commentSchema = new Schema({
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
        type: String
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // required: true
    },
    comments: [commentSchema]
})

module.exports = mongoose.model("Thread", threadSchema)