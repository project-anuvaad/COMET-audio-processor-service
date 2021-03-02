const fs = require("fs");

const { processAudio } = require("./processAudio");

const storageService = require("@comet-anuvaad/vendors/storage");
const utils = require("./utils");

const PROCESS_NOISECANCELLATIONVIDEO_AUDIO_QUEUE = `PROCESS_NOISECANCELLATIONVIDEO_AUDIO_QUEUE`;
const PROCESS_NOISECANCELLATIONVIDEO_AUDIO_FINISHED_QUEUE = `PROCESS_NOISECANCELLATIONVIDEO_AUDIO_FINISHED_QUEUE`;

const VIDEO_NOSIECANCELLATION_DIRECTORY = "video_noisecancellation";

let channel;

function init(ch) {
  channel = ch;
  channel.prefetch(1);
  channel.assertQueue(PROCESS_NOISECANCELLATIONVIDEO_AUDIO_QUEUE, {
    durable: true,
  });
  channel.assertQueue(PROCESS_NOISECANCELLATIONVIDEO_AUDIO_FINISHED_QUEUE, {
    durable: true,
  });
  channel.consume(
    PROCESS_NOISECANCELLATIONVIDEO_AUDIO_QUEUE,
    processNoiseCancellationVideoCallback,
    { noAck: false }
  );
}

function processNoiseCancellationVideoCallback(msg) {
  const { id, url, title } = JSON.parse(msg.content.toString());
  processNoiseCancellationVideo({ url, title }, (err, res) => {
    channel.ack(msg);
    if (err) {
      console.log("error", err);
      channel.sendToQueue(
        PROCESS_NOISECANCELLATIONVIDEO_AUDIO_FINISHED_QUEUE,
        new Buffer(JSON.stringify({ id, status: "failed" }))
      );
    } else {
      const { url, Key } = res;
      channel.sendToQueue(
        PROCESS_NOISECANCELLATIONVIDEO_AUDIO_FINISHED_QUEUE,
        new Buffer(JSON.stringify({ id, url, Key, status: "done" }))
      );
    }
  });
}

function processNoiseCancellationVideo({ url, title }, callback = () => {}) {
  console.log("Starting for noise cancellation video file", title, url);
  utils.getRemoteFile(url, (err, videoPath) => {
    if (err) return callback(err);
    console.log("downloaded file", videoPath);
    utils.convertToMp3(videoPath, (err, mp3Path) => {
      if (err) return callback(err);
      processAudio(
        { filePath: mp3Path, outputFormat: "mp3" },
        (err, processedAudioPath) => {
          // Burn the new audio to the video
          fs.unlink(mp3Path, () => {});
          if (err) return callback(err);
          utils.burnAudioToVideo(
            videoPath,
            processedAudioPath,
            (err, finalFilePath) => {
              if (err) return callback(err);
              fs.unlink(processedAudioPath, () => {});
              fs.unlink(videoPath, () => {});
              // Upload the burned video
              const fileName = `${title}-${Date.now()}.${finalFilePath
                .split(".")
                .pop()}`;
              storageService
                .saveFile(
                  VIDEO_NOSIECANCELLATION_DIRECTORY,
                  fileName,
                  fs.createReadStream(finalFilePath)
                )
                .then((uploadRes) => {
                  fs.unlink(finalFilePath, () => {});
                  return callback(null, uploadRes);
                })
                .catch(callback);
            }
          );
        }
      );
    });
  });
}


module.exports = {
    init,
}