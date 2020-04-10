
const async = require('async');
const fs = require('fs');
const audioProcessor = require('./audio_processor');
const utils = require('./utils');

const articleHandler = require('./dbHandlers/article');
const noiseCancellationVideoService = require('./dbHandlers/noiseCancellationVideo');


const storageService = require('./vendors/storage');
const TRANSLATION_AUDIO_DIRECTORY = 'translation/audios';

function processNoiseCancellationVideo(id, callback = () => {}) {
    console.log('Starting for noise cancellation file', id);
    noiseCancellationVideoService.findById(id)
    .then((doc) => {
        if (!doc) throw new Error('Invalid id');
        // Process the audio
        utils.getRemoteFile(doc.url, (err, videoPath) => {
            if (err) return callback(err);
            utils.convertToMp3(videoPath, (err, audioPath) => {
                if (err) return callback(err);
                processAudio({ filePath: audioPath, outputFormat: 'mp3' }, (err, audioPath) => {
                // Burn the new audio to the video
                    if (err) return callback(err);
                    utils.burnAudioToVideo(videoPath, audioPath, (err, finalFilePath) => {
                        if (err) return callback(err);
                        fs.unlink(audioPath, () => { })
                        fs.unlink(videoPath, () => { })
                        // Upload the burned video
                        const fileName = `${doc.title}-${Date.now()}.${finalFilePath.split('.').pop()}`;
                        storageService.saveFile(TRANSLATION_AUDIO_DIRECTORY, fileName, fs.createReadStream(finalFilePath))
                        .then((uploadRes) => {
                            fs.unlink(finalFilePath, () => { });

                            noiseCancellationVideoService.updateById(id, { noiseCancelledUrl: uploadRes.url, Key: uploadRes.data.Key, status: 'done' })
                            .then(() => {
                                if (doc.key) {
                                    // storageService.deleteFile(TRANSLATION_AUDIO_DIRECTORY, doc.Key)
                                    // .then(() => {
                                    //     console.log('deleted file');
                                    // })
                                    // .catch((err) => {
                                    //     console.log('error deleting file', err);
                                    // });
                                }
                                return callback(null, { success: true });
                            }).catch(callback);
                        })
                        .catch(callback);
                    })
                })
            })
        })
    })
    .catch(callback);
}

function processAudio({ filePath, outputFormat }, callback = () => { }) {
    const processingStepsFunc = [
        (cb) => {
            const fileExtension = filePath.split('.').pop().toLowerCase();
            if (fileExtension === outputFormat) return cb(null, filePath);
            console.log('converint to ' + outputFormat);
            audioProcessor.convertExtension(filePath, outputFormat, (err, outputPath) => {
                if (err) {
                    console.log(err);
                    return cb(null, filePath);
                }
                fs.unlink(filePath, () => { })
                return cb(null, outputPath);
            })
            
        },
        (filePath, cb2) => {
            console.log('processing', filePath);
            audioProcessor.clearBackgroundNoise(filePath, (err, outputPath) => {
                fs.unlink(filePath, () => { });
                console.log('after clear', err);
                if (err) {
                    return cb2(err);
                }
                console.log('output path', outputPath)
                return cb2(null, outputPath)
            })
        },
    ];

    async.waterfall(processingStepsFunc, (err, finalFilePath) => {
        console.log('Processed succesfully', err, filePath);
        if (err || !fs.existsSync(finalFilePath)) return callback(err);
        return callback(null, finalFilePath);
    })
}


function updateAudioStatus(id, slidePosition, subslidePosition, { processing, status }) {
    // const updateObj = {};
    // if (processing !== undefined && processing !== 'undefined') {
    //   updateObj[`audios.${audioIndex}.processing`] = processing;
    // }
    // if (status) {
    //   updateObj[`audios.${audioIndex}.status`] = status;
    // }

    // Articl.findByIdAndUpdate(id, { $set: updateObj }, { new: true }, (err, res) => {
    // })
}



function updateSubslide(articleId, slidePosition, subslidePosition, changes) {
    return new Promise((resolve, reject) => {
        articleHandler.findById(articleId)
            .then((article) => {
                if (!article) return reject(new Error('Invalid article'));
                const { slides } = article;
                const slideIndex = slides.findIndex((s) => parseInt(s.position) === slidePosition);
                const contentIndex = slides[slideIndex].content.findIndex((s) => parseInt(s.position) === subslidePosition);
                let update = {}
                Object.keys(changes).forEach((key) => {
                    // slides[slideIndex].content[subslideIndex][key] = changes[key];
                    update[`slides.${slideIndex}.content.${contentIndex}.${key}`] = changes[key];
                })
                return articleHandler.updateById(article._id, { ...update });
            })
            .then(resolve)
            .catch(reject);
    })
}


module.exports = {
    processNoiseCancellationVideo,
    processAudio,
}