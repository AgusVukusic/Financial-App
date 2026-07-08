import React, { useState } from 'react';
import { useGroups } from '../hooks/useGroups';
import { Users, Plus, UserPlus, ArrowLeft } from 'lucide-react';
import GroupDetails from './GroupDetails';
import { motion, AnimatePresence } from 'framer-motion';

const Groups = ({ uid, userName }) => {
  const { groups, createGroup, joinGroup } = useGroups(uid, userName);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  if (selectedGroupId) {
    return <GroupDetails groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} uid={uid} userName={userName} />;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await createGroup(newGroupName);
    setNewGroupName('');
    setIsCreating(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    if (!inviteCode.trim()) return;
    const res = await joinGroup(inviteCode);
    if (res.error) {
      setError(res.error);
    } else {
      setInviteCode('');
      setIsJoining(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="groups-container" style={{ padding: 'var(--spacing-md) 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h2>Grupos</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => { setIsCreating(true); setIsJoining(false); }} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={16} /> Crear
          </button>
          <button onClick={() => { setIsJoining(true); setIsCreating(false); }} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <UserPlus size={16} /> Unirse
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-panel" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px' }}>
              <input type="text" placeholder="Nombre del grupo..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '16px' }} />
              <button type="submit" style={{ background: 'var(--accent-primary)', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Crear</button>
              <button type="button" onClick={() => setIsCreating(false)} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancelar</button>
            </form>
          </motion.div>
        )}

        {isJoining && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass-panel" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" placeholder="Código de invitación..." value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '16px' }} />
                <button type="submit" style={{ background: 'var(--accent-primary)', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Unirse</button>
                <button type="button" onClick={() => setIsJoining(false)} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancelar</button>
              </div>
              {error && <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</span>}
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {groups.map(group => (
          <motion.div 
            key={group.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedGroupId(group.id)}
            className="glass-panel"
            style={{ padding: 'var(--spacing-lg)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--bg-base)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--border-color)' }}>
              <Users size={24} color="var(--accent-primary)" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{group.name}</h3>
              <p className="text-secondary" style={{ margin: 0, fontSize: '0.85rem' }}>
                {group.members.length}&nbsp;{group.members.length === 1 ? 'miembro' : 'miembros'}
              </p>
            </div>
          </motion.div>
        ))}
        {groups.length === 0 && !isCreating && !isJoining && (
          <div className="glass-panel" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            <p className="text-secondary">No estás en ningún grupo. Crea uno o únete con un código.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Groups;
