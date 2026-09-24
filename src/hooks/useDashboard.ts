import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  useGetQuinielaByIdQuery,
  useUpdateMemberPaymentMutation,
  useGetQuinielasQuery,
} from '../services/api';

export const useDashboard = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const activeQuinielaId = useSelector(
    (state: RootState) => state.quiniela.activeQuinielaId
  );
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const { data: quinielasData, isLoading: isQuinielasListLoading } =
    useGetQuinielasQuery();
  const hasQuinielas = (quinielasData?.data?.length || 0) > 0;

  const {
    data: quinielaDetailResponse,
    isLoading: isDetailLoading,
    error: detailError,
  } = useGetQuinielaByIdQuery(activeQuinielaId!, {
    skip: !activeQuinielaId,
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
