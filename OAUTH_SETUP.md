# OAuth Configuration Guide for Online Auction

## Overview

This project supports authentication through 4 OAuth providers:
- Google
- Facebook
- Twitter
- GitHub

## Setup Steps

### 1. Update Database

Run migration to add necessary columns to the `users` table:

```bash
psql -U postgres -d online_auction -f database/migrations/add_oauth_support.sql
```

Or run the SQL directly in your database.

### 2. Configure OAuth Providers

#### A. Google OAuth

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to **Credentials** > **Create Credentials** > **OAuth Client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3005/account/auth/google/callback`
   - `https://yourdomain.com/account/auth/google/callback` (production)
7. Copy **Client ID** and **Client Secret** to your `.env` file

#### B. Facebook OAuth

1. Visit [Facebook Developers](https://developers.facebook.com/)
2. Create a new app: **My Apps** > **Create App**
3. Select **Consumer** and fill in the information
4. Go to **Settings** > **Basic** to get **App ID** and **App Secret**
5. Add Facebook Login product
6. Go to **Facebook Login** > **Settings**
7. Add Valid OAuth Redirect URIs:
   - `http://localhost:3005/account/auth/facebook/callback`
   - `https://yourdomain.com/account/auth/facebook/callback` (production)
8. Copy **App ID** and **App Secret** to your `.env` file

#### C. Twitter OAuth

1. Visit [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Go to **Settings** > **User authentication settings**
4. Enable **OAuth 1.0a**
5. Add Callback URL:
   - `http://localhost:3005/account/auth/twitter/callback`
6. Request email from users (enable this option)
7. Copy **API Key** and **API Secret Key** to your `.env` file

#### D. GitHub OAuth

1. Visit [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the information:
   - Application name: Online Auction
   - Homepage URL: `http://localhost:3005`
   - Authorization callback URL: `http://localhost:3005/account/auth/github/callback`
4. Click **Register application**
5. Copy **Client ID** and generate **Client Secret**
6. Copy to your `.env` file

### 3. Update .env File

Copy `.env.example` to `.env` and fill in the information:

```bash
cp .env.example .env
```

Then update the OAuth values:

```env
# Google
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3005/account/auth/google/callback

# Facebook
FACEBOOK_APP_ID=your_actual_app_id
FACEBOOK_APP_SECRET=your_actual_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:3005/account/auth/facebook/callback

# Twitter
TWITTER_CONSUMER_KEY=your_actual_consumer_key
TWITTER_CONSUMER_SECRET=your_actual_consumer_secret
TWITTER_CALLBACK_URL=http://localhost:3005/account/auth/twitter/callback

# GitHub
GITHUB_CLIENT_ID=your_actual_client_id
GITHUB_CLIENT_SECRET=your_actual_client_secret
GITHUB_CALLBACK_URL=http://localhost:3005/account/auth/github/callback
```

### 4. Start the Application

```bash
npm run dev
```

### 5. Test OAuth

Visit `http://localhost:3005/account/signin` and click on the buttons:
- **Google** - Sign in with Google
- **Facebook** - Sign in with Facebook
- **Twitter** - Sign in with Twitter
- **GitHub** - Sign in with GitHub

## Important Notes

### Development vs Production

- **Development**: Use `http://localhost:3005` in callback URLs
- **Production**: Change callback URLs to your actual domain (https://yourdomain.com)

### Email from OAuth Providers

- **Google**: Always provides email
- **Facebook**: May not provide email (if user declines)
- **Twitter**: Requires permission request to get email
- **GitHub**: May not provide email if user sets it as private

If no email is available, the system will generate a fake email: `provider_oauthid@oauth.local`

### Security

- **DO NOT** commit `.env` file to Git
- Keep Client Secret/App Secret secure
- Use HTTPS in production
- Set up CORS and domain whitelist for production

## Troubleshooting

### Error "redirect_uri_mismatch"

- Check that callback URL in OAuth app settings matches the URL in `.env`
- Ensure there's no trailing `/` in the URL

### Error "Error: Failed to fetch user profile"

- Verify Client ID/Secret are correct
- Ensure API/Product is enabled
- Check scope permissions

### Duplicate Users

- Only occurs if user registers with email first, then uses OAuth with the same email
- The system will automatically link the OAuth provider to the existing account

## Additional Features That Can Be Added

1. **Multi-provider linking**: Allow users to link multiple OAuth providers to one account
2. **Profile sync**: Automatically update information from OAuth provider
3. **Avatar sync**: Get avatar from OAuth provider
4. **Login analytics**: Track login methods
5. **2FA**: Two-factor authentication for OAuth users

## Support

If you encounter issues, please:
1. Check logs in the console
2. Confirm database has been migrated
3. Verify all credentials in `.env`
4. Ensure callback URLs are correct
