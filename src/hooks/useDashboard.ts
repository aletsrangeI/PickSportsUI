import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setActiveQuinielaId } from '../store/quinielaSlice';
import {
  useGetQuinielaByIdQuery,
  useUpdateMemberPaymentMutation,
  useGetQuinielasQuery,
} from '../services/api';

export const useDashboard = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const dispatch = useDispatch();
  const activeQuinielaId = useSelector(
    (state: RootState) => state.quiniela.activeQuinielaId
  );
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const { data: quinielasData, isLoading: isQuinielasListLoading } =
    useGetQuinielasQuery();
  const quinielas = quinielasData?.data || [];
  const hasQuinielas = quinielas.length > 0;

  // Si no hay quiniela activa en Redux o no pertenece a la lista actual, usar la primera por defecto
  const effectiveActiveId =
    activeQuinielaId && quinielas.some((q) => q.id === activeQuinielaId)
      ? activeQuinielaId
      : quinielas[0]?.id ?? null;

  useEffect(() => {
    if (effectiveActiveId && effectiveActiveId !== activeQuinielaId) {
      dispatch(setActiveQuinielaId(effectiveActiveId));
    }
  }, [effectiveActiveId, activeQuinielaId, dispatch]);

  const {
    data: quinielaDetailResponse,
    isLoading: isDetailLoading,
    error: detailError,
  } = useGetQuinielaByIdQuery(effectiveActiveId!, {
    skip: !effectiveActiveId,
  });

  const [updatePaymentMutation] = useUpdateMemberPaymentMutation();

  const quiniela = quinielaDetailResponse?.data;
  const isOwnerOrAdmin =
    quiniela?.userRole === 'OWNER' ||
    quiniela?.userRole === 'ADMIN' ||
    currentUser?.role === 'ADMIN';

  const handleCopyInviteCode = () => {
    if (quiniela?.inviteCode) {
      navigator.clipboard.writeText(quiniela.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleTogglePayment = async (memberId: number, currentPaid: boolean) => {
    if (!activeQuinielaId || !isOwnerOrAdmin) return;
    try {
      await updatePaymentMutation({
        quinielaId: activeQuinielaId,
        memberId,
        paidFee: !currentPaid,
      }).unwrap();
    } catch (err) {
      console.error('Error al actualizar pago:', err);
    }
  };

  return {
    quiniela,
    isLoading: isQuinielasListLoading || isDetailLoading,
    hasQuinielas,
    copiedCode,
    isOwnerOrAdmin,
    detailError,
    handleCopyInviteCode,
    handleTogglePayment,
  };
};
