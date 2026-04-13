/**
 * 草稿管理服务
 * 统一管理所有类型文档的草稿保存、恢复、删除
 */

const MAX_DRAFT_AGE_HOURS = 24;
const AUTO_SAVE_INTERVAL_MS = 30000; // 30秒

export type DraftType = 'structured' | 'video' | 'general';

interface DraftData {
  formData: any;
  timestamp: string;
}

interface Draft {
  key: string;
  type: DraftType;
  title: string;
  time: Date;
  data: any;
}

/**
 * 生成草稿存储 key
 */
const getDraftKey = (type: DraftType, id?: string): string => {
  const idPart = id || 'new';
  switch (type) {
    case 'structured':
      return `structured_article_autosave_${idPart}`;
    case 'video':
      return `video_tutorial_autosave_${idPart}`;
    case 'general':
      return `general_document_autosave_${idPart}`;
  }
};

/**
 * 保存草稿到 localStorage
 */
export const saveDraft = (type: DraftType, formData: any, id?: string): void => {
  try {
    const key = getDraftKey(type, id);
    const data: DraftData = {
      formData,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    throw error;
  }
};

/**
 * 加载草稿
 */
export const loadDraft = (type: DraftType, id?: string): DraftData | null => {
  try {
    const key = getDraftKey(type, id);
    const savedData = localStorage.getItem(key);

    if (!savedData) {
      return null;
    }

    const data: DraftData = JSON.parse(savedData);
    const savedTime = new Date(data.timestamp);
    const hoursDiff = (new Date().getTime() - savedTime.getTime()) / (1000 * 60 * 60);

    // 只返回24小时内的草稿
    if (hoursDiff < MAX_DRAFT_AGE_HOURS) {
      return data;
    }

    // 过期草稿自动删除
    localStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
};

/**
 * 删除草稿
 */
export const deleteDraft = (type: DraftType, id?: string): void => {
  try {
    const key = getDraftKey(type, id);
    localStorage.removeItem(key);
  } catch (error) {
    throw error;
  }
};

/**
 * 获取所有草稿列表
 */
export const getAllDrafts = (): Draft[] => {
  const drafts: Draft[] = [];
  const keys = Object.keys(localStorage);

  for (const key of keys) {
    try {
      let draft: Draft | null = null;

      if (key.startsWith('structured_article_autosave_')) {
        const data = JSON.parse(localStorage.getItem(key) || '');
        const timestamp = new Date(data.timestamp);
        const hoursDiff = (new Date().getTime() - timestamp.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < MAX_DRAFT_AGE_HOURS) {
          draft = {
            key,
            type: 'structured',
            title: data.formData?.basicInfo?.title || '未命名车型资料',
            time: timestamp,
            data: data.formData
          };
        }
      } else if (key.startsWith('video_tutorial_autosave_')) {
        const data = JSON.parse(localStorage.getItem(key) || '');
        const timestamp = new Date(data.timestamp);
        const hoursDiff = (new Date().getTime() - timestamp.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < MAX_DRAFT_AGE_HOURS) {
          draft = {
            key,
            type: 'video',
            title: data.formData?.title || '未命名视频教程',
            time: timestamp,
            data: data.formData
          };
        }
      } else if (key.startsWith('general_document_autosave_')) {
        const data = JSON.parse(localStorage.getItem(key) || '');
        const timestamp = new Date(data.timestamp);
        const hoursDiff = (new Date().getTime() - timestamp.getTime()) / (1000 * 60 * 60);

        if (hoursDiff < MAX_DRAFT_AGE_HOURS) {
          draft = {
            key,
            type: 'general',
            title: data.formData?.title || '未命名图文教程',
            time: timestamp,
            data: data.formData
          };
        }
      }

      if (draft) {
        drafts.push(draft);
      }
    } catch {
      // Skip malformed draft entry
    }
  }

  // 按时间倒序排列
  return drafts.sort((a, b) => b.time.getTime() - a.time.getTime());
};

/**
 * 删除指定 key 的草稿
 */
export const deleteDraftByKey = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    throw error;
  }
};

/**
 * 创建自动保存定时器
 */
export const createAutoSaveTimer = (
  type: DraftType,
  getFormData: () => any,
  id?: string
): NodeJS.Timeout => {
  return setInterval(() => {
    const formData = getFormData();
    saveDraft(type, formData, id);
  }, AUTO_SAVE_INTERVAL_MS);
};

/**
 * 清除自动保存定时器
 */
export const clearAutoSaveTimer = (timer: NodeJS.Timeout | null): void => {
  if (timer) {
    clearInterval(timer);
  }
};

export type { Draft, DraftData };
