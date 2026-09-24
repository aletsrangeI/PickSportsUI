import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Trophy, ChevronDown, Check, Plus, UserPlus } from 'lucide-react';
import type { RootState } from '../../store';
import { setActiveQuinielaId } from '../../store/quinielaSlice';
import { useGetQuinielasQuery } from '../../services/api';
import './QuinielaSelector.css';

interface QuinielaSelectorProps {
  onCreateClick: () => void;
  onJoinClick: () => void;
}

export const QuinielaSelector: React.FC<QuinielaSelectorProps> = ({
  onCreateClick,
  onJoinClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();

  const activeQuinielaId = useSelector(
    (state: RootState) => state.quiniela.activeQuinielaId
  );
  const { data: quinielasResponse, isLoading } = useGetQuinielasQuery();
  const quinielas = quinielasResponse?.data || [];

  // Si no hay quiniela activa seleccionada pero hay disponibles, seleccionar la primera por defecto
  useEffect(() => {
    if (quinielas.length > 0 && !activeQuinielaId) {
      dispatch(setActiveQuinielaId(quinielas[0].id));
    }
  }, [quinielas, activeQuinielaId, dispatch]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeQuiniela = quinielas.find((q) => q.id === activeQuinielaId);

  const handleSelect = (id: number) => {
    dispatch(setActiveQuinielaId(id));
    setIsOpen(false);
  };

  return (
    <div className="quiniela-selector" ref={dropdownRef}>
      <button
        type="button"
        className="quiniela-selector__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Trophy className="quiniela-selector__icon" size={18} />
        <span className="quiniela-selector__name">
          {isLoading
            ? 'Cargando...'
            : activeQuiniela?.name || 'Selecciona Quiniela'}
        </span>
        {activeQuiniela && (
          <span className="quiniela-selector__badge">
            {activeQuiniela.leagueCode}
          </span>
        )}
        <ChevronDown
          className={`quiniela-selector__chevron ${
            isOpen ? 'quiniela-selector__chevron--open' : ''
          }`}
          size={16}
        />
      </button>

      {isOpen && (
        <div className="quiniela-selector__dropdown" role="listbox">
          <ul className="quiniela-selector__list">
            {quinielas.length === 0 ? (
              <li className="quiniela-selector__item" style={{ cursor: 'default' }}>
                <span className="quiniela-selector__item-subtitle">
                  No estás en ninguna quiniela
                </span>
              </li>
            ) : (
              quinielas.map((q) => {
                const isActive = q.id === activeQuinielaId;
                return (
                  <li
                    key={q.id}
                    className={`quiniela-selector__item ${
                      isActive ? 'quiniela-selector__item--active' : ''
                    }`}
                    onClick={() => handleSelect(q.id)}
                    role="option"
                    aria-selected={isActive}
                  >
                    <div className="quiniela-selector__item-info">
                      <span className="quiniela-selector__item-title">
                        {q.name}
                      </span>
                      <span className="quiniela-selector__item-subtitle">
                        {q.leagueName} • {q.membersCount} miembros • Rol: {q.userRole}
                      </span>
                    </div>
                    {isActive && <Check size={16} />}
                  </li>
                );
              })
            )}
          </ul>

          <div className="quiniela-selector__divider" />

          <div className="quiniela-selector__actions">
            <button
              type="button"
              className="quiniela-selector__action-btn"
              onClick={() => {
                setIsOpen(false);
                onCreateClick();
              }}
            >
              <Plus size={16} />
              Crear nueva quiniela
            </button>
            <button
              type="button"
              className="quiniela-selector__action-btn"
              onClick={() => {
                setIsOpen(false);
                onJoinClick();
              }}
            >
              <UserPlus size={16} />
              Unirse con código
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
