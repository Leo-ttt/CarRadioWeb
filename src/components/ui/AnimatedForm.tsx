/**
 * 动画表单组件
 * 带输入动画和提交成功效果
 */

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// ==================== 动画输入框 ====================

interface AnimatedInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}

export const AnimatedInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required,
  disabled,
  icon
}: AnimatedInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = isFocused || value.length > 0;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 浮动标签 */}
      <motion.label
        htmlFor={name}
        className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          isFloating
            ? 'top-1 text-xs text-[#2979FF]'
            : 'top-1/2 -translate-y-1/2 text-gray-400'
        } ${icon ? 'left-12' : 'left-4'}`}
        animate={{
          y: isFloating ? 0 : '-50%',
          scale: isFloating ? 0.85 : 1
        }}
      >
        {label} {required && <span className="text-red-400">*</span>}
      </motion.label>

      {/* 图标 */}
      {icon && (
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
          isFocused ? 'text-[#2979FF]' : 'text-gray-500'
        }`}>
          {icon}
        </div>
      )}

      {/* 输入框 */}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        placeholder={isFloating ? placeholder : ''}
        disabled={disabled}
        className={`w-full pt-6 pb-2 px-4 ${icon ? 'pl-12' : 'pl-4'} bg-gray-800/50 border-2 rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none ${
          error
            ? 'border-red-500 focus:border-red-400'
            : isFocused
            ? 'border-[#2979FF] shadow-[0_0_0_3px_rgba(41,121,255,0.1)]'
            : 'border-gray-700 hover:border-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />

      {/* 错误信息 */}
      <AnimatePresence>
        {error && (
          <motion.p
            className="mt-1 text-sm text-red-400 flex items-center gap-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== 动画文本域 ====================

interface AnimatedTextareaProps extends Omit<AnimatedInputProps, 'type'> {
  rows?: number;
  maxLength?: number;
}

export const AnimatedTextarea = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required,
  disabled,
  rows = 4,
  maxLength
}: AnimatedTextareaProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = isFocused || value.length > 0;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.label
        htmlFor={name}
        className={`absolute left-4 transition-all duration-200 pointer-events-none ${
          isFloating ? 'top-1 text-xs text-[#2979FF]' : 'top-4 text-gray-400'
        }`}
      >
        {label} {required && <span className="text-red-400">*</span>}
      </motion.label>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        placeholder={isFloating ? placeholder : ''}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`w-full pt-6 pb-2 px-4 bg-gray-800/50 border-2 rounded-xl text-white placeholder-gray-500 transition-all duration-300 outline-none resize-none ${
          error
            ? 'border-red-500 focus:border-red-400'
            : isFocused
            ? 'border-[#2979FF] shadow-[0_0_0_3px_rgba(41,121,255,0.1)]'
            : 'border-gray-700 hover:border-gray-600'
        }`}
      />

      {/* 字数统计 */}
      {maxLength && (
        <div className="absolute right-3 bottom-2 text-xs text-gray-500">
          {value.length}/{maxLength}
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            className="mt-1 text-sm text-red-400 flex items-center gap-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== 提交按钮 ====================

interface SubmitButtonProps {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  success?: boolean;
  onClick?: () => void;
}

export const SubmitButton = ({
  children,
  loading,
  disabled,
  success,
  onClick
}: SubmitButtonProps) => {
  return (
    <motion.button
      type="submit"
      disabled={disabled || loading}
      onClick={onClick}
      className={`relative w-full py-4 px-6 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 ${
        success
          ? 'bg-green-500'
          : disabled
          ? 'bg-gray-600 cursor-not-allowed'
          : 'bg-[#2979FF] hover:bg-[#2563eb]'
      }`}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </motion.span>
        ) : success ? (
          <motion.span
            key="success"
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <CheckCircle className="w-5 h-5" />
            Success!
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ==================== 成功弹窗 ====================

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export const SuccessModal = ({ isOpen, onClose, title, message }: SuccessModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 背景遮罩 */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* 弹窗内容 */}
          <motion.div
            className="relative bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700 shadow-2xl"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* 成功图标动画 */}
            <motion.div
              className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <CheckCircle className="w-10 h-10 text-green-500" />
              </motion.div>
            </motion.div>

            <motion.h3
              className="text-2xl font-bold text-white text-center mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {title}
            </motion.h3>

            <motion.p
              className="text-gray-400 text-center mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {message}
            </motion.p>

            <motion.button
              onClick={onClose}
              className="w-full py-3 bg-[#2979FF] hover:bg-[#2563eb] text-white rounded-xl font-semibold transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              OK
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default {
  AnimatedInput,
  AnimatedTextarea,
  SubmitButton,
  SuccessModal
};

