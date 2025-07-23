import React from 'react';
import { renderHook, act } from '@testing-library/react';
import axios from 'axios';
import { AuthProvider, useAuth } from '../../hooks/useAuth';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initializes with no user and loading state', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  test('successful login sets user and token', async () => {
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
    const mockToken = 'fake-jwt-token';
    
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: mockToken,
        user: mockUser
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const loginResult = await result.current.login('test@example.com', 'password');
      expect(loginResult.success).toBe(true);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
    expect(result.current.user).toEqual(mockUser);
  });

  test('failed login returns error', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          detail: 'Invalid credentials'
        }
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const loginResult = await result.current.login('test@example.com', 'wrongpassword');
      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe('Invalid credentials');
    });

    expect(result.current.user).toBeNull();
  });

  test('successful registration calls login', async () => {
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
    const mockToken = 'fake-jwt-token';
    
    // Mock registration
    mockedAxios.post.mockResolvedValueOnce({ data: mockUser });
    
    // Mock login after registration
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: mockToken,
        user: mockUser
      }
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const registerResult = await result.current.register('test@example.com', 'password', 'Test User');
      expect(registerResult.success).toBe(true);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  test('logout clears user and token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(result.current.user).toBeNull();
  });
});