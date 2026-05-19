const express = require('express');
const twilio = require('twilio');
const OpenAI = require('openai');
const fetch = require('node-fetch');

const app = express();
app.use(express.urlencoded({ extended: false }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

app.post('/sms', async (req, res) => {
  const incomingMsg = req.body.Body?.trim() || '';
  const mediaUrl = req.body.MediaUrl0;
  const from = req.body.From;
  const to = req.body.To;

  // Respond immediately to Twilio (empty response)
  res.type('text/xml');
  res.send('<Response></Response>');

  // No photo sent
  if (!mediaUrl) {
    await twilioClient.messages.create({
      body: "👋 Welcome to MAI Home! Please send a photo of your room along with a style prompt (e.g. 'make it modern and minimalist') and we'll transform it for you!",
      from: to,
      to: from,
    });
    return;
  }

  // No message/prompt sent
  if (!incomingMsg) {
    await twilioClient.messages.create({
      body: "📸 Got your photo! Please also include a style prompt with it (e.g. 'make it cozy and modern') so we know how to redesign your room.",
      from: to,
      to: from,
    });
    return;
  }

  try {
    // Step 1: Send a "working on it" message
    await twilioClient.messages.create({
      body: "🏠 Got it! We're redesigning your room now — this takes about 30 seconds...",
      from: to,
      to: from,
    });

    // Step 2: Analyze the room with GPT-4o vision
    const visionRes = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: mediaUrl },
            },
            {
              type: 'text',
              text: `Describe this room in detail including: layout, dimensions (approximate), existing furniture, lighting, colors, and architectural features. Be specific so an interior designer could recreate it.`,
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const roomDescription = visionRes.choices[0].message.content;

    // Step 3: Generate redesigned image with DALL-E 3
    const imageRes = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Interior design photo of a real room. ${roomDescription}. Redesign style: ${incomingMsg}. Photorealistic, professional interior photography, well-lit, high quality.`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const generatedImageUrl = imageRes.data[0].url;

    // Step 4: Send the redesigned image back with the MAI Home message
    await twilioClient.messages.create({
      body: "✨ Here's your MAI-transformed room! Love what you see? Visit maihome.ai to shop every piece in this design — real products, real prices, ready to buy. 🛋️",
      from: to,
      to: from,
      mediaUrl: [generatedImageUrl],
    });

  } catch (err) {
    console.error('Error:', err);
    await twilioClient.messages.create({
      body: "Sorry, something went wrong while redesigning your room. Please try again in a moment!",
      from: to,
      to: from,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MAI SMS server running on port ${PORT}`));
