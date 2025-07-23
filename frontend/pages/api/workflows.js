import axios from 'axios';

export default async function handler(req, res) {
  const backendBaseUrl = process.env.URL;
  const token = req.headers['x-auth-token'];
  const { method } = req;
  const { workflowId } = req.query;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    switch (method) {
      case 'GET':
        const getResponse = await axios.get(`${backendBaseUrl}/api/workflows`, {
          headers: { 'x-auth-token': token }
        });
        return res.status(200).json(getResponse.data);

      case 'POST':
        const createResponse = await axios.post(`${backendBaseUrl}/api/workflows`, req.body, {
          headers: { 'x-auth-token': token }
        });
        return res.status(201).json(createResponse.data);

      case 'DELETE':
        if (!workflowId) {
          return res.status(400).json({ error: 'Workflow ID is required' });
        }
        await axios.delete(`${backendBaseUrl}/api/workflows/${workflowId}`, {
          headers: { 'x-auth-token': token }
        });
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Workflow API proxy error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: 'Failed to process workflow request' };
    return res.status(status).json(data);
  }
}