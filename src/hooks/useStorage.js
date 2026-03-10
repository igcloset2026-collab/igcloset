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
            const products = snapshot.docs.map(doc => {
                const { id, ...data } = doc.data();
                return { ...data, id: doc.id };
            });
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
            const sales = snapshot.docs.map(doc => {
                const { id, ...data } = doc.data();
                return { ...data, id: doc.id };
            });
            setData(prev => ({ ...prev, salesInProgress: sales }));
            listenersLoaded.sales = true;
            addLog(`Vendas em aberto: ${sales.length} registros.`);
            checkReady();
        }, (err) => {
            addLog(`ERRO (Vendas em Aberto): ${err.message}`);
            setSyncError("Erro de conexão (Vendas em Aberto): " + err.message);
        });

        const unsubCompleted = onSnapshot(collection(db, "completedSales"), (snapshot) => {
            const sales = snapshot.docs.map(doc => {
                const { id, ...data } = doc.data();
                return { ...data, id: doc.id };
            });
            setData(prev => ({ ...prev, completedSales: sales }));
            listenersLoaded.completed = true;
            checkReady();
        }, (err) => {
            setSyncError("Erro de conexão (Vendas): " + err.message);
        });

        const unsubStyles = onSnapshot(collection(db, "styles"), (snapshot) => {
            const styles = snapshot.docs.map(doc => {
                const { id, ...data } = doc.data();
                return { ...data, id: doc.id };
            });
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
        try {
            await addDoc(collection(db, "products"), product);
            addLog("Produto cadastrado com sucesso!");
        } catch (e) {
            addLog(`ERRO ao cadastrar: ${e.message}`);
            throw e;
        }
    };

    const updateProduct = async (id, updatedProduct) => {
        try {
            await updateDoc(doc(db, "products", id), updatedProduct);
            addLog("Produto atualizado com sucesso!");
        } catch (e) {
            addLog(`ERRO ao atualizar: ${e.message}`);
            throw e;
        }
    };

    const deleteProduct = async (id) => {
        try {
            await deleteDoc(doc(db, "products", id));
            addLog("Produto removido.");
        } catch (e) {
            addLog(`ERRO ao remover: ${e.message}`);
        }
    };

    const startSale = async (product, clientName) => {
        try {
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

            await deleteDoc(doc(db, "products", product.id));
            await addDoc(collection(db, "salesInProgress"), sale);
            addLog(`Venda iniciada para ${clientName}`);
        } catch (e) {
            addLog(`ERRO ao iniciar venda: ${e.message}`);
        }
    };

    const cancelSale = async (saleId) => {
        try {
            const sale = data.salesInProgress.find(s => s.id === saleId);
            if (!sale) return;

            await setDoc(doc(db, "products", sale.productId), sale.product);
            await deleteDoc(doc(db, "salesInProgress", saleId));
            addLog("Venda cancelada. Produto voltou ao estoque.");
        } catch (e) {
            addLog(`ERRO ao cancelar venda: ${e.message}`);
        }
    };

    const confirmSale = async (saleId) => {
        try {
            const sale = data.salesInProgress.find(s => s.id === saleId);
            if (!sale) return;

            // Strip ID before saving to historical records
            const { id, ...saleData } = sale;
            await addDoc(collection(db, "completedSales"), { ...saleData, status: 'completed' });
            await deleteDoc(doc(db, "salesInProgress", saleId));
            addLog("Venda concluída com sucesso!");
        } catch (e) {
            addLog(`ERRO ao confirmar venda: ${e.message}`);
        }
    };

    const deleteSale = async (saleId) => {
        try {
            addLog(`Excluindo venda: ${saleId.substring(0, 5)}...`);
            await deleteDoc(doc(db, "completedSales", saleId));
            addLog("Venda removida.");
        } catch (e) {
            addLog(`ERRO ao remover: ${e.message}`);
        }
    };

    const addStyle = async (name) => {
        try {
            await addDoc(collection(db, "styles"), { name });
            addLog(`Novo estilo: ${name}`);
        } catch (e) {
            addLog(`ERRO ao adicionar estilo: ${e.message}`);
        }
    };

    const deleteStyle = async (id) => {
        try {
            await deleteDoc(doc(db, "styles", id));
            addLog("Estilo removido.");
        } catch (e) {
            addLog(`ERRO ao remover estilo: ${e.message}`);
        }
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
