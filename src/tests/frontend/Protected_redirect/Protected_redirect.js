import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Cart from '../../../components/Cart/Cart';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';

// Mock alert
global.alert = jest.fn();

// Mock fetch
global.fetch = jest.fn();

describe('Cart Component', () => {
  const cartItems = [
    { id: 1, type: 'Product', name: 'Test Product', price: 10, quantity: 2 },
    { id: 2, type: 'Booking', date: '2025-10-10', starttime: '10:00', endtime: '11:00', price: 50, type: 'Booking' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('protected route redirect if no JWT', async () => {
    const history = createMemoryHistory();
    render(
      <Router location={history.location} navigator={history}>
        <Cart cart={cartItems} setCart={jest.fn()} removeFromCart={jest.fn()} user={null} />
      </Router>
    );

    fireEvent.click(screen.getByText(/checkout/i));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Please log in first!');
      expect(history.location.pathname).toBe('/login');
    });
  });

  test('checkout flow works: adds bookings/products and confirms order', async () => {
    // Mock token
    localStorage.setItem('token', 'fake-token');

    // Mock fetch to return success
    fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ success: true })
    });

    const setCartMock = jest.fn();
    const history = createMemoryHistory();

    render(
      <Router location={history.location} navigator={history}>
        <Cart cart={cartItems} setCart={setCartMock} removeFromCart={jest.fn()} user={{ id: 1 }} />
      </Router>
    );

    fireEvent.click(screen.getByText(/checkout/i));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:4000/checkout',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer fake-token'
          }),
          body: JSON.stringify({ cart: cartItems, user_id: 1 })
        })
      );

      expect(global.alert).toHaveBeenCalledWith('Order submitted successfully!');
      expect(setCartMock).toHaveBeenCalledWith([]); // cart cleared
    });
  });
});
