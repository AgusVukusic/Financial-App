import React, { useState } from 'react';
import { User, Settings, Trash2, Shield, PlusCircle, CreditCard } from 'lucide-react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { formatCurrency } from '../utils/formatters';

const Profile = ({ userName, onClearData, onExportData, onPaySubscription }) => {
  const { subscriptions, addSubscription, deleteSubscription } = useSubscriptions();
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [subForm, setSubForm] = useState({ description: '', amount: '', category: 'Servicios' });
  const handleClearData = () => {
    if (window.confirm("¿Estás seguro de que deseas borrar todos los registros? Esta acción no se puede deshacer.")) {
      onClearData();
    }
  };

  const handleAddSub = (e) => {
    e.preventDefault();
    if (!subForm.amount || !subForm.description) return;
    addSubscription({
      description: subForm.description,
      amount: parseFloat(subForm.amount),
      category: subForm.category,
      type: 'expense'
    });
    setIsAddingSub(false);
    setSubForm({ description: '', amount: '', category: 'Servicios' });
  };

  return (
    <div className="profile-container animate-fade-in" style={{ padding: 'var(--spacing-md) 0' }}>
      <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Mi Perfil</h2>
      
      <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
          <User size={32} color="white" />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</h3>
          <p className="text-secondary" style={{ margin: 0, fontSize: '0.9rem' }}>Plan Local Activo</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Gastos Fijos / Recurrentes</h3>
            <button onClick={() => setIsAddingSub(!isAddingSub)} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}>
              <PlusCircle size={20} />
            </button>
          </div>

          {isAddingSub && (
            <form onSubmit={handleAddSub} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
              <input type="text" placeholder="Ej. Universidad, Netflix" required value={subForm.description} onChange={e => setSubForm({...subForm, description: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }} />
              <input type="number" placeholder="Monto base estimado" required value={subForm.amount} onChange={e => setSubForm({...subForm, amount: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }} />
              <select value={subForm.category} onChange={e => setSubForm({...subForm, category: e.target.value})} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                <option value="Servicios">Servicios</option>
                <option value="Hogar">Hogar</option>
                <option value="Transporte">Transporte</option>
                <option value="Otros">Otros</option>
              </select>
              <button type="submit" style={{ background: 'var(--accent-primary)', color: 'white', padding: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Guardar Fijo</button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {subscriptions.map(sub => (
              <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{sub.description}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatCurrency(sub.amount)} aprox.</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => onPaySubscription(sub)} style={{ background: 'var(--success-bg)', color: 'var(--success)', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CreditCard size={14} /> Pagar
                  </button>
                  <button onClick={() => deleteSubscription(sub.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {subscriptions.length === 0 && !isAddingSub && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>No tienes gastos fijos registrados.</p>
            )}
          </div>
        </div>

        <button onClick={onExportData} className="glass-panel" style={{ padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)' }}>
          <Shield size={20} className="text-secondary" />
          <span style={{ flex: 1, fontSize: '0.95rem' }}>Exportar Mis Datos (CSV)</span>
        </button>

        <button 
          onClick={handleClearData}
          className="glass-panel" 
          style={{ padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', border: '1px solid var(--danger-bg)', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--danger)', marginTop: 'var(--spacing-md)' }}
        >
          <Trash2 size={20} />
          <span style={{ flex: 1, fontSize: '0.95rem', fontWeight: '500' }}>Borrar todos los datos locales</span>
        </button>
      </div>
    </div>
  );
};

export default Profile;
