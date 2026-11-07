import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { usePwaStatus } from '../platform';
import { useToast } from '../ui';

const S = {
  offlineTitle: { zh: '已可离线使用', en: 'Ready to work offline' },
  offlineBody: {
    zh: '课程、厨房模式、日志和图鉴现在没有网络也能打开（XR 3D 需先在线打开一次）。',
    en: 'Lessons, kitchen mode, journal and atlas now open without a connection (XR 3D needs one online visit first).',
  },
  updateTitle: { zh: '有新版本', en: 'New version available' },
  updateBody: {
    zh: '准备好时再刷新——正在冲煮时不必中断。',
    en: 'Reload when you are ready — no need to interrupt a brew.',
  },
  reload: { zh: '刷新', en: 'Reload' },
};

/** Lead glue: one-time "offline ready" toast and a non-forced "update available" prompt (renders nothing itself). */
export function PwaNotices() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { offlineReadyNow, updateAvailable, applyUpdate, acknowledgeOfflineReady } = usePwaStatus();
  const updateShown = useRef(false);
  const offlineShown = useRef(false);

  useEffect(() => {
    if (!offlineReadyNow || offlineShown.current) return;
    offlineShown.current = true;
    toast({ title: t(S.offlineTitle), description: t(S.offlineBody), tone: 'success', icon: 'check' });
    acknowledgeOfflineReady();
  }, [offlineReadyNow, acknowledgeOfflineReady, toast, t]);

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
