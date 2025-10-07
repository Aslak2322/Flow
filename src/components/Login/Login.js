import './Login.css';
import { useState } from 'react';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const endpoint = isSignup
        ? `${process.env.REACT_APP_BACKEND_URL}/signup`
        : `${process.env.REACT_APP_BACKEND_URL}/login`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        alert(isSignup ? 'Signup successful!' : 'Login successful!');

        // Only call onLogin after a successful login (not signup)
        if (!isSignup) onLogin?.(data.user);
      } else {
        alert(data.message || (isSignup ? 'Signup failed' : 'Invalid credentials'));
      }
    } catch (err) {
      console.error(err);
      alert(isSignup ? 'Signup failed' : 'Login failed');
    }
  };

  return (
    <div className="Login">
      <h2>{isSignup ? 'Signup' : 'Login'}</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">
          {isSignup ? 'Signup' : 'Login'}
        </button>
      </form>

      <p>
        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? 'Login' : 'Signup'}
        </button>
      </p>
    </div>
  );
}

export default Login;

