const VideoModel = require('../models').Video;

function findById(videoId) {
    return VideoModel.findById(videoId)
}

function update(conditions, keyValMap) {
    return VideoModel.updateMany(conditions, { $set: keyValMap })
}

function updateById(id, keyValMap) {
    return VideoModel.findByIdAndUpdate(id, { $set: keyValMap })
}

function find(conditions) {
    return VideoModel.find(conditions)
}

function create(values) {
    return VideoModel.create(values);
}

module.exports = {
    find,
    update,
    create,
    findById,
    updateById,
}
