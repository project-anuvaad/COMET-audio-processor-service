const async = require("async");
const { exec } = require("child_process");
const fs = require("fs");
const audioProcessor = require("./audio_processor");

function processAudio({ filePath, outputFormat }, callback = () => {}) {
  const processingStepsFunc = [
    (cb) => {
      const fileExtension = filePath.split(".").pop().toLowerCase();
      if (fileExtension === outputFormat) return cb(null, filePath);
      console.log("converint to " + outputFormat);
      audioProcessor.convertExtension(
        filePath,
        outputFormat,
        (err, outputPath) => {
          if (err) {
            console.log(err);
            return cb(null, filePath);
          }
          fs.unlink(filePath, () => {});
          return cb(null, outputPath);
        }
      );
    },
    (filePath, cb2) => {
      console.log("processing", filePath);
      audioProcessor.clearBackgroundNoise(filePath, (err, outputPath) => {
        fs.unlink(filePath, () => {});
        console.log("after clear", err);
        if (err) {
          return cb2(err);
        }
        console.log("output path", outputPath);
        return cb2(null, outputPath);
      });
    },
  ];

  async.waterfall(processingStepsFunc, (err, finalFilePath) => {
    console.log("Processed succesfully", err, filePath);
    if (err || !fs.existsSync(finalFilePath)) return callback(err);
    return callback(null, finalFilePath);
  });
}

function speedAudio(audioPath, atempoRatio, callback = () => {}) {
  const targetPath = `speeded_audio_${Date.now()}.${audioPath
    .split(".")
    .pop()}`;
  exec(
    `ffmpeg -i ${audioPath} -filter:a "atempo=${atempoRatio}" -vn ${targetPath}`,
    (err) => {
      if (err) return callback(err);
      return callback(null, targetPath);
    }
  );
}

module.exports = {
  processAudio,
  speedAudio,
};
