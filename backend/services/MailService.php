<?php

declare(strict_types=1);

/**
 * Minimal mail delivery for alert emails on shared hosting.
 *
 * Uses PHP mail() (Hostinger shared hosting routes it through the local MTA).
 * Entirely env-driven and fail-soft: when SECRETARY_ALERT_EMAIL / MAIL_FROM are
 * not configured, or mail() is unavailable/fails, the message is written to
 * storage/logs/mail.log and the caller continues — alert delivery must never
 * break device ingestion.
 */
class MailService
{
    /** Send an alert to the association secretary. Returns true when handed to the MTA. */
    public static function sendSecretaryAlert(string $subject, string $body): bool
    {
        $to = trim((string) config('app.secretary_alert_email', ''));
        if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            self::log('skipped (SECRETARY_ALERT_EMAIL not configured)', $subject);
            return false;
        }

        return self::send($to, $subject, $body);
    }

    public static function send(string $to, string $subject, string $body): bool
    {
        $to = trim($to);
        if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            self::log('skipped (invalid recipient)', $subject);
            return false;
        }

        $from = trim((string) config('app.mail_from', ''));
        $headers = ['Content-Type: text/plain; charset=utf-8', 'X-Mailer: OfficeGate'];
        if ($from !== '' && filter_var($from, FILTER_VALIDATE_EMAIL)) {
            $headers[] = 'From: ' . $from;
            $headers[] = 'Reply-To: ' . $from;
        }

        // Header-injection guard: subject must be a single line.
        $subject = trim(str_replace(["\r", "\n"], ' ', $subject));

        try {
            if (!function_exists('mail')) {
                self::log('failed (mail() unavailable)', $subject);
                return false;
            }

            $sent = @mail($to, $subject, $body, implode("\r\n", $headers));
            if (!$sent) {
                self::log("failed (mail() returned false) to={$to}", $subject);
                return false;
            }

            self::log("sent to={$to}", $subject);
            return true;
        } catch (Throwable $e) {
            self::log('failed (' . $e->getMessage() . ')', $subject);
            return false;
        }
    }

    private static function log(string $status, string $subject): void
    {
        $dir = STORAGE_PATH . '/logs';
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }

        @file_put_contents(
            $dir . '/mail.log',
            '[' . db_time() . "] {$status} subject=\"{$subject}\"" . PHP_EOL,
            FILE_APPEND
        );
    }
}
