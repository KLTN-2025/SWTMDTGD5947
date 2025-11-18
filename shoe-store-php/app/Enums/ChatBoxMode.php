<?php

namespace App\Enums;

class ChatBoxMode
{
    public const AUTO_QA = 'auto_answer';
    public const SHOE_ADVISOR = 'shoe_advisor';
    public const SIZE_SUPPORT = 'size_support';
    public const ORDER_SUPPORT = 'order_support';

    public static function values(): array
    {
        return [
            self::AUTO_QA,
            self::SHOE_ADVISOR,
            self::SIZE_SUPPORT,
            self::ORDER_SUPPORT,
        ];
    }

    public static function labels(): array
    {
        return [
            self::AUTO_QA => 'Nhận tự động trả lời chat bot',
            self::SHOE_ADVISOR => 'Tư vấn chọn giày theo danh mục, sở thích',
            self::SIZE_SUPPORT => 'Hỗ trợ chọn size',
            self::ORDER_SUPPORT => 'Hỗ trợ đơn hàng',
        ];
    }

    public static function getLabel(string $mode): string
    {
        $labels = self::labels();
        return $labels[$mode] ?? $mode;
    }
}

