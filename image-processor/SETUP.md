# 🚀 Image Processor Setup Guide

Complete setup instructions for the Flask Image Processor application.

## Prerequisites

- **Python 3.8+** - Download from https://www.python.org/
- **pip** - Python package manager (included with Python)
- **Git** - Version control (optional)
- **100MB+ Disk Space** - For application and uploads

## Step 1: Clone or Download

### Option A: Using Git
```bash
git clone <repository-url>
cd image-processor
```

### Option B: Manual Download
1. Download the project files
2. Extract to desired location
3. Open terminal/command prompt in the directory

## Step 2: Create Virtual Environment

A virtual environment isolates project dependencies.

### macOS/Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

### Windows (Command Prompt)
```bash
python -m venv venv
venv\Scripts\activate
```

### Windows (PowerShell)
```bash
python -m venv venv
venv\Scripts\Activate.ps1
```

You should see `(venv)` in your terminal prompt.

## Step 3: Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**What gets installed:**
- Flask 3.0.0 - Web framework
- Pillow 10.0.0 - Image processing
- OpenCV 4.8.0.76 - Computer vision (for future features)
- numpy 1.24.3 - Numerical computing
- python-dotenv 1.0.0 - Environment configuration

**Installation time:** 2-5 minutes (depending on internet speed)

## Step 4: Verify Installation

Check that dependencies are installed:

```bash
pip list
```

You should see:
```
Flask                    3.0.0
Pillow                   10.0.0
opencv-python            4.8.0.76
numpy                    1.24.3
python-dotenv            1.0.0
Werkzeug                 3.0.0
```

## Step 5: Run the Application

```bash
python app.py
```

You should see:
```
🚀 Flask Image Processor starting...
📁 Upload folder: app/uploads
📁 Temp folder: app/temp
📊 Max file size: 30MB
🔒 Rate limit: 30 requests per minute per IP
📷 Allowed formats: jpeg, jpg, png
🚫 Blocked formats: gif

✅ Server running on http://localhost:5000
```

## Step 6: Access the Application

Open your web browser and navigate to:

**http://localhost:5000**

You should see the Image Processor interface with:
- Drag & drop upload area
- Status bar showing server status
- Configuration information

## Configuration

### Change Upload Port

Edit `app.py` and modify the last line:

```python
# Default: port 5000
app.run(debug=True, host='localhost', port=5000)

# Change to different port
app.run(debug=True, host='localhost', port=5001)
```

### Change File Size Limit

Edit `MAX_FILE_SIZE` in `app.py`:

```python
# Default: 30MB
MAX_FILE_SIZE = 30 * 1024 * 1024

# Change to 50MB
MAX_FILE_SIZE = 50 * 1024 * 1024
```

### Change Rate Limit

Edit `RATE_LIMIT_REQUESTS` in `app.py`:

```python
# Default: 30 requests per minute
RATE_LIMIT_REQUESTS = 30

# Change to 60 requests per minute
RATE_LIMIT_REQUESTS = 60
```

### Add New Image Format

Edit `ALLOWED_EXTENSIONS` in `app.py`:

```python
# Default: JPEG, PNG
ALLOWED_EXTENSIONS = {'jpeg', 'jpg', 'png'}

# Add WebP support
ALLOWED_EXTENSIONS = {'jpeg', 'jpg', 'png', 'webp'}
```

## Testing

### Test 1: Basic Upload
1. Go to http://localhost:5000
2. Click or drag an image (JPEG/PNG)
3. Image should appear in preview
4. File info should be displayed

### Test 2: File Type Validation
1. Try uploading a GIF file
2. Should get error: "GIF files are not allowed"

### Test 3: File Size Validation
1. Try uploading a file larger than 30MB
2. Should get error: "File size exceeds 30MB limit"

### Test 4: Rate Limiting
1. Upload 30 images within 60 seconds
2. On 31st upload, should get error: "Rate limit exceeded"

### Test 5: Cleanup
1. Upload an image
2. Click "Clear & Upload New"
3. File should be deleted from server

## Troubleshooting

### "Port 5000 already in use"

**Error:**
```
OSError: [Errno 48] Address already in use
```

**Solution:**
```bash
# Kill process using port 5000
lsof -i :5000
kill -9 <PID>

# Or change port in app.py
app.run(debug=True, host='localhost', port=5001)
```

### "Module not found"

**Error:**
```
ModuleNotFoundError: No module named 'flask'
```

**Solution:**
```bash
# Verify virtual environment is activated
# Should show (venv) in terminal prompt

# If not activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Install dependencies again
pip install -r requirements.txt
```

### "Permission denied" (uploads folder)

**Error:**
```
PermissionError: [Errno 13] Permission denied: 'app/uploads'
```

**Solution (macOS/Linux):**
```bash
chmod 755 app/uploads
chmod 755 app/temp
```

**Solution (Windows):**
```bash
# Right-click folder → Properties → Security
# Grant write permissions to your user account
```

### "Python not found"

**Error:**
```
command not found: python
```

**Solution:**
```bash
# Try python3 instead
python3 app.py

# Or install Python from https://www.python.org/
```

### Images not displaying

**Possible causes:**
1. Browser cache - Clear cache (Ctrl+Shift+Delete)
2. JavaScript disabled - Enable JavaScript
3. Port blocked - Try different port
4. File permissions - Check folder permissions

**Solution:**
```bash
# Clear uploads folder
rm -rf app/uploads/*
rm -rf app/temp/*

# Restart server
python app.py
```

## Production Deployment

### Using Gunicorn (Recommended)

```bash
pip install gunicorn
gunicorn app:app --workers 4 --bind 0.0.0.0:5000
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000"]
```

Build and run:
```bash
docker build -t image-processor .
docker run -p 5000:5000 image-processor
```

### Security Checklist

- [ ] Set `debug=False` in production
- [ ] Use HTTPS/SSL certificates
- [ ] Configure proper file storage (S3, etc.)
- [ ] Set up monitoring and logging
- [ ] Use production WSGI server (Gunicorn)
- [ ] Configure firewall rules
- [ ] Set up automatic backups
- [ ] Enable rate limiting
- [ ] Configure CORS properly

## Next Steps

1. ✅ Application is running
2. 📤 Start uploading images
3. 🔧 Customize configuration as needed
4. 🎨 Extend with OpenCV features
5. 🚀 Deploy to production

## Advanced Configuration

### Enable Logging

```python
import logging

logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)
```

### Custom Error Handling

```python
@app.errorhandler(500)
def handle_error(error):
    logging.error(f'Error: {error}')
    return jsonify({'success': False, 'message': 'Server error'}), 500
```

### Database Integration

```python
from flask_sqlalchemy import SQLAlchemy

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///images.db'
db = SQLAlchemy(app)

class UploadedImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255))
    upload_time = db.Column(db.DateTime)
```

## Support

For issues:
1. Check troubleshooting section
2. Review error messages carefully
3. Check application logs
4. Verify configuration settings
5. Open an issue on GitHub

---

**Setup Complete! 🎉**

Your Image Processor is ready to use.

Visit: **http://localhost:5000**
