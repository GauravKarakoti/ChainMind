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

function formatPriceAlert(alert, currentValue) {
  return alert.custom_message || `🚨 ${alert.token} price is now $${currentValue} (${alert.condition} $${alert.value})`;
}

function formatGasAlert(alert, currentValue) {
  return alert.custom_message || `⛽ Gas price on ${alert.chain.split('/')[0]} is ${currentValue} gwei (${alert.condition} ${alert.value} gwei)`;
}

async function sendNotifications(alert, message, value) {
  if (alert.lastTriggered && new Date() - new Date(alert.lastTriggered) < alert.cooldown * 60 * 1000) {
    return;
  }
  
  // Format message based on alert type
  let formattedMessage;
  console.log('Sending notification for alert:', alert);
  switch(alert.type) {
    case 'price':
      formattedMessage = formatPriceAlert(alert, value);
      break;
    case 'gas':
      formattedMessage = formatGasAlert(alert, value);
      break;
    case 'whale':
      formattedMessage = message;
      formattedMessage += `\n\nTop transfers:\n${value.slice(0,3).map(t => 
        `- ${t.amount} ${t.currency} (${t.from.slice(0,6)}... → ${t.to.slice(0,6)}...)`
      ).join('\n')}`;
      break;
    case 'account-activity':
      formattedMessage = message
      formattedMessage += ` in the last 24 hours`;
      break;
    default:
      formattedMessage = message;
  }
  await sendTelegramAlert(alert, formattedMessage);
}

async function sendTelegramAlert(data, message) {
  try {
    console.log(data)
    const response = await axios.post(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: data.chatID,
        text: `Blockchain Alert: ${message}`,
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
  triggerZapierWorkflow,
  sendNotifications
};