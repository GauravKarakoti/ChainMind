import axios from 'axios';

export default async function handler(req, res) {
  const backendBaseUrl = process.env.URL;
  const { method } = req;
  const { userId, alertId } = req.query;
  const { active, updateData } = req.body;
  console.log('updated alert data:', updateData);

  try {
    // Handle different HTTP methods
    switch (method) {
      case 'GET':
        // Fetch user alerts
        if (!userId) {
          return res.status(400).json({ error: 'Missing user ID' });
        }
        console.log(`${backendBaseUrl}/api/alerts/user/${userId}`)
        const alertsResponse = await axios.get(
          `${backendBaseUrl}/api/alerts/user/${userId}`
        );
        return res.status(200).json(alertsResponse.data);

      case 'POST':
        // Create new alert
        const newAlert = req.body;
        if (!newAlert.userId) {
          return res.status(400).json({ error: 'Missing user ID in alert data' });
        }
        const createResponse = await axios.post(
          `${backendBaseUrl}/api/alerts`,
          newAlert
        );
        return res.status(201).json(createResponse.data);

      case 'DELETE':
        // Delete an alert
        if (!alertId) {
          return res.status(400).json({ error: 'Missing alert ID' });
        }
        await axios.delete(`${backendBaseUrl}/api/alerts/${alertId}`);
        return res.status(204).end();

      case 'PATCH':
        if (!alertId) {
          return res.status(400).json({ error: 'Missing alert ID' });
        }
        await axios.patch(`${backendBaseUrl}/api/alerts/${alertId}/toggle`, { active });
        return res.status(204).end();

      case 'PUT':
        if (!alertId) {
          return res.status(400).json({ error: 'Missing alert ID' });
        }
        await axios.put(`${backendBaseUrl}/api/alerts/${alertId}`, { updateData });
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PATCH', 'PUT']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Alert API error:', error.response?.data || error.message);
    
    // Handle different error statuses
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || 'Failed to process alert request';
    
    return res.status(status).json({
      error: message,
      details: error.response?.data?.details || error.message
    });
  }
}