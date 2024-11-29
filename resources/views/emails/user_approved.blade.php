<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Created</title>
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
        .credentials-table {
            width: 100%;
            margin-top: 20px;
            border-collapse: collapse;
            background-color: #f9f9f9;
        }
        .credentials-table th, .credentials-table td {
            padding: 10px;
            text-align: center;
            border: 1px solid #ddd;
        }
        .credentials-table th {
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
            .credentials-table th, .credentials-table td {
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section -->
        <div class="email-header">
            <h1>Welcome to Our System!</h1>
        </div>
        
        <!-- Body Section -->
        <div class="email-body">
            <p>Dear <strong>{{ $user->firstName }} {{ $user->lastName }}</strong>,</p>

            <p>Your account has been successfully created. Below are your login credentials:</p>
            
            <!-- Credentials Table -->
            <table class="credentials-table" role="table" aria-label="Account credentials">
                <thead>
                    <tr>
                        <th>Field</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Email</td>
                        <td>{{ $user->email }}</td>
                    </tr>
                    <tr>
                        <td>Temporary Password</td>
                        <td>{{ $password }}</td>
                    </tr>
                </tbody>
            </table>

            <p>
                Please <strong>change your password</strong> after logging in for the first time to ensure account security.
            </p>
            <p>
                If you have any questions or encounter any issues, please feel free to contact us.
            </p>
        </div>
    </div>
</body>
</html>
