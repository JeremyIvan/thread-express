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
    canModify: {
        type: Boolean,
        default: false
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
    canModify: {
        type: Boolean,
        default: false
    },
    comments: [commentSchema]
})

module.exports = mongoose.model("Thread", threadSchema)