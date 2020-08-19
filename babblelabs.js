const request = require("request");
const fs = require("fs");
const CronJob = require("cron").CronJob;
const BABBLELABS_USERNAME = process.env.BABBLELABS_USERNAME;
const BABBLELABS_PASSWORD = process.env.BABBLELABS_PASSWORD;
const BASE_URL = "https://api.babblelabs.com";
let babblelabsToken = "";

const refreshTokenJob = new CronJob({
  cronTime: "*/10 * * * *",
  onTick: () => {
    refreshToken();
  },
});

refreshTokenJob.start();

function refreshToken() {
  login(BABBLELABS_USERNAME, BABBLELABS_PASSWORD)
    .then((res) => {
      const { token_type, auth_token } = res;
      console.log("refreshed token");
      babblelabsToken = `${token_type} ${auth_token}`;
      isTokenValid().then();
    })
    .catch((err) => {
      console.log(err);
    });
}

function isTokenValid() {
  return new Promise((resolve, reject) => {
    request.get(
      `${BASE_URL}/accounts/api/accounts/${BABBLELABS_USERNAME}`,
      { headers: { Authorization: babblelabsToken } },
      (err, _, body) => {
          if (err) return reject(err);
          try {
              const b = JSON.parse(body);
              if (!b) throw new Error('Error verifying account');
              resolve(b)
          } catch(e) {
              reject(e)
          }
      }
    );
  });
}
// initiate a new token on start
refreshToken();

function login(userId, password) {
  return new Promise((resolve, reject) => {
    if (!userId || !password)
      return reject(new Error("Invalid email or password"));
    const body = {
      userId,
      password,
    };

    request.post(
      `${BASE_URL}/accounts/api/auth/login`,
      { body, json: true },
      (err, response, body) => {
        if (err) return reject(err);
        if (response.statusCode >= 400){
          console.log(response)
          return reject(new Error("Something went wrong"));
        }
        return resolve(body);
      }
    );
  });
}

function clearAudio(filePath, targetPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createReadStream(filePath);
    const audioInputType = `audio/${filePath.split(".").pop()}`;
    const userId = BABBLELABS_USERNAME;
    const Authorization = babblelabsToken;
    const headers = { Authorization, [`Content-Type`]: audioInputType };
    request.post(
      `${BASE_URL}/audioEnhancer/api/audio/stream/${userId}`,
      { body: file, encoding: null, headers },
      (err, response, body) => {
        console.log(response.statusCode)
        if (err) return reject(err);
        if (response.statusCode > 400) {
          console.log(response, body);
          return reject(new Error('Something went wrong with babbellabs'));
        }
        if (Buffer.isBuffer(body)) {
          const target = fs.createWriteStream(targetPath);
          target.write(body, (err) => {
            if (err) return reject(new Error("Error writing file"));
            return resolve({ success: true, targetPath });
          });
        } else {
          console.log(body);
          return reject(new Error("Something went wrong with babbellabs"));
        }
      }
    );
  });
}

module.exports = {
  login,
  clearAudio,
  isTokenValid,
};
