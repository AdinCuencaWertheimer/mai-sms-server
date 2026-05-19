# MAI Home SMS Server

Twilio webhook server that receives a room photo + style prompt via SMS, redesigns it using GPT-4o + DALL-E 3, and sends the result back as MMS.

## Setup

### Environment Variables (set these in Railway)
- `OPENAI_API_KEY` — your OpenAI API key
- `TWILIO_ACCOUNT_SID` — from Twilio console
- `TWILIO_AUTH_TOKEN` — from Twilio console

### Deploy to Railway
1. Push this folder to a GitHub repo
2. Go to railway.app and sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select this repo
5. Add the 3 environment variables above
6. Railway gives you a URL like `https://yourapp.railway.app`
7. Set your Twilio webhook to `https://yourapp.railway.app/sms`
