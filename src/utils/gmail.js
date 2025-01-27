import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);

// Set credentials (you'll need to implement the OAuth2 flow)
oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

export async function getEmails() {
  try {
    // Fetch all emails, sorted by date
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 20, // Adjust this number as needed
      orderBy: "date", // This will sort by date
    });

    if (!response.data.messages) {
      return [];
    }

    const emails = await Promise.all(
      response.data.messages.map(async (message) => {
        const email = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "full",
        });

        // Get headers we want
        const headers = email.data.payload.headers;
        const subject =
          headers.find((h) => h.name === "Subject")?.value || "No Subject";
        const date = new Date(headers.find((h) => h.name === "Date")?.value);

        return {
          id: email.data.id,
          subject: subject,
          date: date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      })
    );

    // Sort emails by date (newest first)
    return emails.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error("Error fetching emails:", error);
    return [];
  }
}
