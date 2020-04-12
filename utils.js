const fs = require('fs');
const path = require('path');
const request = require('request');
const { exec } = require('child_process');
// const AWS = require('aws-sdk');

// const BUCKET_NAME = 'vwaudioprocessor';
// const REGION = 'eu-west-1';
// const CLOUDFRONT_BASE_URL = process.env.CLOUDFRONT_URL;

// const s3 = new AWS.S3({
//   signatureVersion: 'v4',
//   region: REGION,
//   accessKeyId: process.env.S3_ACCESS_KEY, 
//   secretAccessKey: process.env.S3_ACCESS_SECRET
// })


function burnAudioToVideo(videoPath, audioPath, callback) {
  const fileExtension = videoPath.split('.').pop();
  const targetPath = path.join('tmp', `burned-video-audio-${Date.now()}.${fileExtension}`);

  exec(`ffmpeg -i ${videoPath} -i ${audioPath} -map "0:v?" -map "1:a?" -c:v copy ${targetPath}`, (err) => {
    if (err) return callback(err);
    console.log('done burning')
    return callback(null, targetPath)
  })
}

function convertToMp3(filePath, callback) {
  const targetPath = path.join('tmp', `mp3-audio-${Date.now()}.mp3`);

  exec(`ffmpeg -i ${filePath} ${targetPath}`, (err) => {
    if (err) return callback(err);
    return callback(null, targetPath)
  })
}

function getRemoteFile(url, callback = () => {}) {
  return new Promise((resolve, reject) => {
    const filePath = path.join('tmp', `file-${parseInt(Date.now() + Math.random() * 1000000) + "." + url.split('.').pop()}`);
    request
    .get(url)
    .on('error', (err) => {
      callback(err)
      reject(err)
    })
    .pipe(fs.createWriteStream(filePath))
    .on('error', (err) => {
      callback(err)
      reject(err)
    })
    .on('finish', () => {
      resolve(filePath)
      callback(null, filePath)
    })
  })
}

// function uploadToS3(filePath, callback) {
//   const fileName = filePath.split('/').pop(); 
//   s3.upload({
//     Bucket: BUCKET_NAME,
//     Key: fileName,
//     Body: fs.createReadStream(filePath),
//     ContentDisposition: 'attachement',
//   }, (err, res) => {
//     if (err) {
//       return callback(err);
//     }
//     const url = `//s3-${REGION}.amazonaws.com/${BUCKET_NAME}/${fileName}`;

//     return callback(null, { url, ETag: res.ETag, Key: fileName });
//   })
// }


// function deleteFromS3(key, callback = () => {}) {
//   s3.deleteObject({
//     Key: key,
//     Bucket: BUCKET_NAME,
//   }, (err, result) => {
//     if (err) return callback(err);
//     return callback(null, result);
//   })
// }

module.exports = {
    // uploadToS3,
    // deleteFromS3,
    getRemoteFile,
    burnAudioToVideo,
    convertToMp3
}