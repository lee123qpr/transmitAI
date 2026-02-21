const http = require('http');

const data = JSON.stringify({
    oldTitle: 'Old Title',
    newTitle: 'New Title'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/transmittals/rename?userId=test-user',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('Response:', responseData);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
