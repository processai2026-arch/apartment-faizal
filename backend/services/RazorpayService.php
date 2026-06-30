<?php

declare(strict_types=1);

/**
 * RazorpayService — raw HTTP integration with the Razorpay API.
 *
 * No PHP SDK is used; all calls are made via cURL with Basic Auth.
 * Keys are always read from config (never hardcoded).
 */
class RazorpayService
{
    private const BASE_URL = 'https://api.razorpay.com/v1';

    private string $keyId;
    private string $keySecret;
    private string $webhookSecret;

    public function __construct()
    {
        $this->keyId          = (string) config('app.razorpay_key_id');
        $this->keySecret      = (string) config('app.razorpay_key_secret');
        $this->webhookSecret  = (string) config('app.razorpay_webhook_secret');
    }

    /**
     * Create a Razorpay order.
     *
     * @param  int    $amountPaise  Amount in smallest currency unit (paise for INR).
     * @param  string $currency     ISO 4217 currency code, default 'INR'.
     * @param  string $receiptId    Your internal identifier (invoice id / no).
     * @param  array  $notes        Optional key-value notes passed to Razorpay.
     * @return array  Decoded Razorpay order object.
     * @throws AppException on API failure.
     */
    public function createOrder(int $amountPaise, string $currency, string $receiptId, array $notes = []): array
    {
        if (empty($this->keyId) || empty($this->keySecret)) {
            throw new AppException('Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env', 503);
        }

        return $this->apiRequest('POST', '/orders', [
            'amount'          => $amountPaise,
            'currency'        => $currency,
            'receipt'         => $receiptId,
            'notes'           => $notes,
            'partial_payment' => false,
        ]);
    }

    /**
     * Verify the payment signature returned by the Razorpay checkout widget.
     *
     * Razorpay signs: HMAC-SHA256( orderId + '|' + paymentId , keySecret )
     */
    public function verifySignature(string $orderId, string $paymentId, string $signature): bool
    {
        $expectedSignature = hash_hmac(
            'sha256',
            $orderId . '|' . $paymentId,
            $this->keySecret
        );
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Verify an incoming webhook signature.
     *
     * Razorpay signs the raw request body with the webhook secret.
     */
    public function verifyWebhookSignature(string $rawBody, string $headerSignature): bool
    {
        if (empty($this->webhookSecret)) {
            // If no webhook secret is configured, skip verification (log a warning).
            error_log('[RazorpayService] WARNING: RAZORPAY_WEBHOOK_SECRET is not set — skipping webhook signature check.');
            return true;
        }
        $expected = hash_hmac('sha256', $rawBody, $this->webhookSecret);
        return hash_equals($expected, $headerSignature);
    }

    /**
     * Fetch full payment details from Razorpay.
     *
     * @param  string $paymentId  Razorpay payment ID (pay_xxx).
     * @return array  Decoded payment object.
     * @throws AppException on API failure.
     */
    public function fetchPayment(string $paymentId): array
    {
        return $this->apiRequest('GET', '/payments/' . urlencode($paymentId));
    }

    /**
     * Initiate a refund for a captured payment.
     *
     * @param  string $paymentId   Razorpay payment ID.
     * @param  int    $amountPaise Amount to refund in paise (full amount if omitted or 0).
     * @return array  Decoded refund object.
     * @throws AppException on API failure.
     */
    public function initiateRefund(string $paymentId, int $amountPaise = 0): array
    {
        $payload = [];
        if ($amountPaise > 0) {
            $payload['amount'] = $amountPaise;
        }
        return $this->apiRequest('POST', '/payments/' . urlencode($paymentId) . '/refund', $payload);
    }

    // ── Private helpers ─────────────────────────────────────────────────────────

    /**
     * Reusable cURL helper for Razorpay API requests.
     *
     * @throws AppException on non-2xx HTTP response or cURL error.
     */
    private function apiRequest(string $method, string $path, array $data = []): array
    {
        $url = self::BASE_URL . $path;
        $ch  = curl_init();

        $options = [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_USERPWD        => $this->keyId . ':' . $this->keySecret,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Accept: application/json',
            ],
        ];

        switch (strtoupper($method)) {
            case 'POST':
                $options[CURLOPT_POST]       = true;
                $options[CURLOPT_POSTFIELDS] = json_encode($data, JSON_THROW_ON_ERROR);
                break;

            case 'GET':
                if ($data) {
                    $options[CURLOPT_URL] = $url . '?' . http_build_query($data);
                }
                break;

            default:
                $options[CURLOPT_CUSTOMREQUEST] = strtoupper($method);
                if ($data) {
                    $options[CURLOPT_POSTFIELDS] = json_encode($data, JSON_THROW_ON_ERROR);
                }
        }

        curl_setopt_array($ch, $options);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new AppException('Razorpay API connection failed: ' . $curlError, 503);
        }

        if ($response === false || $response === '') {
            throw new AppException('Empty response from Razorpay API', 503);
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            throw new AppException('Invalid JSON response from Razorpay API', 503);
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            $errMsg = $decoded['error']['description'] ?? ($decoded['error']['code'] ?? 'Razorpay API error');
            throw new AppException($errMsg, $httpCode >= 400 && $httpCode < 500 ? 422 : 503);
        }

        return $decoded;
    }
}
