# Offera AI (offers assistant)

A floating assistant on the public pages, like Rufus on Amazon, but for OfferBuzz offers. It recommends the best live
offers near the visitor and answers **only** questions about offers.

## How it works
1. The browser sends the last few messages and, only if the visitor allowed it, their latitude/longitude to `POST /api/v1/ai/chat`.
2. The API loads the live offers: within 20 km of the visitor (nearest first), or the newest offers if the location is
   unknown or nothing is nearby. The category being asked about is listed first, and better deals rank higher.
3. Those offers (at most 25, text trimmed) go to Groq as the only facts the model may use.
4. The reply is checked before it is shown: offer ids the model made up are dropped, long wandering answers are
   replaced, and a question that is not about offers gets a fixed refusal ("I can only help with offers...").

## Offers only (enforced three ways)
- The system prompt limits it to the offers list and tells it to mark anything else `onTopic: false`.
- The server replaces any off-topic answer with fixed text and sends no offers, so the model never gets to answer it.
- Recommended offers must exist in the list the server provided.

## Fallback models
`GROQ_MODELS` (comma separated, first = preferred). A model that returns 429 (rate limit), 5xx, 400/404 (retired) or
times out is skipped and rested (the `retry-after` time for 429, an hour for a retired model), and the next one is
tried. If every model fails, or there is no `GROQ_API_KEY`, the assistant still answers from the offers directly
(`source: "basic"`), so the chat never dead-ends.

## Limits
15 requests per minute per IP (`aiLimiter`), messages limited to 500 characters, 10 messages per request.

## Setup
1. Free key: https://console.groq.com -> API Keys.
2. Set `GROQ_API_KEY` on the Catalyst API (and in `.env` locally). Optional: `GROQ_MODELS`.
3. Groq retires models from time to time; if replies fall back to `basic`, check the model names in the Groq console.

## Files
`apps/api/src/modules/ai/` (service + route), `apps/api/src/services/groq.ts` (model chain),
`apps/web/src/components/agent/OfferaAI.tsx` (chat), `OfferaMark.tsx` (the SVG logo).
