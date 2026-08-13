const https = require('https');

const url = 'https://nxiheuoibsrsdoltbyug.supabase.co/rest/v1/';

console.log('Testing connection to Supabase endpoint:', url);

https.get(url, (res) => {
  console.log('Response Status Code:', res.statusCode);
  console.log('Response Headers:', res.headers);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Response Body:', data);
  });
}).on('error', (err) => {
  console.error('HTTP Error:', err.message);
});
