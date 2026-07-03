<?php

declare(strict_types=1);

/**
 * HomeAssistantService — thin server-side proxy to a client's Home Assistant
 * REST API (see docs/HOME_AUTOMATION_RESEARCH.md, phase 1).
 *
 * Every call is an outbound HTTPS request/response (cURL), which suits shared
 * PHP hosting: no daemons, no websockets. The client's long-lived access token
 * lives only in the DB and is sent as `Authorization: Bearer` here — it is never
 * returned to the browser (the browser calls our proxy, we call HA).
 *
 * A hub row is `HomeAutomationHub::rawFind()` output: it MUST include the raw
 * `base_url` and `access_token` columns.
 */
class HomeAssistantService
{
    /** Entity domains we ever read from HA. */
    public const READ_DOMAINS = ['light', 'switch', 'climate', 'cover', 'lock', 'sensor', 'binary_sensor'];

    /** Domain → services the proxy will forward. Defence in depth against a leaked panel session. */
    public const ALLOWED_SERVICES = [
        'light'   => ['turn_on', 'turn_off', 'toggle'],
        'switch'  => ['turn_on', 'turn_off', 'toggle'],
        'climate' => ['turn_on', 'turn_off'],
        'cover'   => ['open_cover', 'close_cover', 'stop_cover'],
        'lock'    => ['lock', 'unlock'],
    ];

    /**
     * Health probe: GET {base}/api/ returns {"message":"API running."} when the
     * token and URL are valid.
     */
    public function ping(array $hub): bool
    {
        try {
            [$code, $body] = $this->call($hub, 'GET', '/api/');
        } catch (AppException $e) {
            return false;
        }
        return $code >= 200 && $code < 300
            && is_array($body)
            && str_contains((string) ($body['message'] ?? ''), 'API running');
    }

    /**
     * All entity states in the whitelisted domains, normalised for the panel.
     *
     * @return array<int, array{entity_id:string,domain:string,friendly_name:string,state:string,unit:?string,updated_at:?string}>
     */
    public function states(array $hub): array
    {
        [$code, $body] = $this->call($hub, 'GET', '/api/states');
        if ($code < 200 || $code >= 300 || !is_array($body)) {
            throw new AppException('Home Assistant returned an unexpected response (HTTP ' . $code . ')', 502);
        }

        $out = [];
        foreach ($body as $entity) {
            if (!is_array($entity) || !isset($entity['entity_id'])) {
                continue;
            }
            $entityId = (string) $entity['entity_id'];
            $domain = self::domainOf($entityId);
            if (!in_array($domain, self::READ_DOMAINS, true)) {
                continue;
            }
            $attrs = is_array($entity['attributes'] ?? null) ? $entity['attributes'] : [];
            $out[] = [
                'entity_id'     => $entityId,
                'domain'        => $domain,
                'friendly_name' => (string) ($attrs['friendly_name'] ?? $entityId),
                'state'         => (string) ($entity['state'] ?? 'unknown'),
                'unit'          => isset($attrs['unit_of_measurement']) ? (string) $attrs['unit_of_measurement'] : null,
                'updated_at'    => isset($entity['last_updated']) ? (string) $entity['last_updated'] : null,
            ];
        }

        usort($out, fn ($a, $b) => [$a['domain'], $a['entity_id']] <=> [$b['domain'], $b['entity_id']]);
        return $out;
    }

    /**
     * Send a service call for a single entity, e.g. light/turn_on.
     * Validates domain+service against the whitelist before touching the network.
     */
    public function callService(array $hub, string $domain, string $service, string $entityId): void
    {
        $allowed = self::ALLOWED_SERVICES[$domain] ?? [];
        if (!in_array($service, $allowed, true)) {
            throw new AppException("Service '{$domain}.{$service}' is not permitted", 422);
        }
        if (self::domainOf($entityId) !== $domain) {
            throw new AppException('Entity id does not match the requested domain', 422);
        }

        [$code, $body] = $this->call($hub, 'POST', "/api/services/{$domain}/{$service}", ['entity_id' => $entityId]);
        if ($code < 200 || $code >= 300) {
            $msg = is_array($body) ? (string) ($body['message'] ?? 'command rejected') : 'command rejected';
            throw new AppException('Home Assistant rejected the command: ' . $msg, 502);
        }
    }

    public static function domainOf(string $entityId): string
    {
        $pos = strpos($entityId, '.');
        return $pos === false ? '' : substr($entityId, 0, $pos);
    }

    /**
     * Raw cURL call to the hub.
     *
     * @return array{0:int,1:mixed} [httpCode, decodedBody]
     */
    private function call(array $hub, string $method, string $path, array $data = []): array
    {
        $base = rtrim((string) ($hub['base_url'] ?? ''), '/');
        $token = (string) ($hub['access_token'] ?? '');

        if ($base === '' || $token === '') {
            throw new AppException('Home automation hub is not fully configured', 422);
        }
        // Only HTTPS is accepted (Nabu Casa / TLS reverse proxy). Localhost may use http for testing.
        if (!preg_match('#^https://#i', $base) && !preg_match('#^http://(localhost|127\.0\.0\.1)([:/]|$)#i', $base)) {
            throw new AppException('Hub base_url must be an https:// URL', 422);
        }

        $ch = curl_init();
        $options = [
            CURLOPT_URL            => $base . $path,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $token,
                'Content-Type: application/json',
                'Accept: application/json',
            ],
        ];

        if (strtoupper($method) === 'POST') {
            $options[CURLOPT_POST] = true;
            $options[CURLOPT_POSTFIELDS] = json_encode($data, JSON_THROW_ON_ERROR);
        }

        curl_setopt_array($ch, $options);
        $response = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new AppException('Could not reach the Home Assistant hub: ' . $curlError, 502);
        }
        if ($response === false) {
            throw new AppException('Empty response from the Home Assistant hub', 502);
        }

        $decoded = $response === '' ? [] : json_decode((string) $response, true);
        return [$httpCode, $decoded];
    }
}
