const http = require('http');

const data = JSON.stringify({
    userId: 'test_user_123',
    email: 'test@example.com',
    returnUrl: 'http://localhost:5173',
    planType: 'pro'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/create-checkout-session',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Sending request to', options.path);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(data);
req.end();
