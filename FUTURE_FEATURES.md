# Future Enhancements Roadmap

This document outlines high-impact feature enhancements for the Job Auto-Apply platform.

## 1. Auto-Recruiter Finder & Email Verifier
*   **Objective**: Solve the sourcing problem where job postings on boards or social media do not specify recruiter contact details.
*   **Details**:
    *   Integrate APIs (such as Hunter.io, Apollo, or Lusha) to dynamically find active Talent Acquisition (TA) or engineering manager email addresses for a given company name.
    *   Implement an SMTP check/handshake verification mechanism to verify candidate emails exist prior to sending, preventing email bounces and preserving domain sender score.

## 2. Interactive Chatbot Integration (Slack, Telegram, or WhatsApp)
*   **Objective**: Reduce application friction and facilitate mobile workflow.
*   **Details**:
    *   Create a messaging bot (e.g. Telegram or Slack App) that connects to the server backend.
    *   Allow users to send screenshots of job postings directly to the bot.
    *   The bot triggers LLM extraction, drafts the email, and returns the subject and body to the chat for quick editing and approval with inline buttons.
