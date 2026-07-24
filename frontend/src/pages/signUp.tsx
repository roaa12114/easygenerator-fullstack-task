import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/auth';
import { useAuth } from '../context/useAuth';
import './signUp.css';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 3) {
      setError('Name must be at least 3 characters.');
      return;
    }

    const passwordRules = /(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
    if (password.length < 8 || !passwordRules.test(password)) {
      setError('Password must be at least 8 characters and include a letter, a number, and a special character.');
      return;
    }

    try {
      await signup(name, email, password);
      await checkAuth();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creating account. Please try again.');
    }
  };

  return (
    <div className="signup-container">
      <h2 className="signup-title">Sign Up</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            className="form-input"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            className="form-input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            className="form-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="signup-btn">Sign Up</button>
      </form>
      <p>Already have an account? <Link to="/sign-in">Sign in</Link></p>
    </div>
  );
}

export default Signup;