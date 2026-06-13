"""
Flask Image Processing Web UI
Features: Drag & drop upload, image preview, rate limiting, file validation
"""

import os
import json
import tempfile
import atexit
from datetime import datetime
from functools import wraps
from pathlib import Path
from collections import defaultdict
from time import time

from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from PIL import Image
import cv2
import numpy as np

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'app/uploads'
TEMP_FOLDER = 'app/temp'
MAX_FILE_SIZE = 30 * 1024 * 1024  # 30MB
ALLOWED_EXTENSIONS = {'jpeg', 'jpg', 'png'}
BLOCKED_EXTENSIONS = {'gif'}
RATE_LIMIT_REQUESTS = 30
RATE_LIMIT_WINDOW = 60  # per minute

# Create folders
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Rate limiting storage (IP: [(timestamp, request_count)])
rate_limit_store = defaultdict(list)


def cleanup_temp_files():
    """Auto cleanup temporary files on shutdown"""
    try:
        temp_path = Path(TEMP_FOLDER)
        if temp_path.exists():
            for file in temp_path.glob('*'):
                try:
                    file.unlink()
                except Exception as e:
                    print(f"Error deleting {file}: {e}")
        print("✅ Temporary files cleaned up")
    except Exception as e:
        print(f"Error during cleanup: {e}")


# Register cleanup function
atexit.register(cleanup_temp_files)


def rate_limit(limit=RATE_LIMIT_REQUESTS, window=RATE_LIMIT_WINDOW):
    """Rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            ip = request.remote_addr
            now = time()

            # Clean old requests outside the window
            rate_limit_store[ip] = [
                req_time for req_time in rate_limit_store[ip]
                if now - req_time < window
            ]

            # Check if limit exceeded
            if len(rate_limit_store[ip]) >= limit:
                return jsonify({
                    'success': False,
                    'message': f'Rate limit exceeded. Max {limit} requests per minute per IP',
                    'code': 'RATE_LIMIT_EXCEEDED'
                }), 429

            # Add current request
            rate_limit_store[ip].append(now)

            return f(*args, **kwargs)
        return decorated_function
    return decorator


def allowed_file(filename):
    """Check if file is allowed"""
    if '.' not in filename:
        return False, "No file extension"

    ext = filename.rsplit('.', 1)[1].lower()

    if ext in BLOCKED_EXTENSIONS:
        return False, f".{ext} files are not allowed"

    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Only {', '.join(ALLOWED_EXTENSIONS)} files allowed"

    return True, None


def process_image_with_pillow(filepath):
    """Process image with Pillow for metadata and basic info"""
    try:
        img = Image.open(filepath)
        return {
            'size': img.size,
            'format': img.format,
            'mode': img.mode,
            'file_size_mb': os.path.getsize(filepath) / (1024 * 1024)
        }
    except Exception as e:
        return {'error': str(e)}


def load_image_for_display(filepath):
    """Load image as base64 for frontend display"""
    try:
        with Image.open(filepath) as img:
            # Create thumbnail for display (max 500px)
            img.thumbnail((500, 500), Image.Resampling.LANCZOS)

            # Save to bytes
            import io
            import base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)

            return base64.b64encode(buffer.getvalue()).decode()
    except Exception as e:
        return None


@app.route('/')
def index():
    """Serve main page"""
    return render_template('index.html')


@app.route('/api/upload', methods=['POST'])
@rate_limit(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW)
def upload_file():
    """Handle file upload with validation"""

    # Check if file is in request
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'message': 'No file provided',
            'code': 'NO_FILE'
        }), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({
            'success': False,
            'message': 'No file selected',
            'code': 'EMPTY_FILE'
        }), 400

    # Validate file
    is_allowed, error_msg = allowed_file(file.filename)
    if not is_allowed:
        return jsonify({
            'success': False,
            'message': error_msg,
            'code': 'INVALID_FILE_TYPE'
        }), 400

    # Check file size before saving
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    if file_size > MAX_FILE_SIZE:
        return jsonify({
            'success': False,
            'message': f'File size exceeds {MAX_FILE_SIZE / (1024*1024):.0f}MB limit',
            'code': 'FILE_TOO_LARGE'
        }), 413

    try:
        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        filename = timestamp + filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Get image info
        img_info = process_image_with_pillow(filepath)

        if 'error' in img_info:
            os.remove(filepath)
            return jsonify({
                'success': False,
                'message': 'Invalid image file',
                'code': 'INVALID_IMAGE'
            }), 400

        # Get base64 for display
        base64_image = load_image_for_display(filepath)

        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'data': {
                'filename': filename,
                'filepath': filepath,
                'image_info': img_info,
                'base64_image': f'data:image/png;base64,{base64_image}' if base64_image else None
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e),
            'code': 'UPLOAD_ERROR'
        }), 500


@app.route('/api/process', methods=['POST'])
@rate_limit(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW)
def process_image():
    """Process image (placeholder for future OpenCV features)"""
    try:
        data = request.json
        filepath = data.get('filepath')
        operation = data.get('operation', 'original')

        if not filepath or not os.path.exists(filepath):
            return jsonify({
                'success': False,
                'message': 'File not found',
                'code': 'FILE_NOT_FOUND'
            }), 404

        # For now, return original image
        # Future: Add OpenCV processing here
        base64_image = load_image_for_display(filepath)

        return jsonify({
            'success': True,
            'data': {
                'processed_image': f'data:image/png;base64,{base64_image}',
                'operation': operation
            }
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e),
            'code': 'PROCESS_ERROR'
        }), 500


@app.route('/api/cleanup', methods=['POST'])
def cleanup_files():
    """Cleanup uploaded files"""
    try:
        filepath = request.json.get('filepath')
        if filepath and os.path.exists(filepath):
            os.remove(filepath)

        return jsonify({
            'success': True,
            'message': 'File deleted'
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get server status and config"""
    return jsonify({
        'success': True,
        'data': {
            'max_file_size_mb': MAX_FILE_SIZE / (1024 * 1024),
            'allowed_formats': list(ALLOWED_EXTENSIONS),
            'blocked_formats': list(BLOCKED_EXTENSIONS),
            'rate_limit': f'{RATE_LIMIT_REQUESTS} requests per minute per IP',
            'server_time': datetime.now().isoformat()
        }
    }), 200


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error"""
    return jsonify({
        'success': False,
        'message': f'File exceeds {MAX_FILE_SIZE / (1024*1024):.0f}MB limit',
        'code': 'FILE_TOO_LARGE'
    }), 413


@app.errorhandler(404)
def not_found(error):
    """Handle 404"""
    return jsonify({
        'success': False,
        'message': 'Endpoint not found',
        'code': 'NOT_FOUND'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500"""
    return jsonify({
        'success': False,
        'message': 'Internal server error',
        'code': 'SERVER_ERROR'
    }), 500


if __name__ == '__main__':
    print("🚀 Flask Image Processor starting...")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"📁 Temp folder: {TEMP_FOLDER}")
    print(f"📊 Max file size: {MAX_FILE_SIZE / (1024*1024):.0f}MB")
    print(f"🔒 Rate limit: {RATE_LIMIT_REQUESTS} requests per minute per IP")
    print(f"📷 Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}")
    print(f"🚫 Blocked formats: {', '.join(BLOCKED_EXTENSIONS)}")
    print("\n✅ Server running on http://localhost:5000")

    app.run(debug=True, host='localhost', port=5000)
