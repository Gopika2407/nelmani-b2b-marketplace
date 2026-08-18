const axios = require('axios');

const testRegister = async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      email: 'parkavipari05@gmail.com',
      password: 'buyerpassword123',
      role: 'buyer',
      companyName: 'South India Commodity Traders',
      gstNumber: '33BBBBB1111B1Z1',
      contactNumber: '8072687191',
      address: '45 Mill Road, Coimbatore, Tamil Nadu',
    });
    console.log('REGISTRATION SUCCESS:', res.data);
  } catch (err) {
    console.error('REGISTRATION FAILED WITH STATUS:', err.response?.status);
    console.error('SERVER ERROR PAYLOAD:', err.response?.data);
  }
};

testRegister();
