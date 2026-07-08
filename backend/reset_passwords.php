<?php
// Run this via: php reset_passwords.php
// Place in backend/ folder on server then delete after use
require_once __DIR__ . '/core/bootstrap.php';

$hash = password_hash('OfficeGate@2026', PASSWORD_BCRYPT, ['cost' => 12]);

$emails = [
    'superadmin@officegate.local',
    'admin@officegate.com',
    'security@officegate.com',
    'tenant@officegate.com',
];

foreach ($emails as $email) {
    Database::query(
        'UPDATE users SET password_hash = :hash WHERE email = :email AND deleted_at IS NULL',
        ['hash' => $hash, 'email' => $email]
    );
    echo "Updated: $email\n";
}
echo "All passwords set to: OfficeGate@2026\n";
echo "Delete this file now!\n";
