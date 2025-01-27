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
    // Search for forwarded Netflix emails about temporary access
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults: 50,
      q: "subject:Netflix temporary access", // Search for Netflix temporary access in subject
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

        // Get headers
        const headers = email.data.payload.headers;
        const subject =
          headers.find((h) => h.name === "Subject")?.value || "No Subject";
        const date = new Date(headers.find((h) => h.name === "Date")?.value);
        const from = headers.find((h) => h.name === "From")?.value;

        // Extract body and find Netflix verification link
        let body = "";
        if (email.data.payload.parts) {
          // Handle multipart messages
          for (const part of email.data.payload.parts) {
            if (part.mimeType === "text/html") {
              body = Buffer.from(part.body.data, "base64").toString();
              break;
            } else if (part.mimeType === "text/plain") {
              body = Buffer.from(part.body.data, "base64").toString();
            }
          }
        } else if (email.data.payload.body.data) {
          // Handle single part messages
          body = Buffer.from(email.data.payload.body.data, "base64").toString();
        }

        // Try multiple patterns to find Netflix verification link
        const patterns = [
          // Standard href pattern
          /href=["'](https:\/\/www\.netflix\.com\/account\/travel\/verify\?[^"']+)["']/,
          // URL in text
          /(https:\/\/www\.netflix\.com\/account\/travel\/verify\?[^\s<>"']+)/,
          // Encoded URL
          /href=["']([^"']*netflix[^"']*travel[^"']*verify[^"']+)["']/,
        ];

        let netflixLink = null;
        for (const pattern of patterns) {
          const match = body.match(pattern);
          if (match) {
            netflixLink = match[1];
            break;
          }
        }

        // Only return emails that have the Netflix verification link
        if (netflixLink) {
          console.log("Found Netflix verification email:", {
            id: message.id,
            subject,
            date: date.toISOString(),
            hasLink: true,
            link: netflixLink,
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
            link: netflixLink,
          };
        }
        return null;
      })
    );

    // Filter out null values and sort by date
    const sortedEmails = emails
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log("Total Netflix verification emails:", sortedEmails.length);

    return sortedEmails;
  } catch (error) {
    console.error("Error fetching emails:", error);
    return [];
  }
}
