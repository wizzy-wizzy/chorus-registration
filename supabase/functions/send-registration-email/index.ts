declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Promise<Response>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") || "*",
  "Content-Type": "application/json"
};

const resendApiUrl = "https://api.resend.com/emails";
const resendTestSender = "onboarding@resend.dev";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegistrationEmail = {
  full_name: string;
  email: string;
  registration_id: string;
  phone?: string | null;
  gender?: string | null;
  city?: string | null;
  church?: string | null;
  attendance?: string | null;
  group_size?: number | null;
  source?: string | null;
  message?: string | null;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function optionalText(value: unknown, maximumLength = 200): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > maximumLength) return null;
  return value.trim() || null;
}

function validatePayload(value: unknown): RegistrationEmail {
  if (!value || typeof value !== "object") {
    throw new Error("A registration payload is required.");
  }

  const payload = value as Record<string, unknown>;
  const fullName = optionalText(payload.full_name, 120);
  const email = optionalText(payload.email, 254);
  const registrationId = optionalText(payload.registration_id, 80);

  if (!fullName || !email || !emailPattern.test(email) || !registrationId) {
    throw new Error("The registration name, email, and ID are required.");
  }

  return {
    full_name: fullName,
    email,
    registration_id: registrationId,
    phone: optionalText(payload.phone, 40),
    gender: optionalText(payload.gender, 30),
    city: optionalText(payload.city, 100),
    church: optionalText(payload.church, 150),
    attendance: optionalText(payload.attendance, 40),
    group_size: typeof payload.group_size === "number" && Number.isInteger(payload.group_size)
      ? payload.group_size
      : null,
    source: optionalText(payload.source, 40),
    message: optionalText(payload.message, 1000)
  };
}

function detailRow(label: string, value: unknown): string {
  const safeValue = escapeHtml(value) || "Not provided";
  return `<tr><td style="padding:8px 0;color:#777;font-size:12px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;width:42%;">${escapeHtml(label)}</td><td style="padding:8px 0;color:#191919;font-size:14px;">${safeValue}</td></tr>`;
}

function buildEmail(registration: RegistrationEmail, from: string) {
  const name = escapeHtml(registration.full_name);
  const subject = "CHORUS 2026 — Registration Confirmed 🎶";
  const html = `<!doctype html><html><body style="margin:0;background:#f2f0eb;color:#191919;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:620px;margin:0 auto;padding:32px 18px;"><div style="background:#191919;color:#fff;padding:28px 30px;"><div style="font-size:14px;font-weight:700;letter-spacing:2px;">CHORUS<span style="color:#999;">2026</span></div><div style="margin-top:34px;font-size:34px;line-height:1.05;font-weight:700;">You're<br><span style="color:#aaa;">registered.</span></div></div><div style="background:#fff;padding:32px 30px;"><p style="font-size:18px;margin:0 0 18px;">Hello ${name},</p><p style="font-size:15px;line-height:1.7;margin:0 0 24px;">Your registration for <strong>CHORUS 2026</strong> has been received successfully. We are looking forward to gathering with you.</p><table style="width:100%;border-collapse:collapse;margin:0 0 26px;">${detailRow("Event", "CHORUS 2026")}${detailRow("Date", "September 13, 2026")}${detailRow("Registration ID", registration.registration_id)}${detailRow("Phone", registration.phone)}${detailRow("Email", registration.email)}${detailRow("City", registration.city)}${detailRow("Church / Organization", registration.church)}${detailRow("Attending with", registration.attendance)}${detailRow("Group size", registration.group_size)}</table><p style="font-size:14px;line-height:1.7;color:#555;margin:0;">Please keep this email for your records. Your registration ID is your reference for CHORUS 2026.</p><p style="font-size:14px;line-height:1.7;margin:28px 0 0;">With warmth,<br><strong>The CHORUS 2026 / Echoverse Team</strong></p></div><div style="padding:18px 4px;color:#777;font-size:12px;text-align:center;">One sound. One spirit. One encounter.</div></div></body></html>`;

  return { from, to: [registration.email], subject, html };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");

    if (!apiKey) {
      throw new Error("Email service is not configured.");
    }

    const registration = validatePayload(await request.json());
    const response = await fetch(resendApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildEmail(registration, resendTestSender))
    });

    if (!response.ok) {
      console.error("Resend rejected confirmation email", response.status);
      return new Response(JSON.stringify({ error: "Confirmation email could not be sent." }), {
        status: 502,
        headers: corsHeaders
      });
    }

    const result = await response.json();
    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error("Confirmation email function failed", error instanceof Error ? error.message : error);
    return new Response(JSON.stringify({ error: "Confirmation email could not be sent." }), {
      status: 400,
      headers: corsHeaders
    });
  }
});