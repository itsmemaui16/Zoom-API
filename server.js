/**
 * Simple Zoom OAuth 2.0 demo backend
 * - Serves static frontend files
 * - Exchanges authorization codes for tokens
 * - Fetches the current Zoom user profile
 */
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5500;

// Basic safety checks for required env vars
const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;
if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.warn(
    'Missing one of CLIENT_ID, CLIENT_SECRET, REDIRECT_URI. ' +
      'Create a .env file based on .env.example before running the server.'
  );
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Utility to build the Basic auth header for Zoom token exchange
const buildBasicAuthHeader = () => {
  const credentials = `${CLIENT_ID}:${CLIENT_SECRET}`;
  const encoded = Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
};

// Expose non-sensitive config to the frontend (client ID & redirect)
app.get('/config', (_req, res) => {
  res.json({
    clientId: CLIENT_ID,
    redirectUri: REDIRECT_URI,
  });
});

// Exchange authorization code for access token
app.post('/oauth/token', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    const tokenResponse = await axios.post(
      'https://zoom.us/oauth/token',
      null,
      {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
        },
        headers: {
          Authorization: buildBasicAuthHeader(),
        },
      }
    );

    // Return token payload to the frontend (contains access_token, expires_in, etc.)
    return res.json(tokenResponse.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.reason ||
      error.response?.data?.message ||
      error.message;
    console.error('Token exchange failed:', message);
    return res.status(status).json({ error: 'Token exchange failed', detail: message });
  }
});

// Fetch the authenticated user's profile from Zoom
app.get('/user', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }

  const accessToken = authHeader.replace('Bearer ', '');

  try {
    const userResponse = await axios.get('https://api.zoom.us/v2/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const {
      id,
      first_name,
      last_name,
      email,
      verified,
      timezone,
      type,
      personal_meeting_id,
      pmi,
      pic_url,
      profile_pic_url,
    } = userResponse.data;
    return res.json({
      id,
      name: `${first_name} ${last_name}`.trim(),
      email,
      verified,
      timezone,
      type,
      personal_meeting_id,
      pmi,
      profile_pic_url: profile_pic_url || pic_url, // Zoom may return either
      first_name,
      last_name,
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.reason ||
      error.response?.data?.message ||
      error.message;
    console.error('User fetch failed:', message);
    return res.status(status).json({ error: 'Failed to fetch user', detail: message });
  }
});

// Fetch upcoming meetings (limited to 5) for the authenticated user
app.get('/meetings', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }

  const accessToken = authHeader.replace('Bearer ', '');

  try {
    const meetingsResponse = await axios.get(
      'https://api.zoom.us/v2/users/me/meetings',
      {
        params: {
          type: 'upcoming',
          page_size: 5,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const meetings = (meetingsResponse.data.meetings || []).map(
      ({ id, topic, start_time }) => ({
        id,
        topic,
        start_time,
      })
    );

    return res.json({ meetings });
  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.reason ||
      error.response?.data?.message ||
      error.message;
    console.error('Meetings fetch failed:', message);
    return res.status(status).json({ error: 'Failed to fetch meetings', detail: message });
  }
});

app.listen(PORT, () => {
  console.log(`Zoom OAuth demo running at http://localhost:${PORT}`);
});

