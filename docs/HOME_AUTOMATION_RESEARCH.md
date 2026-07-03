# Home Automation Integration Research (OfficeGate)

Goal: let OfficeGate **view and command home-automation devices** (lights, ACs, locks, sensors) for
clients/tenants who opt in, from the existing React admin/tenant panel backed by the shared-hosting
PHP API. This document surveys the realistic options and recommends a phased approach.

Constraint recap (same as IoT doc): the server is Hostinger shared PHP/MySQL hosting — no
long-running daemons, no MQTT broker, no WebSocket server. Outbound HTTPS from PHP (cURL) during a
request or cron run is fine. Client homes sit behind NAT, so *some* rendezvous point is always
needed: either the client's hub is reachable via a cloud relay/URL, or a vendor cloud API is used.

---

## 1. Options survey

### 1.1 Home Assistant (HA) — REST + WebSocket API  ★ recommended phase 1

Home Assistant is the de-facto open-source hub: it already integrates thousands of device brands
(Wi-Fi, Zigbee, Z-Wave, Tuya, Matter…) and exposes everything through one uniform API.

- **REST API** ([developer docs](https://developers.home-assistant.io/docs/api/rest/)):
  `GET /api/states` (all entities and their states), `GET /api/states/<entity_id>`,
  `POST /api/services/<domain>/<service>` (e.g. `light/turn_on` with
  `{"entity_id":"light.living_room"}`). Perfect for request/response PHP.
- **Auth**: user creates a **long-lived access token** in their HA profile page (valid 10 years);
  every call sends `Authorization: Bearer <token>`
  ([HA auth docs](https://developers.home-assistant.io/docs/api/rest/), [HTTP integration](https://www.home-assistant.io/integrations/http/)).
- **WebSocket API** ([docs](https://developers.home-assistant.io/docs/api/websocket/)) streams
  `state_changed` events — great for live dashboards, but needs a persistent connection, so on our
  stack it is a **browser-side** option only (the React app could connect directly to the client's
  HA WS endpoint), not a PHP-side one.
- **Reachability from our server** ([HA remote access docs](https://www.home-assistant.io/docs/configuration/remote/)):
  1. **Nabu Casa / Home Assistant Cloud** (~$6.5/mo, paid by the client): gives a stable
     `https://<hash>.ui.nabu.casa` URL that also serves the REST API — zero port-forwarding, TLS
     included ([Nabu Casa remote access](https://www.nabucasa.com/config/remote/),
     [community confirmation that the API works over the Nabu Casa URL](https://community.home-assistant.io/t/use-nabu-casa-url-to-use-ha-api/382563)).
  2. **Own reverse proxy / DDNS + TLS** (Nginx Proxy Manager, Cloudflare Tunnel, Tailscale Funnel):
     free but requires a technically able client; HA must be configured to trust the proxy
     ([methods compared](https://smarthomescene.com/top-picks/best-home-assistant-remote-access-methods-compared/)).

**Why it wins for us:** one integration covers every brand the client owns; the client keeps full
ownership of their hub; our server only stores `base_url` + token per client; plain HTTPS
request/response fits shared hosting exactly.

### 1.2 MQTT bridge  ★ recommended phase 2

Client-side hubs (HA, Zigbee2MQTT, ESPHome nodes) publish state and subscribe to command topics on
a **managed cloud broker** (HiveMQ Cloud / EMQX Cloud free tiers). Our side:

- PHP publishes one-shot commands over MQTT-over-TLS (or the broker's HTTP publish API, which
  EMQX/HiveMQ expose — best fit for PHP).
- A Hostinger **cron** job drains retained state topics / broker REST API into MySQL for display.

Pros: true push, many homes multiplexed on one broker, works when the client cannot expose any URL.
Cons: external dependency, eventual-consistency UI (cron granularity), more moving parts — hence
phase 2. ([ESPHome MQTT component](https://esphome.io/components/mqtt/))

### 1.3 Tuya / Smart Life cloud API

Huge installed base of cheap Wi-Fi devices already speak Tuya's cloud. Tuya's IoT platform offers
[OpenAPI device control](https://developer.tuya.com/en/docs/cloud/device-control?id=K95zu01ksols7):
signed HTTPS calls (HMAC-SHA256, access_id/secret) to query status and send commands
([Open APIs overview](https://developer.tuya.com/en/docs/iot/open-apis?id=Kaiuyvvxud2le)).

- Pros: no hardware to install for clients who already use Smart Life; pure server-to-cloud HTTPS.
- Cons: developer account/plan required (trial tiers expire and need renewal), per-region data
  centers, request signing is fiddly, only Tuya-ecosystem devices, cloud outage = no control.
- Verdict: good **optional connector later**, behind the same abstraction as HA. Not the backbone.

### 1.4 Matter

Matter unifies device *commissioning and control* at the LAN level (IPv6 + mDNS), but a Matter
**controller must live inside the home fabric** — a remote PHP server cannot be one
([HA Matter integration](https://www.home-assistant.io/integrations/matter/),
[Matter's LAN assumptions](https://matterbridge.io/README.html)). Practical takeaway: Matter is a
*device-acquisition* story — the client's HA instance acts as the Matter controller, and we still
talk to HA. No direct Matter work needed on our side.

### 1.5 ESPHome

For custom/DIY devices (our own KC868-class boards in client homes). ESPHome nodes either join the
client's HA (then covered by 1.1) or speak MQTT (then covered by 1.2)
([ESPHome MQTT](https://esphome.io/components/mqtt/)). No separate integration required.

---

## 2. Recommended phased approach

### Phase 1 — Home Assistant REST connector (per client)

What the client installs:
1. **Home Assistant** (Green box, Raspberry Pi, or any mini PC) and pairs their devices with it.
2. Remote reachability: **Nabu Casa subscription** (easiest, recommended) or their own
   HTTPS reverse proxy / Cloudflare Tunnel.
3. Creates a **long-lived access token** (Profile → Security → Long-lived access tokens) and gives
   OfficeGate the pair: `base_url` + `token`.

What we build server-side:
- `home_automation_accounts` table: `client_user_id`, `base_url`, `api_token` (encrypted at rest),
  `status`, `last_checked_at`.
- Thin PHP proxy endpoints (admin/tenant role + ownership checks):
  - `GET  /ha/entities`  → cURL `GET {base}/api/states` (filter to whitelisted domains:
    `light`, `switch`, `climate`, `cover`, `lock`, `sensor`)
  - `POST /ha/command`   → cURL `POST {base}/api/services/{domain}/{service}` with `entity_id`
  - `GET  /ha/health`    → `GET {base}/api/` ("API running" check), cron-refreshed
- The browser never sees the client's token; all calls are proxied by our API (also solves CORS).
- Reuse of this codebase's `iot_devices` pattern: a device row with `device_type='gateway'`,
  `protocol='http'` can represent the client's HA bridge in the same admin UI.

Latency/limits: each panel refresh is 1 proxied HTTPS round trip; fine for a control page,
not for millisecond dashboards. For live view later, the React app can open the **WebSocket API**
directly to the client's Nabu Casa URL with a scoped token (browser-side, keeps shared hosting out
of the loop) ([WS docs](https://developers.home-assistant.io/docs/api/websocket/)).

### Phase 2 — MQTT bridge (scale + push)

- Managed broker (EMQX Cloud / HiveMQ Cloud) with per-client credentials + topic ACLs
  (`officegate/<client_id>/#`).
- Client HA publishes state via its MQTT integration; commands flow back on
  `officegate/<client_id>/cmd/...`.
- Our cron ingests retained states into MySQL every minute → panel shows near-live state without
  hammering client hubs; commands published via the broker's HTTP API from PHP.

### Phase 3 (optional) — vendor-cloud connectors

Tuya OpenAPI connector for Smart-Life-only clients, behind the same internal abstraction
("account → entities → command"), so the frontend does not care which backend serves a device.

---

## 3. Security checklist

- **Token storage:** HA long-lived tokens and Tuya secrets are bearer credentials — store encrypted
  (e.g. libsodium `sodium_crypto_secretbox` with a key in `.env`, never in the repo), never return
  them in API responses after creation (same "show once" pattern used for our IoT device tokens),
  and support revocation (client can delete the token in HA at any time).
- **TLS everywhere:** only accept `https://` base URLs; reject plain HTTP except localhost testing.
  Nabu Casa URLs are TLS by default.
- **Least privilege:** in HA, create a dedicated **restricted user** for OfficeGate and generate
  the token under that user, so exposure is limited to permitted entities.
- **Scope filtering server-side:** whitelist entity domains and specific entity_ids per client in
  our DB; the proxy refuses commands outside the whitelist (defence in depth against a leaked
  panel session).
- **Network reachability:** never require port-forwarding of raw HA (8123) to the internet without
  TLS + auth; prefer Nabu Casa or Cloudflare Tunnel. Our server initiates all connections outbound.
- **Audit:** log every command (`who`, `client`, `entity`, `service`, timestamp) via the existing
  `AuditService`.
- **Rate limiting:** apply `RateLimitMiddleware` to proxy endpoints to protect both us and the
  client's hub.

## 4. What the client must install (summary card)

| Tier | Client installs | Monthly cost | Effort |
|---|---|---|---|
| Phase 1 (recommended) | Home Assistant hub + Nabu Casa | ~US$6.5 (Nabu Casa) | Low — guided setup, 1 token handover |
| Phase 1 (self-hosted) | HA + Cloudflare Tunnel / reverse proxy | 0 | Medium — needs a technical user |
| Phase 2 | Same + MQTT integration enabled | 0 (broker paid by us) | Low |
| Tuya-only fallback | Nothing new (existing Smart Life devices) | 0 for client | Low for client, medium for us |

## Sources

- Home Assistant REST API: https://developers.home-assistant.io/docs/api/rest/
- Home Assistant WebSocket API: https://developers.home-assistant.io/docs/api/websocket/
- HA remote access options: https://www.home-assistant.io/docs/configuration/remote/
- Nabu Casa remote access: https://www.nabucasa.com/config/remote/
- Nabu Casa URL + API usage: https://community.home-assistant.io/t/use-nabu-casa-url-to-use-ha-api/382563
- HA HTTP integration / reverse proxy trust: https://www.home-assistant.io/integrations/http/
- Remote-access methods compared: https://smarthomescene.com/top-picks/best-home-assistant-remote-access-methods-compared/
- Tuya Open APIs: https://developer.tuya.com/en/docs/iot/open-apis?id=Kaiuyvvxud2le
- Tuya device control API: https://developer.tuya.com/en/docs/cloud/device-control?id=K95zu01ksols7
- HA Matter integration: https://www.home-assistant.io/integrations/matter/
- Matterbridge (Matter's LAN/mDNS constraints): https://matterbridge.io/README.html
- ESPHome MQTT client: https://esphome.io/components/mqtt/
