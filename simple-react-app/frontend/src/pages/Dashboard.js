import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, accessToken } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [blurAmount, setBlurAmount] = useState(10);
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [sharpen, setSharpen] = useState(false);
  const [outputFormat, setOutputFormat] = useState('jpeg');
  const [imageHistory, setImageHistory] = useState([]);
  const [imageActions, setImageActions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch image history and actions on mount
  useEffect(() => {
    fetchImageHistory();
    fetchImageActions();
  }, [accessToken]);

  const fetchImageHistory = async () => {
    if (!accessToken) {
      console.warn('📋 No accessToken yet');
      return;
    }
    try {
      console.log('📋 Fetching image history...');
      const response = await fetch('http://localhost:5001/api/images/history', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      console.log('📋 History response:', data);

      if (data.success) {
        console.log('✅ Got', data.data.images.length, 'images');
        setImageHistory(data.data.images);
      } else {
        console.error('❌ History fetch failed:', data.message);
      }
    } catch (err) {
      console.error('❌ Failed to fetch image history:', err);
    }
  };

  const fetchImageActions = async () => {
    if (!accessToken) return;
    try {
      console.log('📊 Fetching image actions...');
      const response = await fetch('http://localhost:5001/api/images/actions', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      console.log('📊 Actions response:', data);

      if (data.success) {
        console.log('✅ Got', data.data.actions.length, 'actions');
        setImageActions(data.data.actions);
      }
    } catch (err) {
      console.error('❌ Failed to fetch image actions:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setMessage(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:5001/api/images/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setUploadedImage(data.data);
      setMessage('✅ Image uploaded successfully!');

      // Refresh image history and actions after upload
      setTimeout(() => {
        fetchImageHistory();
        fetchImageActions();
      }, 500);
    } catch (err) {
      setError(err.message || 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (operation) => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5001/api/images/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: uploadedImage.filename,
          operation: operation,
          blurAmount: blurAmount,
          brightness: brightness,
          contrast: contrast,
          sharpen: sharpen,
          format: outputFormat
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Processing failed');
      }

      setProcessedImage(data.data);
      setMessage(`✅ ${data.message}`);
    } catch (err) {
      setError(err.message || 'Processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!uploadedImage) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:5001/api/images/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: uploadedImage.filename
        })
      });

      if (!response.ok) {
        throw new Error('Cleanup failed');
      }

      setUploadedImage(null);
      setProcessedImage(null);
      setPreview(null);
      setSelectedFile(null);
      setMessage('✅ Image deleted from filesystem and database!');

      // Refresh image history and actions
      fetchImageHistory();
      fetchImageActions();
    } catch (err) {
      setError(err.message || 'Cleanup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}! 👋</h1>
        <button className="btn btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="user-info-card">
          <h2>Your Profile</h2>
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{user?.name}</span>
          </div>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{user?.email}</span>
          </div>
        </div>

        <div className="image-processor-card">
          <h2>📸 Image Processor (300MB Max)</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <div className="upload-section">
            <h3>1. Upload Image</h3>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileSelect}
                disabled={loading}
                id="file-input"
              />
              <label htmlFor="file-input" className="file-input-label">
                Click to select JPEG or PNG (up to 300MB)
              </label>
            </div>

            {preview && (
              <div className="preview-section">
                <h4>Preview:</h4>
                <img src={preview} alt="Preview" className="preview-image" />
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            )}
          </div>

          {uploadedImage && (
            <div className="process-section">
              <h3>2. Process Image</h3>
              <p className="image-info">
                Uploaded: {uploadedImage.filename} ({(uploadedImage.size / 1024 / 1024).toFixed(2)}MB)
              </p>

              {/* Format Selection */}
              <div className="control-group">
                <label>Output Format:</label>
                <div className="button-group">
                  <button
                    onClick={() => setOutputFormat('jpeg')}
                    disabled={loading}
                    className={`btn ${outputFormat === 'jpeg' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    JPEG
                  </button>
                  <button
                    onClick={() => setOutputFormat('png')}
                    disabled={loading}
                    className={`btn ${outputFormat === 'png' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => setOutputFormat('webp')}
                    disabled={loading}
                    className={`btn ${outputFormat === 'webp' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    WebP
                  </button>
                </div>
              </div>

              {/* Adjustment Controls */}
              <div className="control-group">
                <label>Blur: {blurAmount}</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={blurAmount}
                  onChange={(e) => setBlurAmount(parseFloat(e.target.value))}
                  disabled={loading}
                  className="slider"
                />
              </div>

              <div className="control-group">
                <label>Brightness: {brightness.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={brightness}
                  onChange={(e) => setBrightness(parseFloat(e.target.value))}
                  disabled={loading}
                  className="slider"
                />
              </div>

              <div className="control-group">
                <label>Contrast: {contrast.toFixed(2)}</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={contrast}
                  onChange={(e) => setContrast(parseFloat(e.target.value))}
                  disabled={loading}
                  className="slider"
                />
              </div>

              <div className="control-group">
                <label>
                  <input
                    type="checkbox"
                    checked={sharpen}
                    onChange={(e) => setSharpen(e.target.checked)}
                    disabled={loading}
                  />
                  Apply Sharpen
                </label>
              </div>

              {/* Quick Actions */}
              <div className="button-group">
                <button
                  onClick={() => handleProcess('original')}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  Original
                </button>
                <button
                  onClick={() => handleProcess('grayscale')}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  Grayscale
                </button>
                <button
                  onClick={() => handleProcess('enhance')}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  Enhance
                </button>
                <button
                  onClick={() => handleProcess('invert')}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  Invert
                </button>
                <button
                  onClick={() => handleProcess('rotate')}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  Rotate 90°
                </button>
                <button
                  onClick={() => handleProcess('thumbnail')}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  Thumbnail
                </button>
              </div>

              {/* Advanced Operations */}
              <div className="advanced-ops">
                <h4>Advanced Controls:</h4>
                <div className="button-group">
                  <button
                    onClick={() => handleProcess('blur')}
                    disabled={loading}
                    className="btn btn-secondary"
                    title={`Blur: ${blurAmount}px`}
                  >
                    Apply Blur
                  </button>
                  <button
                    onClick={() => handleProcess('brightness')}
                    disabled={loading}
                    className="btn btn-secondary"
                    title={`Brightness: ${brightness.toFixed(2)}`}
                  >
                    Apply Brightness
                  </button>
                  <button
                    onClick={() => handleProcess('contrast')}
                    disabled={loading}
                    className="btn btn-secondary"
                    title={`Contrast: ${contrast.toFixed(2)}`}
                  >
                    Apply Contrast
                  </button>
                  <button
                    onClick={() => handleProcess('sharpen')}
                    disabled={loading}
                    className="btn btn-secondary"
                  >
                    Sharpen
                  </button>
                </div>
              </div>

              {processedImage && (
                <div className="result-section">
                  <h4>Result ({processedImage.operation} - {processedImage.format.toUpperCase()}):</h4>
                  <img src={processedImage.preview} alt="Processed" className="result-image" />
                </div>
              )}

              <button
                onClick={handleCleanup}
                disabled={loading}
                className="btn btn-danger"
              >
                Delete Image
              </button>
            </div>
          )}

          {/* Image History */}
          <div className="image-history-section">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '20px' }}
            >
              {showHistory ? '▼ Hide History' : '▶ Show History'} ({imageActions.length} actions)
            </button>

            {showHistory && (
              <>
                {/* Current Images Section */}
                <div className="history-subsection">
                  <h4>📸 Current Images ({imageHistory.length})</h4>
                  {imageHistory.length > 0 ? (
                    <div className="history-list">
                      {imageHistory.map((img, idx) => (
                        <div key={idx} className="history-item">
                          <span className="history-icon">📄</span>
                          <div className="history-info">
                            <span className="history-name">{img.filename}</span>
                            <span className="history-details">
                              {img.width}×{img.height} • {(img.size / 1024 / 1024).toFixed(2)}MB • {img.format?.toUpperCase()}
                            </span>
                            <span className="history-date">
                              Uploaded: {new Date(img.uploadedAt).toLocaleDateString()} {new Date(img.uploadedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="history-empty">No images currently</div>
                  )}
                </div>

                {/* All Actions Section */}
                <div className="history-subsection">
                  <h4>📊 All Actions ({imageActions.length})</h4>
                  {imageActions.length > 0 ? (
                    <div className="history-list">
                      {imageActions.map((action, idx) => (
                        <div key={idx} className="history-item action-item">
                          <span className="history-icon">
                            {action.type === 'upload' && '⬆️'}
                            {action.type === 'process' && '⚙️'}
                            {action.type === 'delete' && '🗑️'}
                          </span>
                          <div className="history-info">
                            <span className="history-name">
                              {action.type.toUpperCase()}: {action.filename}
                            </span>
                            {action.operation && (
                              <span className="history-details">
                                Operation: {action.operation}
                              </span>
                            )}
                            <span className="history-date">
                              {new Date(action.timestamp).toLocaleDateString()} {new Date(action.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="history-empty">No actions yet</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
