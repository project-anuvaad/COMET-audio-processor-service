const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { SchemaNames } = require('./utils/schemaNames');

const Comment = new Schema({
    user: { type: Schema.Types.ObjectId, ref: SchemaNames.user },
    text: { type: String },
})

const CommentsThread = new Schema({
    comments: [Comment]
})

module.exports = { Comment, CommentsThread };