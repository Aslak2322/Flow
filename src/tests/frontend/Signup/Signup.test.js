import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../../components/Login/Login';

global.fetch = jest.fn();
global.alert = jest.fn();
const mockSetItem = jest.fn();

Object.defineProperty(window, 'localStorage', {
  value: { getItem: jest.fn(), setItem: mockSetItem, removeItem: jest.fn() },
});

describe('Signup form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('signup form submits and shows success', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, token: 'abc123' }),
    });

    render(<Login />);

    // Switch to signup mode
    fireEvent.click(screen.getByText(/Signup/i));

    // Fill inputs
    fireEvent.change(screen.getByPlaceholderText(/Email/i), {
      target: { value: 'a@b.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Password/i), {
      target: { value: 'pw' },
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /^Signup$/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/signup',
      expect.objectContaining({ method: 'POST' })
    );

    expect(mockSetItem).toHaveBeenCalledWith('token', 'abc123');
    expect(global.alert).toHaveBeenCalledWith('Signup successful!');
  });
});

