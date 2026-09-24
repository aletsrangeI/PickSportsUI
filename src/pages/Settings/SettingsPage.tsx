import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  FileSpreadsheet,
  CalendarDays,
  LogOut,
  ChevronRight,
  Sparkles,
  Trophy,
  Share2,
  Camera,
  Upload,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { RootState } from '../../store';
import { logout, updateUser } from '../../store/authSlice';
import {
  useGetQuinielasQuery,
  useUploadAvatarMutation,
  useRemoveAvatarMutation,
} from '../../services/api';
import { ClaimLinksModal } from '../../components/admin/ClaimLinksModal';
const processImageToSquareBlob = (file: File, size = 512, quality = 0.88): Promise<Blob> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }

          // Recorte centrado 1:1 (cuadrado)
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            quality
          );
        } catch {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

export const SettingsPage: React.FC = () => {
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const avatarDialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const activeQuinielaId = useSelector((state: RootState) => state.quiniela.activeQuinielaId);
  const { data: quinielasResponse } = useGetQuinielasQuery();
  const activeQuiniela = quinielasResponse?.data?.find(q => q.id === activeQuinielaId);

  const [uploadAvatar, { isLoading: isUploading }] = useUploadAvatarMutation();
  const [removeAvatar, { isLoading: isDeleting }] = useRemoveAvatarMutation();

  const isProcessing = isUploading || isDeleting || isSubmitting;

  const allQuinielas = quinielasResponse?.data || [];
  const isOwner =
    activeQuiniela?.userRole === 'OWNER' ||
    user?.role?.toUpperCase() === 'OWNER' ||
    allQuinielas.some(q => q.userRole === 'OWNER');
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const isOwnerOrAdmin =
    isAdmin ||
    isOwner ||
    activeQuiniela?.userRole === 'ADMIN' ||
    allQuinielas.some(q => q.userRole === 'ADMIN');

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userInitial = (user?.displayName || user?.username || 'U').charAt(0).toUpperCase();

  const handleOpenAvatarModal = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAvatarError(null);
    setAvatarSuccess(null);
    setIsSubmitting(false);
    avatarDialogRef.current?.showModal();
  };

  const handleCloseAvatarModal = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setAvatarError(null);
    setAvatarSuccess(null);
    setIsSubmitting(false);
    avatarDialogRef.current?.close();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    setAvatarSuccess(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const isHeic =
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif') ||
      file.type === 'image/heic' ||
      file.type === 'image/heif';

    if (isHeic) {
      setAvatarError(
        'El formato HEIC no es compatible directamente en navegadores web. Si estás en tu iPhone, selecciona la imagen desde tu "Fototeca" (se convertirá a JPG automáticamente) o cámbiala a JPG/PNG.'
      );
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Formato de imagen no permitido. Se aceptan: JPG, PNG, WEBP o GIF.');
      return;
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setAvatarError('El tamaño del archivo excede el límite máximo de 10 MB.');
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveAvatar = async () => {
    if (!selectedFile || isProcessing) return;

    setAvatarError(null);
    setAvatarSuccess(null);
    setIsSubmitting(true);

    try {
      // Optimizar y recortar a cuadrado 512x512 en el cliente (evita lentitud y problemas de red)
      const squareBlob = await processImageToSquareBlob(selectedFile, 512, 0.88);

      const formData = new FormData();
      const safeName = (selectedFile.name.replace(/\.[^/.]+$/, '') || 'avatar') + '.jpg';
      formData.append('file', squareBlob, safeName);

      const res = await uploadAvatar(formData).unwrap();
      if (res.isSuccess && res.data) {
        dispatch(updateUser(res.data));
        setAvatarSuccess('¡Foto de perfil actualizada exitosamente!');
        setTimeout(() => {
          handleCloseAvatarModal();
        }, 1200);
      } else {
        setAvatarError(res.message || 'No se pudo actualizar la foto de perfil.');
      }
    } catch (err: any) {
      console.error('Error al subir avatar:', err);
      const msg =
        err?.data?.message ||
        (typeof err?.data === 'string' && !err?.data.includes('<html') ? err.data : null) ||
        err?.message ||
        'Error al conectar con el servidor para guardar la foto.';
      setAvatarError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (isProcessing) return;

    setAvatarError(null);
    setAvatarSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await removeAvatar().unwrap();
      if (res.isSuccess && res.data) {
        dispatch(updateUser(res.data));
        setAvatarSuccess('Foto de perfil eliminada.');
        setTimeout(() => {
          handleCloseAvatarModal();
        }, 1200);
      } else {
        setAvatarError(res.message || 'No se pudo eliminar la foto de perfil.');
      }
    } catch (err: any) {
      console.error('Error al eliminar foto:', err);
      setAvatarError(err?.data?.message || err?.message || 'Error al eliminar la foto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-page__header">
        <h1 className="settings-page__title">Ajustes & Cuenta</h1>
        <p className="settings-page__subtitle">
          Administración de tu perfil, quinielas y herramientas del sistema
        </p>
      </div>

      {/* Tarjeta de Perfil de Usuario */}
      <div className="settings-card settings-card--profile">
        <div className="settings-profile">
          <div className="settings-profile__avatar-container">
            <div className="settings-profile__avatar">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || user.username}
                  className="settings-profile__avatar-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector(
                      '.settings-profile__avatar-fallback'
                    ) as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <span
                className="settings-profile__avatar-fallback"
                style={{ display: user?.avatarUrl ? 'none' : 'flex' }}
              >
                {userInitial}
              </span>
            </div>

            <button
              type="button"
              className="settings-profile__avatar-btn"
              onClick={handleOpenAvatarModal}
              title="Cambiar foto de perfil"
              aria-label="Cambiar foto de perfil"
            >
              <Camera size={14} />
            </button>
          </div>

          <div className="settings-profile__info">
            <div className="settings-profile__name-row">
              <h2 className="settings-profile__name">
                {user?.displayName || user?.username}
              </h2>
              {isAdmin && (
                <span className="badge badge--admin">
                  <ShieldCheck size={13} />
                  ADMIN
                </span>
              )}
              {!isAdmin && isOwner && (
                <span className="badge badge--admin">
                  <ShieldCheck size={13} />
                  OWNER
                </span>
              )}
            </div>
            <p className="settings-profile__username">@{user?.username}</p>
            <p className="settings-profile__email">{user?.email}</p>

            <button
              type="button"
              className="settings-profile__photo-action-btn"
              onClick={handleOpenAvatarModal}
            >
              <Camera size={13} />
              <span>{user?.avatarUrl ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}</span>
            </button>
          </div>
        </div>

        {activeQuiniela && (
          <div className="settings-quiniela-info">
            <Trophy size={16} className="text-accent" />
            <span>Quiniela activa: <strong>{activeQuiniela.name}</strong></span>
          </div>
        )}
      </div>

      {/* Sección para Administradores y Owners */}
      {isOwnerOrAdmin && (
        <div className="settings-section">
          <div className="settings-section__header">
            <div className="settings-section__title-row">
              <Sparkles size={18} className="text-primary" />
              <h3 className="settings-section__title">Herramientas de Quiniela & Administración</h3>
            </div>
            <span className="settings-section__badge">Owner / Admin</span>
          </div>

          <div className="settings-grid">
            {/* Tarjeta de Migración XLSX */}
            <Link to="/admin/migracion" className="settings-tool-card settings-tool-card--featured">
              <div className="settings-tool-card__icon settings-tool-card__icon--excel">
                <FileSpreadsheet size={24} />
              </div>
              <div className="settings-tool-card__content">
                <div className="settings-tool-card__heading">
                  <h4 className="settings-tool-card__title">Migración XLSX (SPEC-007)</h4>
                  <span className="badge badge--success">Recomendado</span>
                </div>
                <p className="settings-tool-card__desc">
                  Sube el archivo Excel de la quiniela activa para importar los 9 participantes, 90 partidos, picks históricos y calcular la tabla de posiciones oficial.
                </p>
              </div>
              <ChevronRight size={20} className="settings-tool-card__arrow" />
            </Link>

            {/* Tarjeta de Gestión de Partidos / ESPN */}
            <Link to="/fixtures" className="settings-tool-card">
              <div className="settings-tool-card__icon settings-tool-card__icon--calendar">
                <CalendarDays size={24} />
              </div>
              <div className="settings-tool-card__content">
                <h4 className="settings-tool-card__title">Partidos & Sincronización ESPN</h4>
                <p className="settings-tool-card__desc">
                  Revisa el calendario oficial de Liga MX, marcadores en vivo y resultados actualizados por jornada.
                </p>
              </div>
              <ChevronRight size={20} className="settings-tool-card__arrow" />
            </Link>

            {/* Tarjeta de Activación de Participantes Migrados */}
            <div
              className="settings-tool-card"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsClaimModalOpen(true)}
            >
              <div
                className="settings-tool-card__icon"
                style={{ backgroundColor: 'rgba(37, 211, 102, 0.15)', color: '#25d366' }}
              >
                <Share2 size={24} />
              </div>
              <div className="settings-tool-card__content">
                <div className="settings-tool-card__heading">
                  <h4 className="settings-tool-card__title">Activar Cuentas de Amigos</h4>
                  <span className="badge badge--success" style={{ backgroundColor: '#25d366', color: '#073315' }}>
                    WhatsApp
                  </span>
                </div>
                <p className="settings-tool-card__desc">
                  Comparte a cada participante su enlace personalizado para activar su cuenta y ligar sus puntos acumulados.
                </p>
              </div>
              <ChevronRight size={20} className="settings-tool-card__arrow" />
            </div>
          </div>
        </div>
      )}

      {/* Acciones de Cuenta */}
      <div className="settings-section">
        <h3 className="settings-section__title">Sesión</h3>
        <div className="settings-card">
          <button
            type="button"
            className="btn btn--outline btn--danger-outline btn--full settings-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <ClaimLinksModal
        quinielaId={activeQuinielaId || activeQuiniela?.id || 0}
        quinielaName={activeQuiniela?.name}
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
      />

      {/* Modal Nativo de Subida y Gestión de Avatar */}
      <dialog
        ref={avatarDialogRef}
        className="avatar-modal"
        onClick={(e) => {
          if (e.target === avatarDialogRef.current) handleCloseAvatarModal();
        }}
      >
        <div className="avatar-modal__content">
          <div className="avatar-modal__header">
            <div className="avatar-modal__title-row">
              <Camera size={18} className="text-primary" />
              <h3 className="avatar-modal__title">Foto de Perfil</h3>
            </div>
            <button
              type="button"
              className="btn btn--icon avatar-modal__close-btn"
              onClick={handleCloseAvatarModal}
              disabled={isProcessing}
              title="Cerrar"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <div className="avatar-modal__body">
            {/* Input de archivo oculto */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
            />

            {/* Mensajes de Alerta */}
            {avatarError && (
              <div className="avatar-modal__alert avatar-modal__alert--error">
                <AlertCircle size={16} />
                <span>{avatarError}</span>
              </div>
            )}
            {avatarSuccess && (
              <div className="avatar-modal__alert avatar-modal__alert--success">
                <CheckCircle2 size={16} />
                <span>{avatarSuccess}</span>
              </div>
            )}

            {/* Vista Previa Circular */}
            <div className="avatar-modal__preview-wrapper">
              <div className="avatar-modal__preview">
                {previewUrl ? (
                  <img src={previewUrl} alt="Vista previa" className="avatar-modal__preview-img" />
                ) : user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || user.username}
                    className="avatar-modal__preview-img"
                  />
                ) : (
                  <span className="avatar-modal__preview-fallback">{userInitial}</span>
                )}
              </div>
            </div>

            {selectedFile ? (
              <div className="avatar-modal__file-info">
                <p className="avatar-modal__file-name">{selectedFile.name}</p>
                <p className="avatar-modal__file-size">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  className="btn btn--outline btn--xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  Elegir otra imagen
                </button>
              </div>
            ) : (
              <div className="avatar-modal__guidelines">
                <p>Formatos permitidos: <strong>JPG, PNG, WEBP o GIF</strong></p>
                <p>Tamaño máximo recomendado: <strong>5 MB</strong></p>
                <button
                  type="button"
                  className="btn btn--primary avatar-modal__choose-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <Upload size={16} />
                  <span>Seleccionar imagen</span>
                </button>
              </div>
            )}
          </div>

          <div className="avatar-modal__footer">
            {selectedFile ? (
              <>
                <button
                  type="button"
                  className="btn btn--primary btn--full"
                  onClick={handleSaveAvatar}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Guardando foto...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Guardar como foto de perfil</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--full"
                  onClick={handleCloseAvatarModal}
                  disabled={isProcessing}
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                {user?.avatarUrl && (
                  <button
                    type="button"
                    className="btn btn--outline btn--danger-outline btn--full"
                    onClick={handleDeleteAvatar}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="spin" />
                        <span>Eliminando...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        <span>Eliminar foto actual</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--outline btn--full"
                  onClick={handleCloseAvatarModal}
                  disabled={isProcessing}
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
};
