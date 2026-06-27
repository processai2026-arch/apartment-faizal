<?php

declare(strict_types=1);

class AppException extends RuntimeException
{
    public function __construct(string $message, public int $status = 400, public array $context = [])
    {
        parent::__construct($message);
    }
}
