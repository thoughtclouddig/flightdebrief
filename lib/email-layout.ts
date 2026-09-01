import { appOrigin } from "@/lib/email-origin";

/**
 * Shared chrome for every transactional email we send.
 *
 * Email is not the web. The rules that shape everything below:
 *
 * - Tables, not divs. Outlook renders through Word, which ignores max-width
 *   on a div -- the previous templates stretched edge to edge there.
 * - Inline styles only. Gmail strips <style> blocks in several contexts, so
 *   anything that must hold has to live on the element.
 * - Images are blocked by default in most clients on first open, so the logo
 *   can never be the only thing identifying us. The alt text is styled to
 *   read as the wordmark when the image doesn't load, and the heading below
 *   carries the message on its own.
 * - A preheader is the gray snippet beside the subject in the inbox list.
 *   Left unset, clients scrape the first text they find (previously the
 *   heading, repeated). It's the second thing a recipient reads and it was
 *   being wasted.
 * - color-scheme + a hard background: Gmail and Apple Mail auto-invert
 *   unstyled mail in dark mode, which was turning #101727 body text
 *   invisible against the inverted surface.
 */

const BRAND = "#f07621";
const INK = "#101727";
const MUTED = "#56636f";
const HAIRLINE = "#e4e7ea";
const PAGE = "#f4f5f6";

/** Arial-first: the brand faces aren't webfont-safe in email, and a failed webfont costs more than it gains. */
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,Helvetica,sans-serif";

export interface EmailContent {
  /** Inbox-list snippet. Say something the subject doesn't already say. */
  preheader: string;
  heading: string;
  /** Paragraphs above the button. Pre-escaped HTML. */
  body: string[];
  cta?: { label: string; url: string };
  /** Small print under the button -- expiry, "ignore this if it wasn't you". */
  footnote?: string;
}

function p(html: string, color = INK): string {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${color}">${html}</p>`;
}

export function renderEmail(content: EmailContent): string {
  const origin = appOrigin();
  const logo = origin ? `${origin}/brand/afterflight-lockup-dark.png` : null;

  const logoCell = logo
    // Explicit width AND height: Outlook reserves no space without both and
    // reflows the header when the image finally loads. Source is 1000x159, so
    // 160x25 keeps the ratio exactly and stays sharp on retina.
    // The style block is the images-blocked fallback -- the alt text renders
    // in its place, so it's typeset to read as the wordmark rather than as
    // bare 12px browser default.
    ? `<img src="${logo}" width="160" height="25" alt="AfterFlight" style="display:block;border:0;width:160px;max-width:160px;height:auto;font-family:${FONT};font-size:18px;font-weight:700;color:${INK};text-decoration:none">`
    : `<span style="font-family:${FONT};font-size:18px;font-weight:700;color:${INK}">AfterFlight</span>`;

  const button = content.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">
         <tr>
           <td bgcolor="${BRAND}" style="border-radius:8px">
             <a href="${content.cta.url}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">${content.cta.label}</a>
           </td>
         </tr>
       </table>
       <!-- Some clients strip or fail to render the button; never leave the link unreachable. -->
       ${p(
         `<span style="font-size:13px;color:${MUTED}">Or paste this into your browser:<br><a href="${content.cta.url}" style="color:${BRAND};word-break:break-all">${content.cta.url}</a></span>`,
       )}`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${content.heading}</title>
</head>
<body style="margin:0;padding:0;background:${PAGE};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${PAGE}">${content.preheader}&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${PAGE}">
  <tr>
    <td align="center" style="padding:32px 16px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid ${HAIRLINE}">
        <!-- Thin brand rule rather than an orange banner: this is a utility
             message, and a full color block reads as marketing. -->
        <tr><td style="height:4px;background:${BRAND};border-radius:12px 12px 0 0;font-size:0;line-height:0">&nbsp;</td></tr>
        <tr>
          <td style="padding:28px 32px 0">${logoCell}</td>
        </tr>
        <tr>
          <td style="padding:24px 32px 32px">
            <h1 style="margin:0 0 20px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:700;color:${INK}">${content.heading}</h1>
            ${content.body.map((line) => p(line)).join("")}
            ${button}
            ${content.footnote ? p(`<span style="font-size:13px;color:${MUTED}">${content.footnote}</span>`) : ""}
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px">
        <tr>
          <td style="padding:20px 32px;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED}">
            AfterFlight — get better every flight.<br>
            You're receiving this because someone used this address to sign in to or join an AfterFlight account.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * Greetings use the first name only -- signup collects a full name, so
 * "Hi Bob Eagle," read like a form letter. Falls back to the whole string if
 * there's no space, and to "there" if we have nothing usable.
 */
export function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || "there";
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
