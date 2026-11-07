import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { usePwaStatus } from '../platform';
import { useToast } from '../ui';

const S = {
  updateTitle: { zh: '有新版本', en: 'New version available' },
  updateBody: {
    zh: '准备好时再刷新——正在冲煮时不必中断。',
    en: 'Reload when you are ready — no need to interrupt a brew.',
  },
  reload: { zh: '刷新', en: 'Reload' },
};

/** Lead glue: non-forced "update available" prompt (renders nothing itself). Offline readiness is shown in Settings. */
export function PwaNotices() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { offlineReadyNow, updateAvailable, applyUpdate, acknowledgeOfflineReady } = usePwaStatus();
  const updateShown = useRef(false);

  // "Ready offline" is informational only: acknowledge silently (no overlay that can cover navigation).
  // Settings shows offline status instead.
  useEffect(() => {
    if (offlineReadyNow) acknowledgeOfflineReady();
  }, [offlineReadyNow, acknowledgeOfflineReady]);

  useEffect(() => {
    if (!updateAvailable || updateShown.current) return;
    updateShown.current = true;
    toast({
      title: t(S.updateTitle),
      description: t(S.updateBody),
      tone: 'info',
      duration: 0,
      action: { label: t(S.reload), onClick: applyUpdate },
    });
  }, [updateAvailable, applyUpdate, toast, t]);

  return null;
}
