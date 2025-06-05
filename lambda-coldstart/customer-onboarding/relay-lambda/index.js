const https = require('https');
const zlib = require('zlib');

const DEST_URL = process.env.DEST_URL;

exports.handler = async (event) => {
  // Decode and decompress log data
  const payload = JSON.parse(zlib.gunzipSync(Buffer.from(event.awslogs.data, 'base64')).toString('utf8'));

  // Forward to SaaS endpoint
  const data = JSON.stringify(payload);

  const url = new URL(DEST_URL);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve());
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

