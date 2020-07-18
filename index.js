const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');

const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/tmp')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '.' + file.originalname.split('.').pop())
    }
})
const upload = multer({ storage: storage })

const PORT = process.env.PORT || 4000;

const { processAudio, speedAudio } = require('./processAudio');
const utils = require('./utils');
const babbbellabs = require('./babblelabs');

// Listen on rabbitmq 
// require('./worker').init();

// Create necessary file dirs 
const APP_DIRS = ['./tmp'];
APP_DIRS.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
})


app.all('/*', (req, res, next) => {
  // CORS headers - Set custom headers for CORS
  res.header('Access-Control-Allow-Origin', '*'); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token, X-Vw-Anonymous-Id, X-Key, Cache-Control, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});

app.use(bodyParser())
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  babbbellabs.isTokenValid()
  .then(() => {
    return res.status(200).send('OK')
  })
  .catch(err => {
    console.log(err);
    return res.status(503).send('BABBELLABS DOWN')
  })
})

app.get('/', (req, res) => {
  return res.status(200).send('Audio Processor api root');
})

app.post('/process_audio', upload.any(), (req, res) => {
  const { url, outputFormat } = req.body;
  const { files } = req;
  let fetchFile;
  console.log(files);
  if (url) {
    fetchFile = utils.getRemoteFile(url);
  } else if (files) {
    const file = files[0];
    fetchFile = new Promise((resolve) => {
      resolve(file.path);
    })
  } else {
    return res.status(400).send('Please upload a file or provide a url');
  }
  fetchFile.then(filePath => {
    processAudio({ filePath, outputFormat }, (err, outputPath) => {
      if (err) {
        console.log('Error processing audio', err);
        return res.status(400).send('Something went wrong');
      }
      return res.sendFile(path.join(__dirname, outputPath), (err) => {
        if (err) {
          console.log('error sending back file', err);
        }
        fs.unlink(filePath, () => { });
        fs.unlink(outputPath, () => { });
      });
    })
  })
    .catch(err => {
      console.log(err);
      return res.status(400).send('Something went wrong');
    })
})

app.post('/audioSpeed', upload.any(), (req, res) => {
  const { url, speed } = req.body;
  const { files } = req;
  let fetchFile;
  console.log(files);
  if (url) {
    fetchFile = utils.getRemoteFile(url);
  } else if (files) {
    const file = files[0];
    fetchFile = new Promise((resolve) => {
      resolve(file.path);
    })
  } else {
    return res.status(400).send('Please upload a file or provide a url');
  }
  fetchFile.then(filePath => {
    speedAudio(filePath, speed, (err, outputPath) => {
      if (err) {
        console.log('Error speeding audio audio', err);
        return res.status(400).send('Something went wrong');
      }
      return res.sendFile(path.join(__dirname, outputPath), (err) => {
        if (err) {
          console.log('error sending back file', err);
        }
        fs.unlink(filePath, () => { });
        fs.unlink(outputPath, () => { });
      });
    })
  })
    .catch(err => {
      console.log(err);
      return res.status(400).send('Something went wrong');
    })
})

app.listen(PORT)
console.log(`Magic happens on port ${PORT}`)       // shoutout to the user
console.log(`==== Running in ${process.env.NODE_ENV} mode ===`)
module.exports = app             // expose app