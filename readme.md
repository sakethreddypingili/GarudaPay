# GarudaPay Backend API Documentation

## Base URL

```
/api
```

Authentication is handled using a JWT stored in an HTTP-only cookie named `token`.

---

# Authentication API

Base Route:

```
/api/auth
```

## Register User

**POST** `/register`

### Request

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Response

```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

Creates a new account, hashes the password, stores the user, and issues a JWT cookie.

---

## Login

**POST** `/login`

### Request

```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Authenticates the user and issues a JWT cookie.

---

## Logout

**POST** `/logout`

Clears the authentication cookie.

---

## Get Current User

**GET** `/me`

Requires authentication.

### Response

```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "balance": 1000
  }
}
```

---

## Forgot Password

**POST** `/forgot-password`

### Request

```json
{
  "email": "john@example.com"
}
```

Generates a password reset token and sends a reset email.

---

## Reset Password

**POST** `/reset-password/:token`

### Request

```json
{
  "password": "newpassword123"
}
```

Updates the password and creates a new authenticated session.

---

# Wallet API

Base Route:

```
/api/wallet
```

> Demo Mode: Wallet endpoints may use a demo account when no authenticated user is available.

## Get User Wallet

**GET** `/user`

### Response

```json
{
  "name": "Demo User",
  "email": "demo@garudapay.com",
  "walletBalance": 1000,
  "walletStatus": "Active"
}
```

---

## Get Balance

**GET** `/balance`

### Response

```json
{
  "balance": 1000
}
```

---

## Top Up Wallet

**POST** `/topup`

### Request

```json
{
  "amount": 250,
  "method": "Card"
}
```

Adds funds to the wallet and records a transaction.

---

## Transfer Funds

**POST** `/transfer`

### Request

```json
{
  "amount": 100,
  "recipient": "Jane Doe"
}
```

Transfers funds and creates a debit transaction record.

---

## Wallet Summary

**GET** `/summary`

Returns recent wallet activity.

### Example

```json
[
  {
    "title": "UPI Transfer to Jane Doe",
    "amount": -100,
    "date": "2026-06-16 21:47",
    "transactionId": "GP-TX-4839"
  }
]
```

---

# Transaction API

Base Route:

```
/api/transaction
```

All routes require authentication.

---

## Transaction History

**GET** `/history`

### Query Parameters

| Parameter | Description                  |
| --------- | ---------------------------- |
| page      | Page number                  |
| limit     | Records per page (max 50)    |
| type      | credit / debit               |
| status    | pending / completed / failed |
| from      | Start date                   |
| to        | End date                     |
| search    | Search description           |

### Response

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCount": 24,
    "limit": 10
  }
}
```

---

## Get Transaction By ID

**GET** `/:id`

Returns transaction details if the authenticated user is involved in the transaction.

### Possible Responses

* `200 OK`
* `403 Forbidden`
* `404 Not Found`

---

## Export Transactions

**GET** `/export`

Exports filtered transaction history as a CSV file.

Supports the same filtering options as `/history`.

---

# Authentication Flow

1. Register or Login.
2. Server issues JWT in HTTP-only cookie.
3. Protected routes validate the cookie using middleware.
4. Logout clears the cookie.

---

# Tech Stack

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* bcryptjs
* Nodemailer

---

# Project Structure

```
src/
├── controllers/
│   ├── auth.controller.js
│   ├── wallet.controller.js
│   └── transaction.controller.js
│
├── routes/
│   ├── auth.routes.js
│   ├── wallet.routes.js
│   └── transaction.routes.js
│
├── middleware/
│   └── auth.middleware.js
│
└── server.js
```
