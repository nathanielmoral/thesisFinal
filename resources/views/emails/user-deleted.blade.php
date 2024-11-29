<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Deletion Notification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .email-container {
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background-color: #e74c3c;
            color: #ffffff;
            text-align: center;
            padding: 20px;
        }
        .email-header h1 {
            margin: 0;
            font-size: 24px;
        }
        .email-body {
            padding: 20px;
        }
        .email-body p {
            line-height: 1.6;
            margin: 10px 0;
        }
        .email-body strong {
            color: #333;
        }
        @media only screen and (max-width: 600px) {
            .email-header h1 {
                font-size: 20px;
            }
            .email-body {
                padding: 15px;
            }
            .email-body p {
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section -->
        <div class="email-header">
            <h1>Account Deletion Notice</h1>
        </div>

        <!-- Body Section -->
        <div class="email-body">
            <p>Dear <strong>{{ $firstName ?? 'Valued Customer' }}</strong>,</p>

            <p>We regret to inform you that your account associated with the email <strong>{{ $email }}</strong> has been deleted. If this was unexpected or you have any concerns, please contact our support team immediately.</p>

            <p>We appreciate the time you spent with us and are here to assist you if needed. Feel free to reach out to us for further information or help.</p>

            <p>Thank you,</p>
        </div>
    </div>
</body>
</html>
