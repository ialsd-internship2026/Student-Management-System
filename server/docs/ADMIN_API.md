# Student Management System – Admin API Documentation

## Base URL
`http://localhost:8080/api/admin`

All admin APIs require JWT Bearer Token authentication.

## 1. Get Admin Profile

- Method: GET
- Endpoint: `/profile`
- Authentication: Required

Response:
```json
{
  "message": "Admin profile fetched successfully",
  "admin": {
    "name": "Admin",
    "email": "admin@example.com",
    "about": "Administrator information",
    "profileImage": "uploads/admin/image.jpg"
  }
}
```

## 2. Update Admin Profile

- Method: PUT
- Endpoint: `/profile`
- Authentication: Required
- Body:
```json
{
  "name": "Admin Test",
  "about": "I am the administrator."
}
```

## 3. Change Admin Password

- Method: PUT
- Endpoint: `/change-password`
- Authentication: Required
- Body:
```json
{
  "currentPassword": "CurrentPassword",
  "newPassword": "NewPassword123"
}
```

New password must contain at least 8 characters.

## 4. Upload Admin Profile Image

- Method: POST
- Endpoint: `/upload-image`
- Authentication: Required
- Body: form-data
- Key: `profileImage`
- Type: File
- Allowed formats: JPG, PNG, WEBP
- Maximum size: 2 MB

## Authentication

Use the JWT token received after admin login.

Postman:
Authorization → Bearer Token → Paste Token

## Important

- All endpoints are under `/api/admin`.
- Only authenticated admins can access these endpoints.
- Do not share JWT tokens or passwords.