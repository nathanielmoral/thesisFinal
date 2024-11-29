<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Successful Payment</title>
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
        .email-body strong {
            color: #333;
        }
        .receipt-table {
            width: 100%;
            margin-top: 20px;
            border-collapse: collapse;
            background-color: #f9f9f9;
        }
        .receipt-table th, .receipt-table td {
            padding: 10px;
            text-align: center;
            border: 1px solid #ddd;
        }
        .receipt-table th {
            background-color: #F28705;
            color: #ffffff;
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
            .receipt-table th, .receipt-table td {
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section -->
        <div class="email-header">
            <h1>Payment Receipt</h1>
        </div>
        
        <!-- Body Section -->
        <div class="email-body">
            <p>Dear <strong>{{ $user->firstName ?? 'Valued Customer' }}</strong>,</p>

            <p>We are pleased to inform you that your payment has been approved. Below are the receipt details:</p>
            
            <!-- Receipt Table -->
            <table class="receipt-table" role="table" aria-label="Payment receipt details">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Payer Name</td>
                        <td>{{ $user->firstName }} {{ $user->lastName }}</td>
                    </tr>
                    <tr>
                        <td>Transaction Reference</td>
                        <td>{{ $transactionReference }}</td>
                    </tr>
                    <tr>
                        <td>Amount</td>
                        <td>₱{{ number_format($amount, 2) }}</td>
                    </tr>
                    <tr>
                        <td>Transaction Date</td>
                        <td>{{ $transactionDate }}</td>
                    </tr>
                    <tr>
                        <td>Period Covered</td>
                        <td>{{ $periodCovered }}</td>
                    </tr>
                </tbody>
            </table>

            <p>Thank you for your payment! If you have any questions, feel free to contact us.</p>
            
        </div>
    </div>
</body>
</html>
