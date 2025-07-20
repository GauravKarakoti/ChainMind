import axios from 'axios';

export default async function handler(req, res) {
  const backendBaseUrl = process.env.URL;
  
  try {
    // Fetch tokens from backend API
    const response = await axios.get(`${backendBaseUrl}/api/tokens`);
    
    // Extract token data from response
    const tokens = response.data.map(token => ({
      symbol: token.symbol,
      name: token.name,
      logo: token.logo,
      address: token.address
    }));

    // Return token data to frontend
    return res.status(200).json(tokens);
  } catch (error) {
    console.error('Token API error:', error.message);
    
    // Handle different error statuses
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Failed to fetch tokens';
    
    return res.status(status).json({
      error: message,
      details: error.response?.data?.details || error.message
    });
  }
}