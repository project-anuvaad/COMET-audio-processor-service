const ArticleModel = require('../models').Article;

function findById(videoId) {
    return ArticleModel.findById(videoId)
}

function update(conditions, keyValMap) {
    return ArticleModel.updateMany(conditions, { $set: keyValMap })
}

function updateById(id, keyValMap) {
    return ArticleModel.findByIdAndUpdate(id, { $set: keyValMap }, { new: true })
}

function find(conditions) {
    return ArticleModel.find(conditions)
}

function create(values) {
    return ArticleModel.create(values);
}

module.exports = {
    find,
    update,
    create,
    findById,
    updateById,
}
