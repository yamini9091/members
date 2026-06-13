import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const { verifyEmail } = useAuth();

  useEffect(() => {
    const verifyEmailToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError('Verification token not found');
        setLoading(false);
        return;
      }

      const result = await verifyEmail(token);

      if (result.success) {
        setSuccess(result.message);
      } else {
        setError(result.message);
      }
      setLoading(false);
    };

    verifyEmailToken();
  }, [searchParams, verifyEmail]);

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <p>Verifying your email...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Email Verification</h2>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="auth-links" style={{ marginTop: '20px' }}>
          {success && <Link to="/login">Go to Login</Link>}
          {error && <Link to="/register">Back to Register</Link>}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
