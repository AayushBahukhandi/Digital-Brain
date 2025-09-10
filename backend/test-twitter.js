import axios from 'axios';

async function testTwitterAPI() {
    const testUrl = 'https://x.com/RepTimMooreNC/status/1965207877838324145';

    try {
        console.log('Testing X/Twitter API integration...');
        console.log('URL:', testUrl);

        const response = await axios.post('http://localhost:3001/api/videos/test-twitter', {
            url: testUrl
        }, {
            timeout: 300000 // 5 minutes timeout for X/Twitter processing
        });

        console.log('\n✅ Test successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('\n❌ Test failed!');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

// Run the test
testTwitterAPI();