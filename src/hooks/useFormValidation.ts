import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 验证规则类型
 */
export interface ValidationRule {
  required?: boolean | string;
  minLength?: number | { value: number; message?: string };
  maxLength?: number | { value: number; message?: string };
  pattern?: RegExp | { value: RegExp; message?: string };
  email?: boolean | string;
  url?: boolean | string;
  number?: boolean | string;
  min?: number | { value: number; message?: string };
  max?: number | { value: number; message?: string };
  custom?: (value: any, formData: any) => string | null;
}

/**
 * 表单字段配置
 */
export interface FormField {
  rules?: ValidationRule;
  transform?: (value: any) => any;
  dependencies?: string[];
}

/**
 * 表单配置
 */
export interface FormConfig {
  [key: string]: FormField;
}

/**
 * 验证结果
 */
export interface ValidationErrors {
  [key: string]: string;
}

/**
 * 表单状态
 */
export interface FormState<T = any> {
  data: T;
  errors: ValidationErrors;
  touched: { [key: string]: boolean };
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

/**
 * 表单操作
 */
export interface FormActions<T = any> {
  setValue: (field: string, value: any) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: string, error: string) => void;
  setErrors: (errors: ValidationErrors) => void;
  clearError: (field: string) => void;
  clearErrors: () => void;
  setTouched: (field: string, touched?: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  reset: (newData?: T) => void;
  validate: (field?: string) => boolean;
  validateAll: () => boolean;
  handleSubmit: (onSubmit: (data: T) => Promise<void> | void) => (e?: React.FormEvent) => Promise<void>;
}

/**
 * 通用表单验证Hook
 */
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  config: FormConfig = {}
): [FormState<T>, FormActions<T>] {
  const { t } = useTranslation();

  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialDataRef] = useState(initialData);

  // 计算派生状态
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);
  const isDirty = useMemo(() =>
    JSON.stringify(data) !== JSON.stringify(initialDataRef),
    [data, initialDataRef]
  );

  /**
   * 验证单个字段
   */
  const validateField = useCallback((field: string, value: any, allData: T): string | null => {
    const fieldConfig = config[field];
    if (!fieldConfig?.rules) {return null;}

    const rules = fieldConfig.rules;

    // 必填验证
    if (rules.required) {
      const isEmpty = value === null || value === undefined ||
        (typeof value === 'string' && value.trim() === '') ||
        (Array.isArray(value) && value.length === 0);

      if (isEmpty) {
        return typeof rules.required === 'string'
          ? rules.required
          : t('validation.required', { field });
      }
    }

    // 如果值为空且不是必填，跳过其他验证
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // 字符串长度验证
    if (typeof value === 'string') {
      if (rules.minLength) {
        const minLength = typeof rules.minLength === 'number' ? rules.minLength : rules.minLength.value;
        if (value.length < minLength) {
          return typeof rules.minLength === 'object' && rules.minLength.message
            ? rules.minLength.message
            : t('validation.minLength', { field, min: minLength });
        }
      }

      if (rules.maxLength) {
        const maxLength = typeof rules.maxLength === 'number' ? rules.maxLength : rules.maxLength.value;
        if (value.length > maxLength) {
          return typeof rules.maxLength === 'object' && rules.maxLength.message
            ? rules.maxLength.message
            : t('validation.maxLength', { field, max: maxLength });
        }
      }

      // 邮箱验证
      if (rules.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return typeof rules.email === 'string'
            ? rules.email
            : t('validation.email', { field });
        }
      }

      // URL验证
      if (rules.url) {
        try {
          new URL(value);
        } catch {
          return typeof rules.url === 'string'
            ? rules.url
            : t('validation.url', { field });
        }
      }
    }

    // 数字验证
    if (rules.number) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return typeof rules.number === 'string'
          ? rules.number
          : t('validation.number', { field });
      }

      if (rules.min) {
        const min = typeof rules.min === 'number' ? rules.min : rules.min.value;
        if (numValue < min) {
          return typeof rules.min === 'object' && rules.min.message
            ? rules.min.message
            : t('validation.min', { field, min });
        }
      }

      if (rules.max) {
        const max = typeof rules.max === 'number' ? rules.max : rules.max.value;
        if (numValue > max) {
          return typeof rules.max === 'object' && rules.max.message
            ? rules.max.message
            : t('validation.max', { field, max });
        }
      }
    }

    // 正则表达式验证
    if (rules.pattern) {
      const patternObj = rules.pattern instanceof RegExp
        ? { value: rules.pattern, message: undefined }
        : rules.pattern;

      if (!patternObj.value.test(String(value))) {
        return patternObj.message || t('validation.pattern', { field });
      }
    }

    // 自定义验证
    if (rules.custom) {
      return rules.custom(value, allData);
    }

    return null;
  }, [config, t]);

  /**
   * 验证所有字段
   */
  const validateAll = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    Object.keys(config).forEach(field => {
      const error = validateField(field, data[field], data);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [config, data, validateField]);

  /**
   * 验证单个字段
   */
  const validate = useCallback((field?: string): boolean => {
    if (field) {
      const error = validateField(field, data[field], data);
      setErrors(prev => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
        return newErrors;
      });
      return !error;
    } else {
      return validateAll();
    }
  }, [data, validateField, validateAll]);

  /**
   * 设置字段值
   */
  const setValue = useCallback((field: string, value: any) => {
    const fieldConfig = config[field];
    const transformedValue = fieldConfig?.transform ? fieldConfig.transform(value) : value;

    setData(prev => ({ ...prev, [field]: transformedValue }));

    // 如果字段已经被触摸过，立即验证
    if (touched[field]) {
      setTimeout(() => validate(field), 0);
    }

    // 验证依赖字段
    if (fieldConfig?.dependencies) {
      fieldConfig.dependencies.forEach((depField: string) => {
        if (touched[depField]) {
          setTimeout(() => validate(depField), 0);
        }
      });
    }
  }, [config, touched, validate]);

  /**
   * 批量设置值
   */
  const setValues = useCallback((values: Partial<T>) => {
    setData(prev => ({ ...prev, ...values }));

    // 验证已触摸的字段
    Object.keys(values).forEach(field => {
      if (touched[field]) {
        setTimeout(() => validate(field), 0);
      }
    });
  }, [touched, validate]);

  /**
   * 设置字段错误
   */
  const setError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  /**
   * 批量设置错误
   */
  const setErrorsAction = useCallback((newErrors: ValidationErrors) => {
    setErrors(newErrors);
  }, []);

  /**
   * 清除字段错误
   */
  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  /**
   * 清除所有错误
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * 设置字段触摸状态
   */
  const setTouchedAction = useCallback((field: string, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));

    // 如果设置为已触摸，立即验证
    if (isTouched) {
      setTimeout(() => validate(field), 0);
    }
  }, [validate]);

  /**
   * 重置表单
   */
  const reset = useCallback((newData?: T) => {
    const resetData = newData || initialData;
    setData(resetData);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialData]);

  /**
   * 处理表单提交
   */
  const handleSubmit = useCallback((onSubmit: (data: T) => Promise<void> | void) => {
    return async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // 标记所有字段为已触摸
      const allFields = Object.keys(config);
      const newTouched: { [key: string]: boolean } = {};
      allFields.forEach(field => {
        newTouched[field] = true;
      });
      setTouched(prev => ({ ...prev, ...newTouched }));

      // 验证所有字段
      if (!validateAll()) {
        return;
      }

      setIsSubmitting(true);

      try {
        await onSubmit(data);
      } catch {
        // Error already handled by caller
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [config, data, validateAll]);

  const formState: FormState<T> = {
    data,
    errors,
    touched,
    isValid,
    isSubmitting,
    isDirty,
  };

  const formActions: FormActions<T> = {
    setValue,
    setValues,
    setError,
    setErrors: setErrorsAction,
    clearError,
    clearErrors,
    setTouched: setTouchedAction,
    setSubmitting: setIsSubmitting,
    reset,
    validate,
    validateAll,
    handleSubmit,
  };

  return [formState, formActions];
}

/**
 * 常用验证规则
 */
export const validationRules = {
  required: (message?: string): ValidationRule => ({
    required: message || true,
  }),

  email: (message?: string): ValidationRule => ({
    email: message || true,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    minLength: message ? { value: length, message } : length,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    maxLength: message ? { value: length, message } : length,
  }),

  pattern: (regex: RegExp, message?: string): ValidationRule => ({
    pattern: message ? { value: regex, message } : regex,
  }),

  number: (message?: string): ValidationRule => ({
    number: message || true,
  }),

  min: (value: number, message?: string): ValidationRule => ({
    min: message ? { value, message } : value,
  }),

  max: (value: number, message?: string): ValidationRule => ({
    max: message ? { value, message } : value,
  }),

  url: (message?: string): ValidationRule => ({
    url: message || true,
  }),

  custom: (validator: (value: any, formData: any) => string | null): ValidationRule => ({
    custom: validator,
  }),
};
