import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../../components/Login/Login'; // adjust path if needed

// Mock localStorage
beforeEach(() => {
  Storage.prototype.setItem = jest.fn();
  jest.clearAllMocks();
});

// Mock fetch globally
global.fetch = jest.fn();

test('login form submits correctly, calls /login API and stores token', async () => {
  // Mock API response
  const mockResponse = {
    success: true,
    token: 'mock-jwt-token',
    user: { email: 'test@example.com' }
  };

  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse
  });

  render(<Login onLogin={jest.fn()} />);

  // Fill in the form
  fireEvent.change(screen.getByPlaceholderText(/email/i), {
    target: { value: 'test@example.com' },
  });
  fireEvent.change(screen.getByPlaceholderText(/password/i), {
    target: { value: 'password123' },
  });

  // Submit the form
  fireEvent.click(screen.getByRole('button', { name: /login/i }));

  // Wait for the async logic to complete
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }),
      })
    );

    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-jwt-token');
  });
});
