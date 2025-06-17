const nodemailer = require('nodemailer');
const { createEventLog } = require('./db');

// Create SendGrid transport
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});

// Alert templates
const ALERT_TEMPLATES = {
  large_transfer: (tx) => ({
    subject: `Large transfer detected: ${tx.valueUSD} USD`,
    text: `
      Large transaction alert!
      
      From: ${tx.from}
      To: ${tx.to}
      Amount: ${tx.value} ${tx.tokenSymbol} ($${tx.valueUSD})
      TX Hash: ${tx.transactionHash}
      
      View on Etherscan: https://etherscan.io/tx/${tx.transactionHash}
    `,
    html: `
      <h1>Large transaction alert!</h1>
      <p><strong>From:</strong> ${tx.from}</p>
      <p><strong>To:</strong> ${tx.to}</p>
      <p><strong>Amount:</strong> ${tx.value} ${tx.tokenSymbol} ($${tx.valueUSD})</p>
      <p><strong>TX Hash:</strong> <a href="https://etherscan.io/tx/${tx.transactionHash}">${tx.transactionHash}</a></p>
    `
  }),
  whale_activity: (data) => ({
    subject: `Whale alert: ${data.whaleAddress} moved ${data.tokenSymbol}`,
    text: `Whale address ${data.whaleAddress} just moved ${data.amount} ${data.tokenSymbol}`
  })
};

/**
 * Send email alert for blockchain events
 * @param {Object} alert - Alert configuration
 * @param {string} alert.type - Alert type (large_transfer, whale_activity, etc)
 * @param {Object} data - Event data
 * @param {string} [recipient] - Optional recipient override
 */
async function sendEmailAlert(alert, recipient = process.env.EMAIL_USER) {
  try {
    if (!ALERT_TEMPLATES[alert.type]) {
      throw new Error(`Invalid alert type: ${alert.type}`);
    }

    const template = ALERT_TEMPLATES[alert.type](alert.data);
    
    const mailOptions = {
      from: `"ChainMind Alerts" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: template.subject,
      text: template.text,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log to database
    await createEventLog({
      type: 'email_alert',
      status: 'sent',
      recipient,
      alert_type: alert.type,
      message_id: info.messageId
    });

    return info;
  } catch (error) {
    console.error('Email failed:', error);
    
    // Log failure
    await createEventLog({
      type: 'email_alert',
      status: 'failed',
      recipient,
      alert_type: alert.type,
      error: error.message
    });

    throw error;
  }
}

/**
 * Send SMS alert via Twilio
 * @param {string} message - Alert message
 * @param {string} [phone] - Recipient phone number
 */
async function sendSMSAlert(message, phone = process.env.ALERT_PHONE) {
  // Implementation would use Twilio API
  console.log(`SMS Alert to ${phone}: ${message}`);
  return { status: 'success' };
}

/**
 * Format and send appropriate notifications based on alert type
 * @param {Object} event - Blockchain event
 */
async function handleBlockchainEvent(event) {
  try {
    switch(event.type) {
      case 'TOKEN_TRANSFER':
        if (event.data.valueUSD > 10000) {
          await sendEmailAlert({
            type: 'large_transfer',
            data: event.data
          });
        }
        break;
      
      case 'WHALE_MOVEMENT':
        await sendEmailAlert({
          type: 'whale_activity',
          data: event.data
        });
        await sendSMSAlert(
          `Whale alert: ${event.data.whaleAddress} moved ${event.data.tokenSymbol}`
        );
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
    await axios.post(
      `https://hooks.zapier.com/hooks/catch/${process.env.ZAPIER_TELEGRAM_WEBHOOK_ID}/`,
      {
        message: `Blockchain Alert: ${JSON.stringify(data)}`
      }
    );
    
    await createEventLog({
      type: 'telegram_alert',
      status: 'sent',
      data: JSON.stringify(data)
    });
  } catch (error) {
    console.error('Telegram alert failed:', error);
    await createEventLog({
      type: 'telegram_alert',
      status: 'failed',
      error: error.message
    });
  }
}

// Trigger Zapier workflow for SMS
async function triggerZapierWorkflow(workflowType, data) {
  try {
    await axios.post(
      `https://hooks.zapier.com/hooks/catch/${process.env.ZAPIER_SMS_WEBHOOK_ID}/`,
      {
        type: workflowType,
        data
      }
    );
  } catch (error) {
    console.error('Zapier trigger failed:', error);
  }
}

module.exports = {
  sendEmailAlert,
  sendSMSAlert,
  handleBlockchainEvent,
  sendTelegramAlert,
  triggerZapierWorkflow
};