// Version: 2.1 (Force Refresh)
import React, { useState } from 'react';
import { useStorage } from './hooks/useStorage';
import {
  PlusCircle,
  Package,
  ShoppingCart,
  BarChart3,
  LogOut,
  Camera,
  Trash2,
  Edit2,
  Check,
  X,
  Plus,
  Settings,
  Filter,
  Calendar,
  Layers
} from 'lucide-react';

// --- Sub-components ---

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (onLogin(username, password)) {
      setError('');
    } else {
      setError('Usuário ou senha incorretos.');
    }
  };

  return (
    <div className="container" style={{ justifyContent: 'center' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '24px' }}>
          <img src="/logo.png" alt="IG Closet Logo" style={{ width: '120px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
          <h1 translate="no" style={{ color: 'var(--primary)', marginTop: '12px' }}>IG Closet</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestão de Estoque</p>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Usuário</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuário" required />
          </div>
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required />
          </div>
          {error && <p style={{ color: 'var(--error)', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Entrar</button>
        </form>
      </div>
    </div>
  );
};

const StyleManagementScreen = ({ styles, onAdd, onDelete }) => {
  const [newStyle, setNewStyle] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (newStyle.trim()) {
      onAdd(newStyle.trim());
      setNewStyle('');
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Estilos de Roupa</h2>
      <form onSubmit={handleAdd} className="card" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          type="text"
          value={newStyle}
          onChange={(e) => setNewStyle(e.target.value)}
          placeholder="Ex: Vestido Longo"
          required
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
          <Plus size={24} />
        </button>
      </form>

      <div className="card" style={{ padding: '0' }}>
        {(styles || []).length === 0 ? (
          <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum estilo cadastrado.</p>
        ) : (
          styles.map((style, index) => (
            <div key={style.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: index === styles.length - 1 ? 'none' : '1px solid var(--border)'
            }}>
              <span>{style.name}</span>
              <button onClick={() => onDelete(style.id)} style={{ color: 'var(--error)' }}>
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ProductForm = ({ onSave, onCancel, editingProduct, styles }) => {
  const [description, setDescription] = useState(editingProduct?.description || '');
  const [cost, setCost] = useState(editingProduct?.cost || '');
  const [price, setPrice] = useState(editingProduct?.price || '');
  const [styleId, setStyleId] = useState(editingProduct?.styleId || '');
  const [image, setImage] = useState(editingProduct?.image || null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const styleName = styles.find(s => s.id === styleId)?.name || '';
    onSave({
      description,
      cost: Number(cost),
      price: Number(price),
      styleId,
      styleName,
      image
    });
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: '20px', color: 'var(--primary)' }}>
        {editingProduct ? 'Editar Peça' : 'Nova Peça'}
      </h2>
      <form onSubmit={handleSubmit} className="card">
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Descrição</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Vestido Floral M" required />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Estilo / Categoria</label>
          <select value={styleId} onChange={(e) => setStyleId(e.target.value)} required>
            <option value="">Selecione um estilo...</option>
            {styles.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Custo (R$)</label>
            <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>Preço (R$)</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" required />
          </div>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Foto</label>
          <div
            style={{
              width: '100%',
              height: '200px',
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: '#f9f9f9',
              position: 'relative'
            }}
          >
            {image ? (
              <img src={image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Camera size={40} style={{ marginBottom: '8px' }} />
                <p>Toque para tirar foto ou galeria</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0 }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={onCancel} className="btn btn-outline" style={{ flex: 1 }}>Cancelar</button>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar</button>
        </div>
      </form>
    </div>
  );
};

const InventoryScreen = ({ products, onEdit, onSell }) => {
  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--primary)' }}>Meu Estoque</h2>
        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{products.length} peças</span>
      </div>
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>
          <Package size={60} style={{ opacity: 0.2, marginBottom: '16px' }} />
          <p>Nenhuma peça cadastrada.</p>
        </div>
      ) : (
        products.map(product => (
          <div key={product.id} className="card" style={{ display: 'flex', gap: '16px', padding: '12px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#eee', flexShrink: 0 }}>
              {product.image ? (
                <img src={product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Package size={24} color="#ccc" />
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: '16px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {product.description}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {product.styleName || 'Sem estilo'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '18px' }}>R$ {product.price.toFixed(2)}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Custo: R$ {product.cost.toFixed(2)}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => onEdit(product)} className="nav-item" style={{ color: 'var(--text-muted)' }}>
                    <Edit2 size={18} />
                  </button>
                  <button translate="no" onClick={() => onSell(product)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    Vender
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
      <div style={{ height: '80px' }}></div>
    </div>
  );
};

const SalesPendingScreen = ({ sales, onCancel, onConfirm }) => {
  return (
    <div className="container">
      <h2 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Vendas em Andamento</h2>
      {sales.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>Nenhuma venda pendente.</p>
      ) : (
        sales.map(sale => (
          <div key={sale.id} className="card">
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <h3 style={{ fontSize: '18px' }}>{sale.productName}</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'var(--secondary-light)', padding: '2px 6px', borderRadius: '4px' }}>
                  {sale.product?.styleName}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Cliente: <strong>{sale.clientName}</strong></p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '20px' }}>R$ {sale.price.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => onCancel(sale.id)}
                className="btn btn-outline"
                style={{ flex: 1, borderColor: '#ff4d4f', color: '#ff4d4f' }}
              >
                <X size={18} /> Cancelar
              </button>
              <button
                onClick={() => onConfirm(sale.id)}
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: 'var(--success)' }}
              >
                <Check size={18} /> Confirmar
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const SalesReportScreen = ({ salesHistory, styles, onDelete }) => {
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterStyle, setFilterStyle] = useState('');

  const months = [
    { v: '01', n: 'Janeiro' }, { v: '02', n: 'Fevereiro' }, { v: '03', n: 'Março' },
    { v: '04', n: 'Abril' }, { v: '05', n: 'Maio' }, { v: '06', n: 'Junho' },
    { v: '07', n: 'Julho' }, { v: '08', n: 'Agosto' }, { v: '09', n: 'Setembro' },
    { v: '10', n: 'Outubro' }, { v: '11', n: 'Novembro' }, { v: '12', n: 'Dezembro' }
  ];

  const years = ['2024', '2025', '2026', '2027'];

  const filteredSales = salesHistory.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    const saleMonth = (saleDate.getMonth() + 1).toString().padStart(2, '0');
    const saleYear = saleDate.getFullYear().toString();

    const matchMonth = filterMonth ? saleMonth === filterMonth : true;
    const matchYear = filterYear ? saleYear === filterYear : true;
    const matchStyle = filterStyle ? sale.product?.styleId === filterStyle : true;

    return matchMonth && matchYear && matchStyle;
  });

  const totalSales = filteredSales.reduce((sum, s) => sum + s.price, 0);
  const totalCost = filteredSales.reduce((sum, s) => sum + (s.cost || 0), 0);
  const totalProfit = totalSales - totalCost;

  return (
    <div className="container">
      <h2 style={{ marginBottom: '20px', color: 'var(--primary)' }}>Relatório de Vendas</h2>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Filter size={18} color="var(--primary)" />
          <span style={{ fontWeight: '600' }}>Filtros</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ fontSize: '14px' }}>
            <option value="">Todos os Meses</option>
            {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ fontSize: '14px' }}>
            <option value="">Todos os Anos</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <select value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)} style={{ fontSize: '14px' }}>
          <option value="">Todos os Estilos</option>
          {styles.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vendas</p>
          <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>R$ {totalSales.toFixed(2)}</p>
        </div>
        <div className="card" style={{ padding: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Custo</p>
          <p style={{ fontWeight: 'bold' }}>R$ {totalCost.toFixed(2)}</p>
        </div>
        <div className="card" style={{ padding: '12px', textAlign: 'center', gridColumn: 'span 2', backgroundColor: 'var(--secondary-light)' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Lucro no Período</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>R$ {totalProfit.toFixed(2)}</p>
        </div>
      </div>

      <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Histórico ({filteredSales.length})</h3>
      {filteredSales.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Nenhuma venda encontrada para os filtros selecionados.</p>
      ) : (
        [...filteredSales].reverse().map(sale => (
          <div key={sale.id} className="card" style={{ padding: '12px', marginBottom: '8px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong>{sale.productName}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>+R$ {sale.price.toFixed(2)}</span>
                <button
                  onClick={() => window.confirm('Deseja excluir esta venda do histórico?') && onDelete(sale.id)}
                  style={{ color: 'var(--error)', padding: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
              <span>Cli: {sale.clientName} ({sale.product?.styleName || 'Sem estilo'})</span>
              <span>Lucro: R$ {(sale.price - (sale.cost || 0)).toFixed(2)}</span>
            </div>
            <div style={{ fontSize: '10px', color: '#ccc', marginTop: '4px' }}>
              {new Date(sale.timestamp).toLocaleDateString('pt-BR')} {new Date(sale.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))
      )}
      <div style={{ height: '80px' }}></div>
    </div>
  );
};

export default function App() {
  const { data, loading, addProduct, updateProduct, deleteProduct, startSale, cancelSale, confirmSale, deleteSale, addStyle, deleteStyle, login, logout } = useStorage();
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, add, pending, report, styles
  const [editingProduct, setEditingProduct] = useState(null);
  const [saleProduct, setSaleProduct] = useState(null);
  const [clientName, setClientName] = useState('');

  // Initial Styles Setup (One-time)
  React.useEffect(() => {
    if (data.user && !loading && (!data.styles || data.styles.length === 0)) {
      const initial = ['Vestido Longo', 'Cropped', 'Shorts', 'Vestido Curto'];
      initial.forEach(name => addStyle(name));
    }
  }, [data.user, loading]);

  if (loading && data.user) {
    return (
      <div className="container" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <p style={{ color: 'var(--primary)' }}>Sincronizando estoque...</p>
      </div>
    );
  }

  if (!data.user) {
    return <LoginScreen onLogin={login} />;
  }

  // Handle Navigation
  const navigateTo = (tab) => {
    setEditingProduct(null);
    setSaleProduct(null);
    setActiveTab(tab);
  };

  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }
    navigateTo('inventory');
  };

  const handleStartSale = (product) => {
    setSaleProduct(product);
    setClientName('');
  };

  const confirmStartSale = () => {
    if (!clientName.trim()) return alert('Informe o nome do cliente');
    startSale(saleProduct, clientName);
    setSaleProduct(null);
    navigateTo('pending');
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Modals / Overlays */}
      {saleProduct && (
        <div className="modal-overlay">
          <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <h3>Registrar Venda</h3>
            <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>{saleProduct.description}</p>
            <label style={{ display: 'block', marginBottom: '8px' }}>Nome do Cliente</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Digite o nome..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && confirmStartSale()}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => setSaleProduct(null)} className="btn btn-outline" style={{ flex: 1 }}>Cancelar</button>
              <button onClick={confirmStartSale} className="btn btn-primary" style={{ flex: 1 }}>Prosseguir</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeTab === 'inventory' && !editingProduct && (
        <InventoryScreen
          products={data.products}
          onEdit={(p) => { setEditingProduct(p); setActiveTab('add'); }}
          onSell={handleStartSale}
        />
      )}

      {activeTab === 'add' && (
        <ProductForm
          onSave={handleSaveProduct}
          onCancel={() => navigateTo('inventory')}
          editingProduct={editingProduct}
          styles={data.styles || []}
        />
      )}

      {activeTab === 'pending' && (
        <SalesPendingScreen
          sales={data.salesInProgress}
          onCancel={cancelSale}
          onConfirm={confirmSale}
        />
      )}

      {activeTab === 'report' && (
        <SalesReportScreen salesHistory={data.completedSales} styles={data.styles || []} onDelete={deleteSale} />
      )}

      {activeTab === 'styles' && (
        <StyleManagementScreen
          styles={data.styles || []}
          onAdd={addStyle}
          onDelete={deleteStyle}
        />
      )}

      {/* Bottom Navigation */}
      <nav className="nav-bottom">
        <button onClick={() => navigateTo('inventory')} className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}>
          <Package size={24} />
          <span>Estoque</span>
        </button>
        <button onClick={() => navigateTo('add')} className={`nav-item ${activeTab === 'add' ? 'active' : ''}`}>
          <PlusCircle size={24} />
          <span>Cadastrar</span>
        </button>
        <button onClick={() => navigateTo('pending')} className={`nav-item ${activeTab === 'pending' ? 'active' : ''}`}>
          <div style={{ position: 'relative' }}>
            <ShoppingCart size={24} />
            {data.salesInProgress.length > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px' }}>
                {data.salesInProgress.length}
              </span>
            )}
          </div>
          <span>Em Aberto</span>
        </button>
        <button onClick={() => navigateTo('report')} className={`nav-item ${activeTab === 'report' ? 'active' : ''}`}>
          <BarChart3 size={24} />
          <span>Vendas</span>
        </button>
        <button onClick={() => navigateTo('styles')} className={`nav-item ${activeTab === 'styles' ? 'active' : ''}`}>
          <Layers size={24} />
          <span>Estilos</span>
        </button>
        <button onClick={logout} className="nav-item">
          <LogOut size={24} />
          <span>Sair</span>
        </button>
      </nav>
    </div>
  );
}
