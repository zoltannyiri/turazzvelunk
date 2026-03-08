import React, { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) return null;
        try {
            return JSON.parse(savedUser);
        } catch (err) {
            localStorage.removeItem('user');
            return null;
        }
    });
    const [loading, setLoading] = useState(true);

    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            if (!base64Url) return null;
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (err) {
            return null;
        }
    };

    const isTokenExpired = (token) => {
        const payload = parseJwt(token);
        if (!payload?.exp) return false;
        return Date.now() >= payload.exp * 1000;
    };

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || isTokenExpired(token)) {
            logout();
            setLoading(false);
            return;
        }

        fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data && data.id) {
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                } else {
                    logout();
                }
            })
            .catch(() => {
                logout();
            })
            .finally(() => {
                setLoading(false);
            });
    }, [logout]);

    const login = (userData) => {
        setUser(userData.user);
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData.user));
    };

    const updateUser = (nextUser) => {
        setUser(nextUser);
        localStorage.setItem('user', JSON.stringify(nextUser));
    };

    useEffect(() => {
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            if (response && (response.status === 401 || response.status === 403)) {
                logout();
            }
            return response;
        };
        return () => {
            window.fetch = originalFetch;
        };
    }, [logout]);

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};