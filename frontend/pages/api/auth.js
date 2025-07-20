import axios from 'axios';

export default async function handler(req, res) {
  const backendBaseUrl = process.env.URL;
  const { method } = req;
  
  try {
    if (method === 'POST') {
      const { action } = req.query;
      
      if (action === 'login') {
        const { email, password } = req.body;
        const response = await axios.post(
          `${backendBaseUrl}/api/auth/login`,
          { email, password }
        );
        return res.status(response.status).json(response.data);
      } 
      else if (action === 'register') {
        const { email, password, telegram_chat_id } = req.body;
        const response = await axios.post(
          `${backendBaseUrl}/api/auth/register`,
          { email, password, telegram_chat_id }
        );
        return res.status(response.status).json(response.data);
      }
      else {
        return res.status(400).json({ error: 'Invalid action specified' });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Auth API error:', error.response?.data || error.message);
    
    // Handle different error statuses
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Failed to process authentication request';
    
    return res.status(status).json({
      error: message,
      details: error.response?.data?.details || error.message
    });
  }
}