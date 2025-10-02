const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evolution.ruch.com.br';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'comercialruch';

app.post('/webhook', async (req, res) => {
  try {
    console.log('Webhook received:', JSON.stringify(req.body, null, 2));
    
    const event = req.body.event;
    const message = req.body;

    // Só processa se for mensagem enviada com anexo
    if (event !== 'message_created' || !message.message_type === 'outgoing') {
      return res.json({ status: 'ignored' });
    }

    if (!message.attachments || message.attachments.length === 0) {
      return res.json({ status: 'no_attachments' });
    }

    const contact = message.conversation?.contact_inbox?.source_id;
    
    if (!contact) {
      console.error('No contact found');
      return res.status(400).json({ error: 'No contact' });
    }

    // Processa cada anexo
    for (const attachment of message.attachments) {
      console.log('Processing attachment:', attachment.data_url);
      
      try {
        // Download da imagem
        const imageResponse = await axios.get(attachment.data_url, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        
        // Converte para base64
        const base64 = Buffer.from(imageResponse.data).toString('base64');
        const contentType = imageResponse.headers['content-type'] || 'image/png';
        const dataUri = `data:${contentType};base64,${base64}`;
        
        console.log('Sending to Evolution API...');
        
        // Envia via Evolution API
        const evolutionResponse = await axios.post(
          `${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`,
          {
            number: contact,
            mediatype: contentType.startsWith('image/') ? 'image' : 'document',
            media: dataUri,
            caption: message.content || ''
          },
          {
            headers: {
              'apikey': EVOLUTION_API_KEY,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
        
        console.log('Evolution API response:', evolutionResponse.data);
        
      } catch (attachmentError) {
        console.error('Error processing attachment:', attachmentError.message);
      }
    }
    
    res.json({ status: 'processed' });
    
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Webhook proxy listening on port ${PORT}`);
});
