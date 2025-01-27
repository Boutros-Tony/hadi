const { google } = require("googleapis");
const readline = require("readline");

const oauth2Client = new google.auth.OAuth2(
  "266471163240-4v3c9gel7sd0ovjnaf4ho1pkh5cs5mcq.apps.googleusercontent.com",
  "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",
  "urn:ietf:wg:oauth:2.0:oob"
);

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
});

console.log("Visit this URL to get the authorization code:", url);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the authorization code: ", async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log("Your refresh token:", tokens.refresh_token);
  rl.close();
});
