<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đổi mật khẩu</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f6f8fa;
            color: #333;
            margin: 0;
            padding: 0;
        }

        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 10px;
            box-shadow: 0 0 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background-color: #2563eb;
            color: white;
            text-align: center;
            padding: 20px 0;
            font-size: 20px;
            font-weight: bold;
        }

        .content {
            padding: 30px;
            line-height: 1.6;
        }

        .btn {
            display: inline-block;
            background-color: #2563eb;
            color: white !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 20px;
        }

        .btn:hover {
            background-color: #1d4ed8;
        }

        .footer {
            text-align: center;
            color: #777;
            font-size: 13px;
            padding: 20px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>

<div class="email-container">
    <div class="header">
        Thông báo đổi mật khẩu
    </div>

    <div class="content">
        <p>Xin chào <strong>{{ $user->name ?? 'Người dùng' }}</strong>,</p>

        <p>Chúng tôi nhận được yêu cầu đổi mật khẩu cho tài khoản của bạn. 
        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>

        <p>Để tiếp tục đặt lại mật khẩu, hãy nhấn vào nút bên dưới:</p>

        <p style="text-align: center;">
            <a href="{{ $resetLink }}" class="btn">Đổi mật khẩu</a>
        </p>

        <p>Liên kết này sẽ hết hạn sau <strong>15 phút</strong> kể từ khi gửi.</p>

        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.<br>
        — <strong>{{ config('app.name') }}</strong></p>
    </div>

    <div class="footer">
        Email này được gửi tự động, vui lòng không trả lời.
    </div>
</div>

</body>
</html>
