const https = require('https');
const zlib = require('zlib');
const AWS = require('aws-sdk');

const DEST_URL = process.env.DEST_URL;
const REGION = process.env.AWS_REGION;

exports.handler = async (event) => {
  try {
    // Decode and decompress log data
    const zipped = Buffer.from(event.awslogs.data, 'base64');
    const json = zlib.gunzipSync(zipped).toString('utf8');
    const payload = JSON.parse(json);

    const data = JSON.stringify(payload);

    const url = new URL(DEST_URL);

    const endpoint = new AWS.Endpoint(url.hostname);
    const signedReq = new AWS.HttpRequest(endpoint, REGION);
    signedReq.method = 'POST';
    signedReq.path = url.pathname;
    signedReq.headers['host'] = endpoint.host;
    signedReq.headers['Content-Type'] = 'application/json';
    signedReq.body = data;

    const signer = new AWS.Signers.V4(signedReq, 'execute-api');
    signer.addAuthorization(AWS.config.credentials, new Date());

    const options = {
      hostname: endpoint.hostname,
      path: signedReq.path,
      method: signedReq.method,
      headers: signedReq.headers,
      timeout: 7000 // 7 second timeout
    };

    return await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            console.error(`Failed POST: ${res.statusCode} - ${body}`);
            return reject(new Error(`Failed POST: ${res.statusCode}`));
          }
          resolve();
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      req.on('error', (err) => {
        console.error('HTTPS error:', err);
        reject(err);
      });

      req.write(data);
      req.end();
    });
  } catch (err) {
    console.error('Lambda error:', err);
    throw err;
  }
};
