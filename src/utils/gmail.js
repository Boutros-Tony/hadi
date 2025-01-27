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
    // Get messages from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const afterDate = Math.floor(yesterday.getTime() / 1000);

    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 50, // Increased to ensure we don't miss any
      q: `after:${afterDate}`, // Get emails after yesterday
    });

    console.log("Fetched messages count:", response.data.messages?.length || 0);

    if (!response.data.messages) {
      console.log("No messages found");
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
        const from = headers.find((h) => h.name === "From")?.value;

        console.log("Processing email:", {
          id: message.id,
          subject,
          date: date.toISOString(),
          from,
        });

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
          from: from,
        };
      })
    );

    // Sort emails by date (newest first)
    const sortedEmails = emails.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    console.log("Total processed emails:", sortedEmails.length);

    return sortedEmails;
  } catch (error) {
    console.error("Error fetching emails:", error);
    return [];
  }
}
