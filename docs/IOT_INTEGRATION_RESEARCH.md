# IoT & Hardware Automation — Integration Research (OfficeGate)

Status: Research complete, foundational implementation shipped (see "What is implemented" at the end).
Scope: Automated fault detection for facility hardware (Lifts, Electrical Boards) using a LAN/Wi-Fi
hardware communication module with 16–26 I/O lines, alerting the association secretary by email and
raising alerts in the internal admin panel.

---

## 1. Constraint that drives everything: shared hosting

OfficeGate's backend is a custom PHP + MySQL API on Hostinger **shared hosting** (see
`docs/HOSTINGER_DEPLOYMENT.md`). That means:

| Capability | Available on shared hosting? |
|---|---|
| Inbound HTTPS (Apache → PHP) | Yes — this is the reliable channel |
| Hosting an MQTT broker | No (no long-running daemons) |
| Listening on raw TCP sockets / Modbus TCP server | No |
| Outbound HTTP from PHP (cURL) | Yes, but only while a request/cron runs |
| Cron jobs | Yes (Hostinger hPanel cron, minimum ~1 min interval) |
| WebSockets server | No |

**Conclusion:** the on-site hardware module must be the *client*. It **pushes** events to the
OfficeGate API over HTTPS (webhook style). The server never needs to reach into the building's LAN
(which is behind NAT anyway). A cron-driven "offline watchdog" covers the failure mode where the
device stops pushing. This is exactly the pattern hobbyist and industrial deployments use when the
cloud side is plain PHP/MySQL hosting ([Random Nerd Tutorials — ESP32 HTTP POST](https://randomnerdtutorials.com/esp32-http-get-post-arduino/),
[PHP+MySQL data logging with ESP boards](https://www.hackster.io/yilmazyurdakul/data-logging-with-php-mysql-esp8266-d00010)).

---

## 2. Survey: LAN/Wi-Fi I/O modules in the 16–26 I/O class

### 2.1 ESP32-based multi-I/O controllers (recommended class)

| Module | I/O | Connectivity | Protocols | Notes |
|---|---|---|---|---|
| **KinCony KC868-A16** | 16 opto-isolated digital inputs + 16 outputs (relay/MOSFET) + analog inputs = well above 26 usable lines | Ethernet **and** Wi-Fi, RS485 | HTTP, MQTT, TCP; flashable with ESPHome/Tasmota/Arduino | Best fit for the "16–26 I/O lines, LAN or Wi-Fi" requirement. Freely programmable, so it can `HTTP POST` JSON directly to our API. ([KinCony hardware details](https://www.kincony.com/esp32-board-16-channel-relay-hardware.html), [ESPHome device page](https://devices.esphome.io/devices/kincony-kc868-a16/), [shop](https://shop.kincony.com/products/kc868-a16-arduino-esp32-16-channel-gpio-module)) |
| KinCony KC868-A16v3 (ESP32-S3) | same class | Ethernet + Wi-Fi | same | Newer silicon ([product page](https://www.kincony.com/esp32-s3-16-channel-gpio-module.html)) |
| Generic ESP32 + I2C expanders (PCF8574/MCP23017) | any count | Wi-Fi (+Ethernet with LAN8720) | anything we program | Cheapest DIY option; the KC868 is essentially this, productized with opto-isolation and DIN enclosure |

### 2.2 Industrial Modbus TCP / RESTful I/O modules

| Module | I/O | Protocols | Notes |
|---|---|---|---|
| **Advantech ADAM-6050** | 12 DI + 6 DO (18 ch) | Modbus TCP, **MQTT(TLS), RESTful, SNMP** + built-in web page | Industrial grade; its RESTful/MQTT push ("data stream" / P2P) can target our webhook. ([Advantech](https://www.advantech.com/en-us/products/a67f7853-013a-4b50-9b20-01798c56b090/adam-6050/mod_b009c4b4-4b7c-4736-b16f-241978245e6a), [ADAM-6000 manual](https://advdownload.advantech.com/productfile/Downloadfile4/1-2B6FKTG/ADAM-6000_User_Manaul_Ed.12-FINAL.pdf)) |
| **Waveshare Modbus POE ETH Relay 16CH** | 16 relays (+DI variants) | Modbus TCP/RTU, **HTTP, MQTT**, PoE | Cheap industrial DIN-rail; HTTP/MQTT firmware variant can push state changes. ([wiki](https://www.waveshare.com/wiki/Modbus_POE_ETH_Relay_16CH), [HTTP variant wiki](https://www.waveshare.com/wiki/Modbus_POE_ETH_Relay_HTTP)) |
| **USR-IOT USR-M100/M300** | 2 DI + 2 AI + 2 relays on-board, expandable I/O modules | MQTT(S), HTTPS, Modbus RTU/TCP master, edge rules | "I/O + edge gateway" class: reads meters over RS485 and pushes to cloud endpoints; good when we also want voltage *measurements*, not just contacts. ([PUSR product page](https://www.pusr.com/products/remote-io-edge-gateway.html)) |
| Linortek Ultra 300 / smartDEN Maxi IoT | 8–16 mixed I/O | MQTT, HTTP | Same class, other vendors ([Linortek](https://www.linortek.com/ultra-300-ethernet-mqtt-i-o-controller/), [Denkovi](http://denkovi.com/smartden-maxi-iot-io-relay-module-mqtt-http-din-rail-box)) |

**Protocol reality check for our stack:**

- **HTTP(S) push** — works with shared hosting today. ✔ (chosen)
- **MQTT** — needs a broker. Shared hosting can't run one; would require an external managed broker
  (HiveMQ Cloud, EMQX Cloud) *plus* a cron bridge that pulls from the broker into MySQL. Deferred.
- **Modbus TCP** — the module is a *server* on the LAN; something must poll it from inside the LAN.
  Fine for an on-site gateway (ESP32/USR-M100 polling meters), not usable directly from Hostinger.
- **Raw TCP sockets** — same problem as Modbus; not usable from shared hosting.

### 2.3 How lift-fault and voltage signals are physically wired

**Lifts.** Virtually every lift controller exposes **volt-free (dry) contacts** for key states:
general fault, out-of-service, over-travel, door fault, passenger alarm/entrapment. Each dry contact
is wired to one opto-isolated digital input of the I/O module (contact closes → input goes active).
Commercial lift IoT products work the same way before moving up to CANbus/serial integrations
([Elevating Studio — lift remote monitoring](https://elevatingstudio.com/remote-monitoring-and-diagnostics-solutions-for-lifts/),
[KEB — remote monitoring for elevators](https://www.kebamerica.com/blog/remote-monitoring-for-elevators/),
[Elevator World — IoT lift monitoring](https://elevatorworld.com/article/benefits-of-iot-remote-lift-monitoring/)).

**Electrical boards / voltage fluctuation.** Two standard approaches, usually combined:

1. **Three-phase voltage monitoring relay (phase-failure relay)** on the board (e.g. GEYA, Minilec,
   Phoenix Contact EMD class). It trips its **dry contact** on under-voltage, over-voltage, phase
   loss, phase-sequence error or imbalance — that contact goes to a digital input, giving a binary
   "voltage abnormal" signal with zero firmware effort
   ([forumelectrical guide](https://forumelectrical.com/phase-failure-relay-voltage-monitoring-relay-complete-guide-for-three-phase-motor-protection/),
   [GEYA — what is a 3-phase monitoring relay](https://www.geya.net/what-is-a-three-phase-voltage-monitoring-relay/)).
2. **RS485 Modbus energy meter** (e.g. Eastron SDM630-Modbus: per-phase V/A/kW in ~100 registers,
   L1 voltage at register 0x0000, float32, 9600 8N1) polled by the on-site module over RS485 —
   both the KC868-A16 and USR-M100 have RS485. The module firmware compares voltage to thresholds
   (e.g. 230 V ±10%) and pushes a `voltage_fluctuation` event with the measured value
   ([SDM630 register map](https://www.modbuscloud.com/knowledge-base/eastron-sdm630-modbus-register-map),
   [SDM630 manual](https://www.photonicuniverse.com/upload/file/Manuals/Iconica/IC-METER/SDM630-Modbus_V2_user_manual.pdf)).

Option 1 gives instant events; option 2 adds real measurements for trending. Start with 1, add 2.

---

## 3. Recommended architecture for OfficeGate

**On-site module:** KinCony KC868-A16 (Ethernet preferred, Wi-Fi fallback) running custom
ESP32 firmware (Arduino/ESPHome). Digital inputs wired to lift dry contacts and a phase-failure
relay; optional RS485 to an SDM630 meter.

**Transport:** HTTPS `POST` to the OfficeGate API with a per-device secret token in the
`X-Device-Token` header. The device also posts a **heartbeat** every 60 s.

**Server:** shared-hosting PHP API (already implemented — see below):

- `POST /iot/ingest` — token-authenticated event ingestion; updates `last_seen_at`; persists to
  `iot_events`; on `warning`/`critical` severity creates internal panel notifications for all
  admins **and** emails the association secretary (`SECRETARY_ALERT_EMAIL`).
- Debounce / repeat-alert suppression **server-side**: an identical (device, event_type, io_line)
  alert within a cooldown window (default 15 min) is stored but does not re-send email/panel spam.
  The device should additionally debounce contacts in firmware (e.g. 500 ms) and only send on
  state *change*, not level.
- **Offline watchdog (cron fallback):** Hostinger cron hits the summary endpoint (or a small CLI
  script) every 5 min; any Active device with `last_seen_at` older than N minutes is flagged
  offline in the panel. Since the hardware pushes, no inbound polling of the building is needed —
  polling *from* the server is impossible through NAT anyway.

### 3.1 Data-flow diagram

```text
 BUILDING (on-site LAN)                                 HOSTINGER SHARED HOSTING
┌──────────────────────────────────────────────┐       ┌──────────────────────────────────────────┐
│                                              │       │                                          │
│  Lift controller ──dry contact──► DI-1..4    │       │   Apache + PHP (OfficeGate API)          │
│  (fault / out-of-service / door / alarm)     │       │                                          │
│                                              │ HTTPS │   POST /iot/ingest                       │
│  3-phase voltage ──dry contact──► DI-5       │ POST  │     ├─ auth: X-Device-Token              │
│  monitoring relay (under/over-V, phase loss) ├──────►│     ├─ INSERT iot_events                 │
│                                              │  JSON │     ├─ UPDATE iot_devices.last_seen_at   │
│  SDM630 energy meter ──RS485/Modbus RTU──┐   │       │     └─ severity ≥ warning:               │
│  (per-phase volts, amps, kW)             │   │       │         ├─ Notification → admin panel    │
│                                          ▼   │       │         └─ MailService → secretary email │
│  ┌────────────────────────────────────────┐  │       │                                          │
│  │ KC868-A16 (ESP32, 16 DI + 16 DO,       │  │       │   POST /iot/heartbeat  (every 60 s)      │
│  │ Ethernet/Wi-Fi, RS485)                 │  │       │     └─ UPDATE last_seen_at               │
│  │  - debounce inputs (500 ms)            │  │       │                                          │
│  │  - send on state change + heartbeats   │  │       │   Cron (5 min): offline watchdog         │
│  │  - buffer & retry on WAN loss          │  │       │     └─ last_seen_at > X min → offline    │
│  └────────────────────────────────────────┘  │       │                                          │
│              (behind NAT — always            │       │   React admin panel: /iot page           │
│               outbound, nothing exposed)     │       │   (devices, events, ack, setup guide)    │
└──────────────────────────────────────────────┘       └──────────────────────────────────────────┘
```

### 3.2 Device → server payload (implemented contract)

`POST https://<domain>/api/iot/ingest` with headers
`Content-Type: application/json` and `X-Device-Token: <48-hex-char device token>`:

```json
{
  "event_type": "voltage_fluctuation",
  "severity": "critical",
  "io_line": 5,
  "value": "252.4",
  "message": "L1 over-voltage: 252.4V (limit 245V)",
  "payload": { "l1": 252.4, "l2": 231.0, "l3": 229.8, "unit": "V" }
}
```

- `event_type`: `fault | voltage_fluctuation | status_change | heartbeat | test`
- `severity`: `info | warning | critical` (email + panel alert fire on `warning`/`critical`)
- `io_line`: which of the 16–26 lines triggered (optional)
- `value`: scalar reading as text (optional), `payload`: any JSON blob, stored verbatim (optional)

Heartbeat is the same endpoint with `{"event_type":"heartbeat"}` or the dedicated
`POST /iot/heartbeat` (body optional). Sample firmware call:

```bash
curl -X POST https://<domain>/api/iot/ingest \
  -H "Content-Type: application/json" \
  -H "X-Device-Token: <token shown once when the device is created in the panel>" \
  -d '{"event_type":"fault","severity":"critical","io_line":1,"message":"Lift 1 controller fault contact closed"}'
```

### 3.3 Alert routing

1. Event stored in `iot_events` (always, including suppressed repeats and heartbeats).
2. `warning`/`critical` and not suppressed →
   - `NotificationService`-style internal notification to every active admin user
     (appears in the existing Notification Center + bell badge), and
   - email via `MailService` (PHP `mail()`, env-driven `SECRETARY_ALERT_EMAIL`, `MAIL_FROM`;
     fail-soft: if disabled/unavailable it logs to `backend/storage/logs/mail.log` and never
     breaks ingestion).
3. Admin acknowledges the event in the panel (`acknowledged_at`/`acknowledged_by`), which clears it
   from the unacknowledged counter.

### 3.4 Why not MQTT / Modbus-first (for now)

- MQTT needs a broker we cannot host; a managed broker adds a monthly dependency and still needs a
  bridge into MySQL. Revisit if we outgrow webhook push (high event volumes, 2-way control).
- Modbus TCP requires a poller inside the LAN; the ESP32 module *is* that poller, so Modbus stays a
  local field bus (RS485 to meters), invisible to the server.
- Two-way control (server → relays) can later be done with the device long-polling
  a command queue endpoint — still shared-hosting compatible.

---

## 4. What is implemented in this codebase (foundation)

- Migration `backend/database/migrations/025_iot_devices.sql` — `iot_devices`, `iot_events`.
- `POST /iot/ingest`, `POST /iot/heartbeat` (public, rate-limited, `X-Device-Token` auth).
- Admin CRUD + events + acknowledge + summary under `/admin/iot/*` (admin role).
- `backend/services/MailService.php` — env-driven, fail-soft secretary alert mail.
- React page **IoT Monitoring** at `/iot` (Devices / Events / Setup Guide tabs), Zustand store,
  typed API client section.

## Sources

- KinCony KC868-A16: https://www.kincony.com/esp32-board-16-channel-relay-hardware.html , https://devices.esphome.io/devices/kincony-kc868-a16/
- Waveshare Modbus POE ETH Relay 16CH: https://www.waveshare.com/wiki/Modbus_POE_ETH_Relay_16CH , HTTP variant: https://www.waveshare.com/wiki/Modbus_POE_ETH_Relay_HTTP
- Advantech ADAM-6050 / ADAM-6000 series: https://www.advantech.com/en-us/products/a67f7853-013a-4b50-9b20-01798c56b090/adam-6050/mod_b009c4b4-4b7c-4736-b16f-241978245e6a , manual: https://advdownload.advantech.com/productfile/Downloadfile4/1-2B6FKTG/ADAM-6000_User_Manaul_Ed.12-FINAL.pdf
- USR-IOT USR-M100 edge I/O gateway: https://www.pusr.com/products/remote-io-edge-gateway.html
- Linortek Ultra 300 MQTT I/O: https://www.linortek.com/ultra-300-ethernet-mqtt-i-o-controller/ ; Denkovi smartDEN Maxi IoT: http://denkovi.com/smartden-maxi-iot-io-relay-module-mqtt-http-din-rail-box
- Lift IoT monitoring practice: https://elevatingstudio.com/remote-monitoring-and-diagnostics-solutions-for-lifts/ , https://www.kebamerica.com/blog/remote-monitoring-for-elevators/ , https://elevatorworld.com/article/benefits-of-iot-remote-lift-monitoring/
- Phase-failure / voltage monitoring relays: https://forumelectrical.com/phase-failure-relay-voltage-monitoring-relay-complete-guide-for-three-phase-motor-protection/ , https://www.geya.net/what-is-a-three-phase-voltage-monitoring-relay/
- Eastron SDM630 Modbus register map: https://www.modbuscloud.com/knowledge-base/eastron-sdm630-modbus-register-map , manual: https://www.photonicuniverse.com/upload/file/Manuals/Iconica/IC-METER/SDM630-Modbus_V2_user_manual.pdf
- ESP32 HTTP POST to PHP hosting: https://randomnerdtutorials.com/esp32-http-get-post-arduino/ , https://www.hackster.io/yilmazyurdakul/data-logging-with-php-mysql-esp8266-d00010
