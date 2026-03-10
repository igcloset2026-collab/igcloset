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
    const [connected, setConnected] = useState(false);
    const [syncError, setSyncError] = useState(null);
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 15));
    };

    // Initial Load and Setup
    useEffect(() => {
        addLog("Iniciando sistema...");

        // 1. Recover User (Login is local)
        const savedUser = localStorage.getItem('igcloset_user');
        if (savedUser) {
            setData(prev => ({ ...prev, user: JSON.parse(savedUser) }));
            addLog(`Usuário ${JSON.parse(savedUser).username} recuperado localmente.`);
        }

        // 2. Migration Bridge (Check for old local data)
        const migrateLocalData = async () => {
            const localDataRaw = localStorage.getItem('igcloset_data');
            if (localDataRaw) {
                addLog("MIGRAÇÃO: Detectados dados locais. Iniciando envio...");
                try {
                    const localData = JSON.parse(localDataRaw);

                    // Migrate Styles
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

                    localStorage.removeItem('igcloset_data');
                    addLog("MIGRAÇÃO: Sucesso. Dados locais removidos.");
                } catch (e) {
                    console.error("MIGRAÇÃO: Falha!", e);
                    setSyncError("Falha ao migrar dados locais: " + e.message);
                    addLog(`MIGRAÇÃO: ERRO! ${e.message}`);
                }
            }
        };

        // 3. Setup Listeners with Readiness Check
        let listenersLoaded = { products: false, sales: false, styles: false, completed: false };
        const checkReady = () => {
            if (Object.values(listenersLoaded).every(v => v === true)) {
                setLoading(false);
                setConnected(true);
                addLog("Sistema pronto e conectado!");
            }
        };

        const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(prev => ({ ...prev, products }));
            listenersLoaded.products = true;
            const source = snapshot.metadata.hasPendingWrites ? "Local (Aguardando Nuvem)" : "Servidor";
            const fromCache = snapshot.metadata.fromCache ? "(Cache)" : "";
            addLog(`Estoque atualizado: ${products.length} itens [Origem: ${source}${fromCache}]`);
            checkReady();
        }, (err) => {
            addLog(`ERRO (Produtos): ${err.message}`);
            setSyncError("Erro de conexão (Produtos): " + err.message);
            setConnected(false);
        });

        const unsubInProgress = onSnapshot(collection(db, "salesInProgress"), (snapshot) => {
            const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(prev => ({ ...prev, salesInProgress: sales }));
            listenersLoaded.sales = true;
            addLog(`Vendas em aberto: ${sales.length} registros.`);
            checkReady();
        }, (err) => {
            addLog(`ERRO (Vendas em Aberto): ${err.message}`);
            setSyncError("Erro de conexão (Vendas em Aberto): " + err.message);
        });

        const unsubCompleted = onSnapshot(collection(db, "completedSales"), (snapshot) => {
            const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(prev => ({ ...prev, completedSales: sales }));
            listenersLoaded.completed = true;
            checkReady();
        }, (err) => {
            setSyncError("Erro de conexão (Vendas): " + err.message);
        });

        const unsubStyles = onSnapshot(collection(db, "styles"), (snapshot) => {
            const styles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setData(prev => ({ ...prev, styles }));
            listenersLoaded.styles = true;
            checkReady();
        }, (err) => {
            setSyncError("Erro de conexão (Estilos): " + err.message);
        });

        migrateLocalData();

        // Safety timeout for loading
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        return () => {
            clearTimeout(timeout);
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
        connected,
        syncError,
        logs,
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
