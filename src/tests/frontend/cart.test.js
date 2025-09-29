import { render, screen, fireEvent } from '@testing-library/react';
import Cart from '../../components/Cart/Cart';

describe('Cart Component', () => {
  const mockRemove = jest.fn();
  const mockSetCart = jest.fn();

  const sampleCart = [
    {
      id: '1',
      type: 'Product',
      name: 'Test Product',
      price: 10,
      quantity: 2,
    },
    {
      id: '2025-10-02-1',
      type: 'Booking',
      date: '2025-10-02',
      starttime: '10:00',
      endtime: '11:00',
      price: 0,
    },
  ];

  beforeEach(() => {
    mockRemove.mockClear();
    mockSetCart.mockClear();
  });

  test('renders "No items in cart" when empty', () => {
    render(<Cart cart={[]} removeFromCart={mockRemove} setCart={mockSetCart} />);
    expect(screen.getByText(/no items in cart/i)).toBeInTheDocument();
  });

  test('renders product and booking items', () => {
    render(<Cart cart={sampleCart} removeFromCart={mockRemove} setCart={mockSetCart} />);

    // Product
    expect(screen.getByText(/Test Product/i)).toBeInTheDocument();
    expect(screen.getByText(/\$10 x 2/)).toBeInTheDocument();

    // Booking
    expect(screen.getByText(/Booking/)).toBeInTheDocument();
    expect(screen.getByText(/2025-10-02 10:00-11:00 - \$0/)).toBeInTheDocument();
  });

  test('remove button calls removeFromCart', () => {
    render(<Cart cart={sampleCart} removeFromCart={mockRemove} setCart={mockSetCart} />);
    
    const buttons = screen.getAllByText(/remove/i);
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    expect(mockRemove).toHaveBeenCalledTimes(2);
    expect(mockRemove).toHaveBeenCalledWith('1');
    expect(mockRemove).toHaveBeenCalledWith('2025-10-02-1');
  });

  test('checkout button calls handleCheckout', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ success: true }) })
    );

    render(<Cart cart={sampleCart} removeFromCart={mockRemove} setCart={mockSetCart} />);

    const checkoutBtn = screen.getByText(/checkout/i);
    fireEvent.click(checkoutBtn);

    // Wait for fetch to be called
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:4000/checkout',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: sampleCart, user_id: 1 }),
      })
    );
  });
});
