import { google } from "googleapis";

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({
  version: "v3",
  auth: oAuth2Client,
});

export const createCalendarEvent = async ({
  summary,
  description,
  startDateTime,
  endDateTime,
}) => {
  const event = {
    summary,
    description,
    start: {
      dateTime: startDateTime,
      timeZone: "Africa/Nairobi",
    },
    end: {
      dateTime: endDateTime,
      timeZone: "Africa/Nairobi",
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  return response.data;
};