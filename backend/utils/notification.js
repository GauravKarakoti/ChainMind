const axios = require('axios');
const { createEventLog } = require('./db');

/**
 * Format and send appropriate notifications based on alert type
 * @param {Object} event - Blockchain event
 */
async function handleBlockchainEvent(event) {
  try {
    switch(event.type) {
      case 'TOKEN_TRANSFER':
        if (event.data.valueUSD > 10000) {
          await sendTelegramAlert({ data: event.data });
        }
        break;
      
      case 'WHALE_MOVEMENT':
        await sendTelegramAlert({ data: event.data });
        break;

      case 'PRICE_ALERT':
        const { token, condition, value, currentPrice } = event.data;
        const message = `${token} price is now $${currentPrice} (${condition} $${value})`;
        
        await sendTelegramAlert({
          data: {
            ...event.data,
            message
          }
        });
        break;
      
      default:
        console.warn('Unhandled event type:', event.type);
    }
  } catch (error) {
    console.error('Notification handling failed:', error);
  }
}

async function sendTelegramAlert(data) {
  try {
    console.log(data)
    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: data.chatID,
        text: `Blockchain Alert: ${data.message}`,
        parse_mode: 'HTML'
      }
    );
    
    await createEventLog({
      type: 'telegram_alert',
      status: 'sent',
      data: JSON.stringify(data),
      message_id: response.data.message_id
    });

    return response.data;
  } catch (error) {
    console.error('Telegram alert failed:', error);
    await createEventLog({
      type: 'telegram_alert',
      status: 'failed',
      error: error.message
    });
    throw error;
  }
}

// Trigger Zapier workflow for SMS
async function triggerZapierWorkflow(workflowType, data) {
  try {
    const response = await axios.post(
      `https://hooks.zapier.com/hooks/catch/${process.env.ZAPIER_WEBHOOK_ID}/`,
      {
        type: workflowType,
        data
      }
    );
    return response.data;
  } catch (error) {
    console.error('Zapier trigger failed:', error);
    throw error;
  }
}

module.exports = {
  handleBlockchainEvent,
  sendTelegramAlert,
  triggerZapierWorkflow
};