import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthRequired from '../../components/AuthRequired';

// Mock useLocation
const mockLocation = {
  pathname: '/asana-library',
  search: '',
  hash: '',
  state: null
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockLocation
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AuthRequired Component', () => {
  test('renders authentication required message', () => {
    renderWithRouter(<AuthRequired />);
    
    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText(/sign in to access/i)).toBeInTheDocument();
  });

  test('displays correct page name from pathname', () => {
    renderWithRouter(<AuthRequired />);
    
    expect(screen.getByText(/asana-library/i)).toBeInTheDocument();
  });

  test('renders sign in and register links', () => {
    renderWithRouter(<AuthRequired />);
    
    expect(screen.getByText('Sign In to Continue')).toBeInTheDocument();
    expect(screen.getByText('Create Free Account')).toBeInTheDocument();
  });

  test('renders benefits list', () => {
    renderWithRouter(<AuthRequired />);
    
    expect(screen.getByText(/access to 507\+ detailed yoga poses/i)).toBeInTheDocument();
    expect(screen.getByText(/personalized practice recommendations/i)).toBeInTheDocument();
    expect(screen.getByText(/progress tracking and analytics/i)).toBeInTheDocument();
  });

  test('sign in link includes redirect parameter', () => {
    renderWithRouter(<AuthRequired />);
    
    const signInLink = screen.getByText('Sign In to Continue').closest('a');
    expect(signInLink).toHaveAttribute('href', '/login?redirect=/asana-library');
  });

  test('register link includes redirect parameter', () => {
    renderWithRouter(<AuthRequired />);
    
    const registerLink = screen.getByText('Create Free Account').closest('a');
    expect(registerLink).toHaveAttribute('href', '/register?redirect=/asana-library');
  });
});