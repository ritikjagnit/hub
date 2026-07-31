const verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'instagram_verify_token_12345';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
};

const handleWebhookEvents = (req, res) => {
  let body = req.body;

  // Typically Instagram webhooks have object === 'instagram'
  if (body.object === 'instagram' || body.object === 'page') { 
    body.entry.forEach(function(entry) {
      console.log('Webhook Event Entry:', entry);
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
};

module.exports = {
  verifyWebhook,
  handleWebhookEvents
};
