<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Holder Updated</title>
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
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background-color: #F28705;
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
        @media only screen and (max-width: 600px) {
            .email-header h1 {
                font-size: 20px;
            }
            .email-body {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section -->
        <div class="email-header">
            <h1>Account Holder Updated</h1>
        </div>
        
        <!-- Body Section -->
        <div class="email-body">
            <p>Dear <strong>{{ $firstName }} {{ $lastName }}</strong>,</p>
            <p>We are pleased to inform you that you have been updated as the account holder for:</p>
            <ul>
                <li><strong>Block:</strong> {{ $block }}</li>
                <li><strong>Lot:</strong> {{ $lot }}</li>
            </ul>
            <p>If you have any questions, feel free to contact us.</p>
            <p>Thank you!</p>
        </div>
    </div>
</body>
</html>
