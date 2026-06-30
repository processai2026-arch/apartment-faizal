<?php

declare(strict_types=1);

/**
 * Admin-managed user accounts (table: users).
 *
 * Extends CrudModel for list()/softDelete() but exposes admin-safe columns only
 * (password_hash is never returned). User creation/updates with password hashing
 * are handled in AdminUserController.
 */
class UserAccount extends CrudModel
{
    protected static string $table = 'users';
    protected static array $columns = ['name', 'email', 'phone', 'password_hash', 'role', 'office_id', 'status'];
    protected static array $searchColumns = ['name', 'email', 'phone'];
    protected static array $hidden = ['password_hash'];

    protected static function orderBy(): string
    {
        return 'ORDER BY id ASC';
    }

    /**
     * Admins manage security/tenant accounts here; admin accounts are listed but
     * protected from edit/delete in the controller. By default we exclude admins
     * from this management list to keep it focused on staff/tenant logins.
     */
    protected static function filters(Request $request): array
    {
        [$where, $params] = parent::filters($request);
        $clause = $where === '' ? 'WHERE ' : $where . ' AND ';
        // Only manage non-admin accounts through this endpoint.
        $clause .= "role IN ('security','tenant')";
        return [$clause, $params];
    }
}
