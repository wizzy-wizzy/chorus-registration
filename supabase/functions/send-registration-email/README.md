# Registration confirmation email

This Supabase Edge Function sends confirmation messages through Resend's test sender. It does not use the service-role key and never exposes the Resend API key to the browser.

## Environment variables

Set these secrets in Supabase Edge Functions:

- `RESEND_API_KEY`: Resend API key with permission to send mail.
- `APP_ORIGIN`: The deployed site origin, for example `https://chorus.example.com`.

For local development, put the same values in `supabase/functions/.env` and run:

```bash
supabase functions serve send-registration-email --env-file supabase/functions/.env
```

Deploy with:

```bash
supabase functions deploy send-registration-email
```