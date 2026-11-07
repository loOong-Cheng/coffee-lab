import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryStorage, initLearnerStore } from '../state';
import { detectDefaultLocale, htmlLang, translate, useI18n } from './index';

describe('locale helpers', () => {
  it('detectDefaultLocale: zh* → zh, else en', () => {
    expect(detectDefaultLocale(['zh-CN'])).toBe('zh');
    expect(detectDefaultLocale(['zh-Hant-TW', 'en'])).toBe('zh');
    expect(detectDefaultLocale(['ZH'])).toBe('zh');
    expect(detectDefaultLocale(['en-US', 'zh-CN'])).toBe('en');
    expect(detectDefaultLocale(['fr'])).toBe('en');
    expect(detectDefaultLocale([])).toBe('en');
    expect(detectDefaultLocale([undefined, 'zh-SG'])).toBe('zh');
  });

  it('htmlLang', () => {
    expect(htmlLang('zh')).toBe('zh-CN');
    expect(htmlLang('en')).toBe('en');
  });

  it('translate falls back to the other language', () => {
    expect(translate({ zh: '开始', en: 'Start' }, 'zh')).toBe('开始');
    expect(translate({ zh: '', en: 'Start' }, 'zh')).toBe('Start');
    expect(translate(undefined, 'en')).toBe('');
  });
});

describe('useI18n', () => {
  beforeEach(() => {
    initLearnerStore(createMemoryStorage());
  });

  it('t() follows the persisted locale and setLocale switches it', () => {
    const { result } = renderHook(() => useI18n());
    act(() => result.current.setLocale('en'));
    expect(result.current.t({ zh: '学习', en: 'Learn' })).toBe('Learn');
    act(() => result.current.setLocale('zh'));
    expect(result.current.locale).toBe('zh');
    expect(result.current.t({ zh: '学习', en: 'Learn' })).toBe('学习');
  });
});
