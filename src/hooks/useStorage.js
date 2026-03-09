import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    setDoc,
    getDocs
} from "firebase/firestore";

const INITIAL_DATA = {
    products: [],
    salesInProgress: [],
    completedSales: [],
    styles: [],
    user: null
};

export function useStorage() {
    const [data, setData] = useState(INITIAL_DATA);
    const [loading, setLoading] = useState(true);

    // Initial Load and Setup
    useEffect(() => {
        // 1. Recover User (Login is local)
        const savedUser = localStorage.getItem('igcloset_user');
        if (savedUser) {
            setData(prev => ({ ...prev, user: JSON.parse(savedUser) }));
        }

        // 2. Migration Bridge (Check for old local data)
        const migrateLocalData = async () => {
            const localDataRaw = localStorage.getItem('igcloset_data');
            if (localDataRaw) {
                console.log("Detectados dados locais. Iniciando migração para a nuvem...");
                try {
                    const localData = JSON.parse(localDataRaw);

                    // Migrate Styles first to avoid duplicates if possible
                    if (localData.styles?.length > 0) {
                        for (const style of localData.styles) {
                            await addDoc(collection(db, "styles"), { name: style.name });
                        }
                    }

                    // Migrate Products
                    if (localData.products?.length > 0) {
                        for (const p of localData.products) {
                            await addDoc(collection(db, "products"), { ...p });
                        }
                    }

                    // Migrate Sales In Progress
                    if (localData.salesInProgress?.length > 0) {
                        for (const s of localData.salesInProgress) {
                            await addDoc(collection(db, "salesInProgress"), { ...s });
                        }
                    }

                    // Migrate Completed Sales
                    if (localData.completedSales?.length > 0) {
                        for (const cs of localData.completedSales) {
                            await addDoc(collection(db, "completedSales"), { ...cs });
                        }
                    }

                    // Clean up local after success
                    localStorage.removeItem('igcloset_data');
                    console.log("Migração concluída com sucesso!");
                } catch (e) {
                    console.error("Falha na migração:", e);
                }
            }
        };

        // 3. Setup Listeners
        const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(prev => ({ ...prev, products }));
            setLoading(false); // First snapshot is enough to stop loading
        });

        const unsubInProgress = onSnapshot(collection(db, "salesInProgress"), (snapshot) => {
            const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(prev => ({ ...prev, salesInProgress: sales }));
        });

        const unsubCompleted = onSnapshot(collection(db, "completedSales"), (snapshot) => {
            const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(prev => ({ ...prev, completedSales: sales }));
        });

        const unsubStyles = onSnapshot(collection(db, "styles"), (snapshot) => {
            const styles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(prev => ({ ...prev, styles }));
        });

        migrateLocalData();

        return () => {
            unsubProducts();
            unsubInProgress();
            unsubCompleted();
            unsubStyles();
        };
    }, []);

    const addProduct = async (product) => {
        await addDoc(collection(db, "products"), product);
    };

    const updateProduct = async (id, updatedProduct) => {
        await updateDoc(doc(db, "products", id), updatedProduct);
    };

    const deleteProduct = async (id) => {
        await deleteDoc(doc(db, "products", id));
    };

    const startSale = async (product, clientName) => {
        const sale = {
            product: { ...product },
            productId: product.id,
            productName: product.description,
            cost: product.cost,
            price: product.price,
            clientName,
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        // Use a batch or sequential calls
        await deleteDoc(doc(db, "products", product.id));
        await addDoc(collection(db, "salesInProgress"), sale);
    };

    const cancelSale = async (saleId) => {
        const sale = data.salesInProgress.find(s => s.id === saleId);
        if (!sale) return;

        await setDoc(doc(db, "products", sale.productId), sale.product);
        await deleteDoc(doc(db, "salesInProgress", saleId));
    };

    const confirmSale = async (saleId) => {
        const sale = data.salesInProgress.find(s => s.id === saleId);
        if (!sale) return;

        await addDoc(collection(db, "completedSales"), { ...sale, status: 'completed' });
        await deleteDoc(doc(db, "salesInProgress", saleId));
    };

    const deleteSale = async (saleId) => {
        await deleteDoc(doc(db, "completedSales", saleId));
    };

    const addStyle = async (name) => {
        await addDoc(collection(db, "styles"), { name });
    };

    const deleteStyle = async (id) => {
        await deleteDoc(doc(db, "styles", id));
    };

    const login = (username, password) => {
        const users = [
            { username: 'gesiel', password: 'Rionegro2015' },
            { username: 'irisgabrielly', password: 'Fortaleza100' },
            { username: 'fatima', password: 'Fortaleza100' }
        ];

        const userFound = users.find(u => u.username === username.toLowerCase() && u.password === password);

        if (userFound) {
            const userState = { username: userFound.username };
            localStorage.setItem('igcloset_user', JSON.stringify(userState));
            setData(prev => ({ ...prev, user: userState }));
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem('igcloset_user');
        setData(prev => ({ ...prev, user: null }));
    };

    return {
        data,
        loading,
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
