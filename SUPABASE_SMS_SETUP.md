# Supabase SMS/Phone Auth Setup Guide

## Issue: "Unsupported phone provider" Error

This error occurs when Supabase phone authentication is not properly configured with an SMS provider.

## Solution: Configure SMS Provider in Supabase

### Option 1: Configure Twilio (Recommended for Production)

1. **Get Twilio Credentials:**
   - Sign up at [Twilio](https://www.twilio.com/)
   - Get your Account SID and Auth Token
   - Get a phone number with SMS capabilities

2. **Configure in Supabase:**
   - Go to your Supabase Dashboard
   - Navigate to **Authentication** > **Providers** > **Phone**
   - Enable Phone provider
   - Enter your Twilio credentials:
     - Account SID
     - Auth Token
     - Phone Number (in E.164 format, e.g., +1234567890)

3. **Test:**
   - Use a real phone number
   - You'll receive an SMS with the OTP code

### Option 2: Use Supabase Test Phone Numbers (For Development)

For development and testing, Supabase provides test phone numbers:

1. **Go to Supabase Dashboard:**
   - Navigate to **Authentication** > **Phone Auth**
   - Look for "Test Phone Numbers" section

2. **Use Test Numbers:**
   - Supabase provides test numbers like `+15005550006`
   - Use OTP code: `123456` (for test numbers)

3. **Update Code (Optional):**
   - You can add a development mode that uses test numbers
   - Or configure your app to use test numbers in development

### Option 3: Use Email Auth Instead (Temporary Workaround)

If SMS setup is not ready, you can temporarily use email authentication:

1. **Update auth flow:**
   - Use email/password login instead of phone OTP
   - Or use email magic links

2. **Update the app:**
   - Modify `phone-login-screen.tsx` to use email
   - Or create an alternative login screen

## Current Phone Number Format

The app formats Ghana phone numbers as:
- Input: `0241234567` or `024 123 4567`
- Formatted: `+233241234567`

## Testing

After configuring Twilio:
1. Enter a real Ghana phone number
2. You should receive an SMS with OTP
3. Enter the OTP to complete authentication

## Troubleshooting

- **"Invalid phone number"**: Check the phone number format
- **"Unsupported provider"**: SMS provider not configured in Supabase
- **"Rate limit exceeded"**: Too many requests, wait a few minutes
- **No SMS received**: Check Twilio logs and phone number format

## Next Steps

1. Set up Twilio account and get credentials
2. Configure in Supabase Dashboard
3. Test with a real phone number
4. For production, consider adding rate limiting and verification

