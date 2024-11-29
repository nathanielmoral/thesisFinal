<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Rejected</title>
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
            margin: 0 auto;
            background-color: #f4f4f4;
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
        .email-footer {
            text-align: center;
            font-size: 14px;
            color: #777;
            padding: 15px;
            border-top: 1px solid #eaeaea;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section -->
        <div class="email-header">
            <h1>Payment Rejected</h1>
        </div>

        <!-- Body Section -->
        <div class="email-body">
            <p>Dear <strong>{{ $user->firstName }}</strong>,</p>

            <p>We regret to inform you that your payment with the following details has been rejected:</p>
            
            <p><strong>Transaction Reference:</strong> {{ $transactionReference }}</p>
            <p><strong>Reason for Rejection:</strong> {{ $rejectReason }}</p>

            <p>If you have any questions or require further clarification, please do not hesitate to contact us.</p>
        </div>
    </div>
</body>
</html>
