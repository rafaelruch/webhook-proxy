const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/webhook/:instance', async (req, res) => {
  try {
    const instance = req.params.instance;
    const data = req.body;
    
    // Se a mensagem tem attachments com URLs do MinIO
    if (data.attachments && Array.isArray(data.attachments)) {
      data.attachments = data.attachments.map(attachment => {
        if (attachment.data_url && attachment.data_url.includes('s3minio.ruch.com.br/chatwoot/')) {
          // Extrai o hash do arquivo
          const hash = attachment.data_url.split('/chatwoot/')[1].split('?')[0];
          // Substitui pela URL do proxy
          attachment.data_url = `https://proxy.ruch.com.br/${hash}`;
        }
        return attachment;
      });
    }
    
    // Envia para a Evolution API
    const evolutionResponse = await axios.post(
      `https://evolution.ruch.com.br/webhook/${instance}`,
      data,
      {
        headers: {
          'apikey': process.env.EVOLUTION_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(evolutionResponse.data);
    
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Webhook proxy running on port ${PORT}`);
});
