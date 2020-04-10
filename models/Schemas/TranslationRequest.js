const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { SchemaNames } = require('./utils/schemaNames');
const { SpeakerProfileSchema} = require('./Article');

const TranslationRequestSchema = new Schema({
    article: { type: Schema.Types.ObjectId, ref: SchemaNames.article },
    organization: { type: Schema.Types.ObjectId, ref: SchemaNames.organization },
    targetLanguage: { type: String },
    noOfSpeakers: { type: Number },
    speakerProfiles: [SpeakerProfileSchema],
    assignedTo: [{ type: Schema.Types.ObjectId, ref: SchemaNames.user }],
    // To be visible to users or not
    published: { type: Boolean, default: false },
});

module.exports = { TranslationRequestSchema };