import axios from 'axios';

async function testInstagramAPI() {
    const testUrl = 'https://www.instagram.com/reel/DOI9zpuElC6/?utm_source=ig_web_copy_link';

    try {
        console.log('Testing Instagram API integration...');
        console.log('URL:', testUrl);

        const response = await axios.post('http://localhost:3001/api/videos/test-instagram', {
            url: testUrl
        }, {
            timeout: 300000 // 5 minutes timeout for Instagram processing
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
testInstagramAPI();
