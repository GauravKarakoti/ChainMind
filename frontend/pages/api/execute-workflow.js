import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const backendBaseUrl = process.env.URL;
  const token = req.headers['x-auth-token'];
  const { workflow } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!workflow) {
    return res.status(400).json({ error: 'Invalid workflow structure provided for execution' });
  }

  try {
    const response = await axios.post(
      `${backendBaseUrl}/api/workflows/execute`,
      { workflow }, // Ensure the body is correctly structured for the execution endpoint
      { headers: { 'x-auth-token': token } }
    );
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Workflow execution proxy error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: 'Failed to execute workflow' };
    return res.status(status).json(data);
  }
}