const NoiseCancellationVideoModel = require('../models').NoiseCancellationVideo;

function findById(videoId) {
    return NoiseCancellationVideoModel.findById(videoId)
}

function update(conditions, keyValMap) {
    return NoiseCancellationVideoModel.updateMany(conditions, { $set: keyValMap })
}

function updateById(id, keyValMap) {
    return NoiseCancellationVideoModel.findByIdAndUpdate(id, { $set: keyValMap }, { new: true })
}

function find(conditions) {
    return NoiseCancellationVideoModel.find(conditions)
}

function create(values) {
    return NoiseCancellationVideoModel.create(values);
}

module.exports = {
    find,
    update,
    create,
    findById,
    updateById,
}
