import { useState, useEffect } from 'react';

const INITIAL_DATA = {
    products: [],
    salesInProgress: [],
    completedSales: [],
    user: null
};

export function useStorage() {
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem('igcloset_data');
        return saved ? JSON.parse(saved) : INITIAL_DATA;
    });

    useEffect(() => {
        localStorage.setItem('igcloset_data', JSON.stringify(data));
    }, [data]);

    const addProduct = (product) => {
        setData(prev => ({
            ...prev,
            products: [...prev.products, { ...product, id: Date.now().toString() }]
        }));
    };

    const updateProduct = (id, updatedProduct) => {
        setData(prev => ({
            ...prev,
            products: prev.products.map(p => p.id === id ? { ...updatedProduct, id } : p)
        }));
    };

    const deleteProduct = (id) => {
        setData(prev => ({
            ...prev,
            products: prev.products.filter(p => p.id !== id)
        }));
    };

    const startSale = (product, clientName) => {
        const sale = {
            id: Date.now().toString(),
            product: { ...product }, // Keep the full product for returning to stock if canceled
            productId: product.id,
            productName: product.description,
            cost: product.cost,
            price: product.price,
            clientName,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        setData(prev => ({
            ...prev,
            salesInProgress: [...prev.salesInProgress, sale],
            products: prev.products.filter(p => p.id !== product.id) // Remove from stock IMMEDIATELY
        }));
    };

    const cancelSale = (saleId) => {
        const sale = data.salesInProgress.find(s => s.id === saleId);
        if (!sale) return;

        setData(prev => ({
            ...prev,
            salesInProgress: prev.salesInProgress.filter(s => s.id !== saleId),
            products: [...prev.products, sale.product] // Return to stock
        }));
    };

    const confirmSale = (saleId) => {
        const sale = data.salesInProgress.find(s => s.id === saleId);
        if (!sale) return;

        setData(prev => ({
            ...prev,
            salesInProgress: prev.salesInProgress.filter(s => s.id !== saleId),
            completedSales: [...prev.completedSales, { ...sale, status: 'completed' }]
            // Item is already removed from products in startSale
        }));
    };

    const deleteSale = (saleId) => {
        setData(prev => ({
            ...prev,
            completedSales: prev.completedSales.filter(s => s.id !== saleId)
        }));
    };

    const addStyle = (name) => {
        setData(prev => ({
            ...prev,
            styles: [...(prev.styles || []), { id: Date.now().toString(), name }]
        }));
    };

    const deleteStyle = (id) => {
        setData(prev => ({
            ...prev,
            styles: (prev.styles || []).filter(s => s.id !== id)
        }));
    };

    const login = (username, password) => {
        const users = [
            { username: 'gesiel', password: 'Rionegro2015' },
            { username: 'irisgabrielly', password: 'Fortaleza100' },
            { username: 'fatima', password: 'Fortaleza100' }
        ];

        const user = users.find(u => u.username === username.toLowerCase() && u.password === password);

        if (user) {
            setData(prev => ({ ...prev, user: { username: user.username } }));
            return true;
        }
        return false;
    };

    const logout = () => {
        setData(prev => ({ ...prev, user: null }));
    };

    return {
        data,
        addProduct,
        updateProduct,
        deleteProduct,
        startSale,
        cancelSale,
        confirmSale,
        deleteSale,
        addStyle,
        deleteStyle,
        login,
        logout
    };
}
