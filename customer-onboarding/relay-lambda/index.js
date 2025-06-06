const https = require('https');
const zlib = require('zlib');

const DEST_URL = process.env.DEST_URL;

exports.handler = async (event) => {
  try {
    // Decode and decompress log data
    const zipped = Buffer.from(event.awslogs.data, 'base64');
    const json = zlib.gunzipSync(zipped).toString('utf8');
    const payload = JSON.parse(json);

    const data = JSON.stringify(payload);

    const url = new URL(DEST_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
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

