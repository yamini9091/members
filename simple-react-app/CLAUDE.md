# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 **Project Overview**

Full-stack authentication and image processing application:
- **Frontend**: React 18 with Context API
- **Backend**: Express.js with JWT authentication
- **Database**: MongoDB Atlas
- **Image Processing**: Sharp.js (300MB max upload)

## 🚀 **Quick Start**

### Option 1: Manual Setup (Recommended for Development)
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev  # Runs on port 5001

# Terminal 2: Frontend
cd frontend
npm install
npm start    # Runs on port 3000
```

### Option 2: Using Helper Scripts
```bash
# Backend only
./run-backend.sh

# Frontend only  
./run-frontend.sh

# Check dependencies
./start.sh
```

**Environment Setup:**
- Copy `backend/.env.example` → `backend/.env`
- Update `MONGODB_URI` with your MongoDB Atlas connection string
- Set `JWT_SECRET` for production
- Ensure `.env` has all required variables

## 📁 **Project Structure**

```
backend/
├── routes/
│   ├── auth.js              (Auth endpoints - register, login, verify, reset password)
│   └── image.js             (Image processing - upload, process, delete, history)
├── models/
│   └── User.js              (MongoDB schema - users with images & actions array)
├── middleware/
│   ├── auth.js              (JWT protect, generateTokens, verifyRefreshToken)
│   └── validators.js        (Express-validator rules for all endpoints)
├── services/
│   └── imageService.js      (Centralized image processing utility)
├── utils/
│   ├── response.js          (ApiResponse handler - success/error responses)
│   └── email.js             (Email sending - verification, password reset)
├── server.js                (Express setup, middleware, route registration)
└── package.json

frontend/
├── src/
│   ├── pages/
│   │   └── Dashboard.js     (Main app - image upload, process, history)
│   ├── context/
│   │   └── AuthContext.js   (Global auth state - user, tokens, functions)
│   ├── services/
│   │   └── authService.js   (API calls - register, login, token refresh)
│   ├── styles/
│   │   └── Dashboard.css    (UI styling for all components)
│   └── App.js
└── package.json
```

## 🔑 **Key Architecture Decisions**

### **Service Layer Pattern**
All business logic moved to services, routes handle HTTP only:
- `services/authService.js` - Authentication (register, login, verify, reset)
- `services/imageOperationService.js` - Image operations (upload, process, delete)
- `services/userService.js` - User database operations
- `services/imageService.js` - Image processing (filters, format conversion)

**Why**: Single responsibility, testable, reusable, maintainable.

### **AsyncHandler (utils/asyncHandler.js)**
Global error wrapper eliminates try-catch in routes:
```javascript
exports.login = asyncHandler(async (req, res) => {
  // Errors caught automatically, no try-catch needed
  const result = await AuthService.login(email, password);
  ApiResponse.success(res, result, message);
});
```

**Why**: DRY principle, consistent error handling, cleaner code.

### **Message Constants (constants/messages.js)**
All error/success messages in one place:
```javascript
ApiResponse.error(res, AUTH_MESSAGES.INVALID_CREDENTIALS, 401, ERROR_CODES.INVALID_CREDENTIALS);
```

**Why**: Single source of truth, easy to update, facilitates i18n.

### **Response Handler (utils/response.js)**
All API responses use `ApiResponse` class for consistency:
```javascript
// Success
ApiResponse.success(res, data, message, statusCode)

// Error
ApiResponse.error(res, message, statusCode, code, errors)

// Validation
ApiResponse.validationError(res, errors)
```
**Why**: Eliminates repetitive JSON response code, ensures consistent structure.

### **Image Service (services/imageService.js)**
Centralized image operations to avoid duplication:
- `saveImage()` - Save buffer to disk
- `applyFilter()` - Apply grayscale, blur, brightness, etc.
- `convertFormat()` - Convert to JPEG/PNG/WebP
- `deleteFile()` - Safe file deletion
- `fileExists()` - File existence check

**Why**: Reduces code duplication, easier maintenance, single source of truth for image operations.

### **Validation Middleware (middleware/validators.js)**
Express-validator rules with custom error handling:
- Input validation (name, email, password)
- File validation (format, size)
- Operation validation (blur range, brightness range)

**Why**: Prevents invalid data early, before business logic, with clear error messages.

### **Token Management (middleware/auth.js)**
JWT handling with 24-hour access token expiry:
- `protect()` - Middleware to verify JWT
- `generateTokens()` - Create access + refresh tokens
- `verifyRefreshToken()` - Validate refresh token

**Why**: Secure, short-lived tokens, refresh flow prevents re-login on token expiry.

## 📁 **Updated Project Structure**

```
backend/
├── routes/              (Thin HTTP handlers only)
│   ├── auth.js          (68 lines - delegation to AuthService)
│   └── image.js         (73 lines - delegation to ImageOperationService)
│
├── services/            (Business logic layer)
│   ├── authService.js   (Register, login, verify, refresh, reset password)
│   ├── imageOperationService.js (Upload, process, delete, history)
│   ├── imageService.js  (Image processing - filters, format, metadata)
│   └── userService.js   (User operations - create, find, update, add images)
│
├── models/
│   ├── User.js          (User schema with images & actions)
│   └── Image.js         (Image binary storage with TTL)
│
├── middleware/
│   ├── auth.js          (JWT verify, token generation)
│   └── validators.js    (Input validation rules)
│
├── utils/
│   ├── asyncHandler.js  (Global error wrapper)
│   ├── response.js      (Unified response formatting)
│   ├── security.js      (Credential masking)
│   └── email.js         (Email sending)
│
├── constants/
│   └── messages.js      (All error/success messages & codes)
│
└── __tests__/
    ├── auth.test.js
    └── security.test.js
```

**Code Reduction**: Routes reduced from 545 lines → 141 lines (74% reduction). Logic extracted to reusable services.

## 🔐 **Authentication Flow**

```
1. Register
   ├─ Validate input (name, email, password)
   ├─ Check email exists
   ├─ Hash password (bcryptjs)
   ├─ Save to MongoDB
   ├─ Generate verification token
   └─ Send verification email

2. Login
   ├─ Validate input
   ├─ Find user by email
   ├─ Check account locked (5 failed attempts)
   ├─ Verify password
   ├─ Reset login attempts
   ├─ Generate JWT tokens (24h access, 30d refresh)
   └─ Return tokens + user data

3. Image Upload (Protected)
   ├─ Verify JWT token
   ├─ Validate file (JPEG/PNG, <300MB)
   ├─ Save to filesystem
   ├─ Extract metadata
   ├─ Store in MongoDB (user.images array)
   ├─ Log action in imageActions array
   └─ Return preview + metadata

4. Image Processing (Protected)
   ├─ Verify JWT token
   ├─ Verify image ownership
   ├─ Apply filters (blur, brightness, contrast, etc.)
   ├─ Convert format (JPEG/PNG/WebP)
   ├─ Log action
   └─ Return processed preview

5. Token Refresh
   ├─ Receive refresh token
   ├─ Verify refresh token
   ├─ Generate new access token
   └─ Return new token
```

## 💾 **Database Schema**

### **User Document**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  isEmailVerified: Boolean,
  emailVerificationToken: String,
  emailVerificationTokenExpire: Date,
  passwordResetToken: String,
  passwordResetTokenExpire: Date,
  lastLogin: Date,
  loginAttempts: Number (default: 0),
  lockUntil: Date,
  
  images: [{
    filename: String,
    size: Number,
    width: Number,
    height: Number,
    format: String,
    uploadedAt: Date
  }],
  
  imageActions: [{
    type: String (enum: 'upload', 'process', 'delete'),
    filename: String,
    operation: String (optional),
    details: Mixed (filters applied, format, etc.),
    timestamp: Date
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

## 🖼️ **Image Processing Operations**

| Operation | Input | Output | Use Case |
|-----------|-------|--------|----------|
| original | Image | Original image | View unmodified |
| grayscale | Image | Black & white | B&W conversion |
| blur | Image, 0-20px | Blurred | Blur effect |
| sharpen | Image | Sharpened | Edge enhancement |
| brightness | Image, 0.5-2.0 | Brighter/darker | Adjust brightness |
| contrast | Image, 0.5-2.0 | High/low contrast | Adjust saturation |
| rotate | Image | 90° rotated | Image rotation |
| thumbnail | Image | 200×200px | Preview |
| enhance | Image | Normalized | Auto-enhance |
| invert | Image | Negative | Invert colors |

**Format Conversion**: JPEG (default), PNG, WebP

## 🧪 **Automated Tests**

Run comprehensive authentication and security tests:
```bash
cd backend
npm test  # Runs all Jest tests in __tests__/ directory
```

**Tests Include**:
- ✅ User registration validation (valid/invalid inputs)
- ✅ User login with correct/incorrect credentials
- ✅ Email validation and normalization
- ✅ Password hashing and verification
- ✅ Credential protection (MongoDB URI, JWT secret masking)
- ✅ Token generation (access + refresh tokens)
- ✅ Account lockout after failed attempts
- ✅ Response sanitization (no sensitive data in errors)
- ✅ Data validation (name trimming, email lowercase)

**Key Security Tests**:
- MongoDB URI not exposed in error messages
- JWT secret masked in logs
- Sensitive keys protected by `SecurityUtils`
- Same password produces different hashes (bcrypt salt)
- Password matching verification

## 🧪 **Manual Testing Endpoints**

### **Register**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Pass123",
    "passwordConfirm": "Pass123"
  }'
```

### **Login**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Pass123"
  }'
```

### **Upload Image (Protected)**
```bash
curl -X POST http://localhost:5001/api/images/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

### **Process Image**
```bash
curl -X POST http://localhost:5001/api/images/process \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "1234567890-userid.jpg",
    "operation": "grayscale",
    "format": "jpeg"
  }'
```

## 🎯 **Code Quality Standards**

- **No magic numbers**: Use named constants
- **Dry principle**: Extract common patterns to utilities (ImageService, ApiResponse)
- **Error handling**: All operations have try-catch with specific error codes
- **Validation**: All inputs validated before processing
- **Logging**: Console logs for debugging (upload count, action types, errors)
- **Security**: JWT validation on protected routes, input sanitization, file validation

## 📝 **Common Patterns**

### **Database Operations**
```javascript
// Save with error handling
const user = await User.findById(userId);
if (!user) return ApiResponse.error(res, 'User not found', 404);
user.images.push(imageData);
await user.save();
```

### **Image Processing**
```javascript
// Use ImageService for consistency
const processed = await ImageService.applyFilter(buffer, operation, params);
const { processed: output, mimeType } = await ImageService.convertFormat(processed, format);
const preview = ImageService.bufferToBase64(output, mimeType);
```

### **Error Responses**
```javascript
// Use ApiResponse for consistency
ApiResponse.error(res, 'User-friendly message', statusCode, 'ERROR_CODE', errors);
```

## 🧹 **Code Quality & Cleanup**

**Removed Unnecessary Code**:
- Removed debug console.log statements from image upload
- Cleaned up warning logs in image processing
- Routes reduced by 74% (545 → 141 lines)
- Try-catch blocks reduced by 89% (9 → 1)

**Improved Logging**:
- All error logs use `SecurityUtils.sanitizeForLogging(error)`
- Prevents MongoDB credentials from appearing in logs
- Structured error logging with error codes
- Sensitive data masked in all console output

**Code Organization**:
- Service layer pattern: routes delegate to services
- AsyncHandler wrapper eliminates repetitive try-catch
- Centralized constants for all messages and error codes
- Clear separation: routes → services → models

## 🔑 **Logout Feature**

**POST /api/auth/logout** - Protected endpoint that clears all user data on logout:
- Deletes all image documents from Image collection
- Clears user.images array
- Clears user.imageActions array
- Privacy-focused: complete data cleanup after session
- Frontend calls this before clearing localStorage

**Example**:
```bash
curl -X POST http://localhost:5001/api/auth/logout \
  -H "Authorization: Bearer <token>"
```

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully. All image history cleared.",
  "data": {}
}
```

## 🚨 **Debugging Tips**

1. **Token issues**: Check `middleware/auth.js` for JWT verification
2. **Upload failures**: Check file size limit (300MB) and format (JPEG/PNG)
3. **Database errors**: Verify MongoDB URI in `.env` and IP whitelist in Atlas
4. **Image processing**: Check `services/imageService.js` for filter implementation
5. **Validation errors**: Check `middleware/validators.js` for validation rules
6. **Security logs**: All sensitive data is masked - use `SecurityUtils` for logging errors
7. **Test failures**: Run `npm test` to verify authentication and security logic

## 📚 **Related Files**

- `README.md` - User-facing documentation and API guide
- `.env` - Environment variables (not in git)
- `package.json` - Dependencies and scripts
