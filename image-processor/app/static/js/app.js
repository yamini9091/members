/**
 * Image Processor - Frontend JavaScript
 * Handles drag-drop, upload, and image processing
 */

// DOM Elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadContainer = document.getElementById('upload-container');
const previewSection = document.getElementById('preview-section');
const uploadSection = document.querySelector('.upload-section');
const beforeImage = document.getElementById('before-image');
const afterImage = document.getElementById('after-image');
const processBtn = document.getElementById('process-btn');
const clearBtn = document.getElementById('clear-btn');
const spinner = document.getElementById('spinner');
const toast = document.getElementById('toast');
const statusText = document.getElementById('status-text');
const rateLimitInfo = document.getElementById('rate-limit-info');
const serverConfig = document.getElementById('server-config');

// State
let currentFile = null;
let currentFilePath = null;

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 3000) {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
}

/**
 * Show/hide spinner
 */
function setLoading(isLoading) {
    spinner.style.display = isLoading ? 'flex' : 'none';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Update file info display
 */
function updateFileInfo(filename, imageInfo) {
    document.getElementById('filename').textContent = filename;

    if (imageInfo) {
        const [width, height] = imageInfo.size;
        document.getElementById('dimensions').textContent = `${width}×${height}px`;
        document.getElementById('format').textContent = imageInfo.format || 'Unknown';
        document.getElementById('file-size').textContent = `${imageInfo.file_size_mb.toFixed(2)}MB`;
    }
}

/**
 * Handle file upload
 */
async function uploadFile(file) {
    if (!file) return;

    // Validate file type on client side
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        showToast('❌ Invalid file type. Only JPEG and PNG allowed.', 'error');
        return;
    }

    // Validate file size on client side (max 30MB)
    const maxSize = 30 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast(`❌ File too large. Maximum 30MB allowed.`, 'error');
        return;
    }

    setLoading(true);
    statusText.textContent = 'Uploading...';

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            showToast(`❌ ${data.message}`, 'error');
            return;
        }

        if (data.success) {
            showToast('✅ File uploaded successfully!', 'success');
            currentFile = file;
            currentFilePath = data.data.filepath;

            // Display image
            if (data.data.base64_image) {
                beforeImage.src = data.data.base64_image;
                afterImage.src = data.data.base64_image;
            }

            // Update file info
            updateFileInfo(data.data.filename, data.data.image_info);

            // Show preview section
            uploadSection.style.display = 'none';
            previewSection.style.display = 'block';

            // Enable process button (ready for OpenCV)
            processBtn.disabled = false;
            statusText.textContent = 'Ready for processing';
        }
    } catch (error) {
        showToast(`❌ Upload failed: ${error.message}`, 'error');
        statusText.textContent = 'Upload failed';
    } finally {
        setLoading(false);
    }
}

/**
 * Handle image processing (placeholder for OpenCV)
 */
async function processImage() {
    if (!currentFilePath) return;

    setLoading(true);
    statusText.textContent = 'Processing...';

    try {
        const response = await fetch('/api/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filepath: currentFilePath,
                operation: 'original' // Placeholder for future OpenCV operations
            })
        });

        const data = await response.json();

        if (data.success) {
            afterImage.src = data.data.processed_image;
            showToast('✅ Processing complete!', 'success');
            statusText.textContent = 'Processing complete';
        } else {
            showToast(`❌ Processing failed: ${data.message}`, 'error');
        }
    } catch (error) {
        showToast(`❌ Processing error: ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Clear and reset UI
 */
async function clearFiles() {
    if (!currentFilePath) return;

    setLoading(true);

    try {
        await fetch('/api/cleanup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filepath: currentFilePath
            })
        });

        // Reset state
        currentFile = null;
        currentFilePath = null;
        fileInput.value = '';

        // Reset UI
        uploadSection.style.display = 'block';
        previewSection.style.display = 'none';
        beforeImage.src = '';
        afterImage.src = '';
        processBtn.disabled = true;

        showToast('✅ Cleared successfully', 'success');
        statusText.textContent = 'Ready';
    } catch (error) {
        showToast(`❌ Cleanup failed: ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Load server configuration
 */
async function loadServerConfig() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();

        if (data.success) {
            const config = data.data;
            serverConfig.innerHTML = `
                <li>Max File Size: <strong>${config.max_file_size_mb}MB</strong></li>
                <li>Allowed Formats: <strong>${config.allowed_formats.join(', ').toUpperCase()}</strong></li>
                <li>Blocked Formats: <strong>${config.blocked_formats.join(', ').toUpperCase()}</strong></li>
                <li>Rate Limit: <strong>${config.rate_limit}</strong></li>
            `;

            // Update rate limit info in header
            rateLimitInfo.textContent = `⚡ ${config.rate_limit}`;
        }
    } catch (error) {
        console.error('Failed to load server config:', error);
    }
}

/**
 * Setup drag and drop
 */
function setupDragDrop() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop area when file is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragover');
        }, false);
    });

    // Handle dropped files
    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        uploadFile(files[0]);
    }, false);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Upload area click
    uploadArea.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', (e) => {
        uploadFile(e.target.files[0]);
    });

    // Process button
    processBtn.addEventListener('click', processImage);

    // Clear button
    clearBtn.addEventListener('click', clearFiles);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape' && previewSection.style.display !== 'none') {
            clearFiles();
        }
    });
}

/**
 * Initialize application
 */
function init() {
    console.log('🖼️ Image Processor initializing...');

    setupDragDrop();
    setupEventListeners();
    loadServerConfig();

    showToast('✅ Ready to process images!', 'success');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
