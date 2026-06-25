# Job Email Scheduler

Automate follow-up emails for job applications by uploading screenshots of job postings.

## Features

- 📸 **Screenshot Upload**: Upload job posting screenshots with optional context
- 🤖 **AI Extraction**: Automatically extract email, company, position, and region using LLM
- ✉️ **Email Generation**: AI-generated professional follow-up emails
- ⏰ **Smart Scheduling**: Emails sent at optimal times based on job region
  - India: 11:00 AM IST
  - US/Europe: 10:00 AM local time
  - **Weekend Avoidance**: Automatically skips Saturday & Sunday, postpones to Monday
- 📊 **Status Tracking**: Track pending, sent, and failed emails
- 💾 **Local Storage**: All history persists in browser localStorage

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: OpenAI GPT-4 or Google Gemini
- **Email**: Gmail SMTP via nodemailer
- **Scheduling**: Vercel Cron Jobs
- **Storage**: Browser localStorage (frontend), in-memory (backend)

## Setup

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment Variables

Create a \`.env.local\` file:

\`\`\`env
# LLM Provider (openai or gemini)
LLM_PROVIDER=your_provider_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# OR Google Gemini Configuration
# GEMINI_API_KEY=your_gemini_api_key_here

# Gmail SMTP Configuration
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password_here
\`\`\`

### 3. Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App Passwords
4. Generate a new app password for "Mail"
5. Use this password in \`GMAIL_APP_PASSWORD\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Use either **Vercel Cron** (see \`vercel.json\`) or an **external cron** (recommended) to hit \`GET /api/cron\` every 15 minutes.

### External cron (e.g. cron-job.org)

To trigger the cron from an external service (free, reliable):

1. **Set a secret** in your deployment: add \`CRON_SECRET\` to Vercel (or your host) with a long random string (e.g. \`openssl rand -hex 24\`).
2. **Create a cron job** at [cron-job.org](https://cron-job.org) (or similar):
   - **URL**: \`https://your-app.vercel.app/api/cron\`
   - **Schedule**: every 15 minutes
   - **Auth**: either add a request header \`X-Cron-Secret: <your CRON_SECRET>\`, or use \`Authorization: Bearer <your CRON_SECRET>\`, or append \`?secret=<your CRON_SECRET>\` to the URL.

If \`CRON_SECRET\` is not set, the endpoint accepts any GET request (fine for local dev; set the secret in production). The route uses an in-memory lock so overlapping runs (e.g. slow run and next tick) do not process jobs twice; jobs are processed in order by scheduled time.

### Environment Variables in Vercel

Add these in your Vercel project settings:

- \`LLM_PROVIDER\`
- \`OPENAI_API_KEY\` or \`GEMINI_API_KEY\`
- \`GMAIL_USER\`
- \`GMAIL_APP_PASSWORD\`
- \`CRON_SECRET\` (optional but recommended for production when using external cron)

## Usage

1. **Upload Screenshot**: Click to upload or drag & drop a job posting screenshot
2. **Add Context** (optional): Provide additional instructions or context
3. **Submit**: The system will:
   - Extract job details using AI
   - Generate a professional email
   - Calculate optimal send time (skips weekends automatically)
   - Schedule the email
4. **Track Status**: View all applications in the history panel
5. **Auto-Sync**: Status updates automatically when you reopen the app

### Weekend Handling

The system automatically avoids sending emails on weekends:
- **Scheduling**: Jobs scheduled for Saturday/Sunday are automatically moved to Monday 10 AM
- **Cron Execution**: If the cron runs on a weekend, it postpones all ready jobs to Monday
- **Business Days Only**: Ensures your emails arrive during business hours for better response rates
- **Development Mode**: 
  - Weekend checks bypassed for testing
  - ALL pending jobs processed immediately (ignores scheduled time)
  - Perfect for instant testing: Upload → Trigger cron → Email sent!

## Architecture

### Data Flow

1. **Upload** → Frontend validates → API extracts details → Schedules email → Saves to memory
2. **Cron Job** → Checks pending jobs → Sends emails → Updates status
3. **Sync** → Frontend fetches processed jobs → Updates localStorage → Clears backend memory

### Storage Strategy

- **Frontend**: Browser localStorage (persistent history)
- **Backend**: In-memory Map (temporary pending jobs)
- **No Database**: Simple, serverless-friendly architecture

## API Routes

- \`POST /api/upload\` - Upload screenshot and create job
- \`GET /api/cron\` - Process scheduled emails (triggered by Vercel Cron)
- \`GET /api/sync\` - Sync processed jobs to frontend

## Project Structure

\`\`\`
job-email-scheduler/
├── app/
│   ├── api/
│   │   ├── upload/route.ts    # Upload endpoint
│   │   ├── cron/route.ts      # Cron job endpoint
│   │   └── sync/route.ts      # Sync endpoint
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page
├── components/
│   ├── UploadComponent.tsx    # Upload UI
│   └── HistoryComponent.tsx   # History display
├── lib/
│   ├── services/
│   │   ├── llm.ts            # LLM service
│   │   ├── email.ts          # Email service
│   │   ├── scheduler.ts      # Scheduling logic
│   │   └── memoryStore.ts    # In-memory storage
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── utils/
│       ├── localStorage.ts   # Browser storage
│       └── validation.ts     # Validation utilities
├── .env.example              # Environment template
├── vercel.json              # Vercel cron config
└── README.md
\`\`\`

## Security Considerations

- API keys stored in environment variables
- Gmail app passwords (not main password)
- Client-side validation for file uploads
- Server-side validation for all inputs
- Error handling with proper logging
- No sensitive data in localStorage

## Limitations

- Single-user application
- No database (uses in-memory + localStorage)
- Vercel cron runs every 5 minutes (free tier)
- 10MB max image size
- Gmail SMTP rate limits apply

## Troubleshooting

### Emails Not Sending

- Check Gmail credentials in environment variables
- Verify Gmail app password is correct
- Check Vercel cron logs
- Ensure scheduled time has passed

### LLM Extraction Fails

- Verify API key is correct
- Check image quality and format
- Try adding more context in prompt
- Check API quota/limits

### Email Generation Issues

- System is flexible with email content validation
- Warnings logged if company/position not explicitly mentioned
- Check Vercel logs for warnings
- Email will still be generated and sent

### Sync Not Working

- Check browser console for errors
- Verify localStorage is enabled
- Try manual refresh button

## License

MIT
