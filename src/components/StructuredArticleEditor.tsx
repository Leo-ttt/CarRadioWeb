import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/Toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
// 移除未使用的 lazy 定义，使用包装好的懒加载组件
import ImageUpload from '@/components/ImageUpload';
// 不再使用localStorage获取车型，改为从结构化文档中提取
import { saveDraft, loadDraft, deleteDraft } from '@/services/draftService';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Car,
  Monitor,
  Settings,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
const CompatibleModelsSection = lazy(() => import('./structured-article/CompatibleModelsSection'));
const IncompatibleModelsSection = lazy(() => import('./structured-article/IncompatibleModelsSection'));
const FAQsSection = lazy(() => import('./structured-article/FAQsSection'));
import LazyRichTextEditor from '@/components/LazyRichTextEditor';

// 重构接口：将原车主机和可选模块嵌套到每个适配型号中
interface OriginalHost {
  frontImage: string;
  backImage: string;
  pinDefinitionImage: string;
  description: string;
  partNumber?: string; // 新增零件号字段
  frontImageDescription?: string; // 新增
  backImageDescription?: string; // 新增
  pinDefinitionDescription?: string; // 新增
  wiringDiagram?: string; // 新增线束连接图
}

interface OptionalModules {
  airConditioningPanel: {
    image: string;
    description: string;
    partNumber?: string; // 新增零件号字段
    interfaceImage?: string; // 新增接口图片
  };
  displayBackPanel: {
    image: string;
    description: string;
    partNumber?: string; // 新增零件号字段
    interfaceImage?: string; // 新增接口图片
  };
  dashboardPanel: {
    image: string;
    description: string;
    partNumber?: string; // 新增零件号字段
    interfaceImage?: string; // 新增接口图片
  };
}

interface CompatibleModel {
  id: string;
  name: string;
  dashboardImage: string;
  description: string;
  originalHost: OriginalHost;
  optionalModules: OptionalModules;
}

interface IncompatibleModel {
  id: string;
  name: string;
  dashboardImage: string;
  description: string;
}

interface FAQ {
  id: string;
  title: string;
  description: string;
  images: string[];
  // linkedModels 已移除，因为FAQ本身就是针对当前车型的
}

interface UserFeedback {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  replies?: UserReply[];
}

interface UserReply {
  id: string;
  author: string;
  content: string;
  timestamp: number;
}

interface StructuredArticle {
  id: string | number;
  basicInfo: {
    title: string;
    author?: string;
    vehicleImage: string;
    introduction: string;
    importantNotes?: string;
    brand: string;
    model: string;
    yearRange: string;
  };
  features: {
    supported: string[];
    unsupported: string[];
  };
  compatibleModels: CompatibleModel[];
  incompatibleModels: IncompatibleModel[];
  faqs: FAQ[];
  feedback: UserFeedback[];
}

interface StructuredArticleEditorProps {
  article?: any; // 使用 any 类型来兼容不同的数据结构
  onSave: (article: any) => void;
  onCancel: () => void;
}

// 添加Section接口类型定义
interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
}

const StructuredArticleEditor: React.FC<StructuredArticleEditorProps> = ({
  article,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [vehicles, setVehicles] = useState<any[]>([]);

  // 自动保存状态
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [draftRestore, setDraftRestore] = useState<{ show: boolean; data: any; time: Date | null }>({ show: false, data: null, time: null });
  const [isInitialMount, setIsInitialMount] = useState(true);

  // 为sections数组添加明确的类型声明 - 使用useMemo避免重复创建
  const sections: Section[] = React.useMemo(() => [
    { id: 'basic', title: t('admin.structuredArticle.basicInfo'), icon: Car },
    { id: 'features', title: t('admin.structuredArticle.features'), icon: Settings },
    { id: 'compatible', title: t('admin.structuredArticle.compatibleModels'), icon: Monitor },
    { id: 'incompatible', title: t('admin.structuredArticle.incompatibleModels'), icon: Monitor },
    { id: 'faqs', title: t('admin.structuredArticle.faqs'), icon: FileText }
  ], [t]);

  const [activeSection, setActiveSection] = useState(0);

  // 确保activeSection在有效范围内
  const safeSetActiveSection = useCallback((index: number) => {
    const safeIndex = Math.max(0, Math.min(sections.length - 1, index));
    console.log(`Setting active section from ${activeSection} to ${safeIndex}`);
    setActiveSection(safeIndex);
  }, [activeSection, sections.length]);

  // 添加状态变更监听和错误恢复
  useEffect(() => {
    console.log('Active section changed to:', activeSection, sections[activeSection]?.title);

    // 如果当前索引超出范围，自动修正
    if (activeSection >= sections.length || activeSection < 0) {
      console.warn('Invalid active section detected, resetting to 0');
      setActiveSection(0);
    }
  }, [activeSection, sections.length]);

  const [formData, setFormData] = useState<StructuredArticle>(() => {
    // 如果是编辑已有文章，需要转换数据结构
    if (article) {
      console.log('Editing article:', article);
      console.log('Article supportedFeatures:', article.supportedFeatures);
      console.log('Article unsupportedFeatures:', article.unsupportedFeatures);

      return {
        id: article.id || Date.now(),
                 basicInfo: {
           title: article.title || article.basicInfo?.title || '',
           vehicleImage: article.vehicleImage || article.basicInfo?.vehicleImage || '',
           introduction: article.introduction || article.basicInfo?.introduction || '',
           brand: article.brand || article.basicInfo?.brand || '',
           model: article.model || article.basicInfo?.model || '',
           yearRange: article.yearRange || article.basicInfo?.yearRange || ''
         },
                 features: {
           supported: Array.isArray(article.supportedFeatures)
             ? article.supportedFeatures.map((f: any) => typeof f === 'string' ? f : f.name || '')
             : Array.isArray(article.features?.supported)
               ? article.features.supported.map((f: any) => typeof f === 'string' ? f : f.name || '')
               : [],
           unsupported: Array.isArray(article.unsupportedFeatures)
             ? article.unsupportedFeatures.map((f: any) => typeof f === 'string' ? f : f.name || '')
             : Array.isArray(article.features?.unsupported)
               ? article.features.unsupported.map((f: any) => typeof f === 'string' ? f : f.name || '')
               : []
         },
        compatibleModels: article.compatibleModels ? article.compatibleModels.map((model: any, index: number) => ({
          id: model.id || `compatible_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          name: model.modelName || model.name || '',
          dashboardImage: model.dashboardImage || '',
          description: model.description || '',
          originalHost: {
            frontImage: model.originalHost?.frontImage || '',
            backImage: model.originalHost?.backImage || '',
            pinDefinitionImage: model.originalHost?.pinDefinitionImage || '',
            description: model.originalHost?.hostDescription || model.originalHost?.description || '',
            partNumber: model.originalHost?.partNumber || '',
            frontImageDescription: model.originalHost?.frontImageDescription || '',
            backImageDescription: model.originalHost?.backImageDescription || '',
            pinDefinitionDescription: model.originalHost?.pinDefinitionDescription || '',
            wiringDiagram: model.originalHost?.wiringDiagram || ''
          },
          optionalModules: {
            airConditioningPanel: {
              image: model.optionalModules?.airConditioningPanel?.image || '',
              description: model.optionalModules?.airConditioningPanel?.description || '',
              partNumber: model.optionalModules?.airConditioningPanel?.partNumber || '',
              interfaceImage: model.optionalModules?.airConditioningPanel?.interfaceImage || ''
            },
            displayBackPanel: {
              image: model.optionalModules?.displayBackPanel?.image || '',
              description: model.optionalModules?.displayBackPanel?.description || '',
              partNumber: model.optionalModules?.displayBackPanel?.partNumber || '',
              interfaceImage: model.optionalModules?.displayBackPanel?.interfaceImage || ''
            },
            dashboardPanel: {
              image: model.optionalModules?.dashboardPanel?.image || '',
              description: model.optionalModules?.dashboardPanel?.description || '',
              partNumber: model.optionalModules?.dashboardPanel?.partNumber || '',
              interfaceImage: model.optionalModules?.dashboardPanel?.interfaceImage || ''
            }
          }
        })) : [],
        incompatibleModels: article.incompatibleModels ? article.incompatibleModels.map((model: any, index: number) => ({
          id: model.id || `incompatible_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          name: model.modelName || model.name || '',
          dashboardImage: model.dashboardImage || '',
          description: model.description || ''
        })) : [],
        faqs: article.faqs ? article.faqs.map((faq: any) => ({
          id: faq.id || `faq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: faq.title || '',
          description: faq.description || '',
          images: faq.images || [],
          // linkedModels 已移除
        })) : [],
        feedback: article.userFeedback ? article.userFeedback.map((feedback: any) => ({
          id: feedback.id || `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          author: feedback.user || feedback.author || '',
          content: feedback.content || '',
          timestamp: feedback.timestamp || new Date(feedback.date).getTime(),
          replies: feedback.replies || []
        })) : []
      };
    }

    // 新建文章
    return {
      id: Date.now(),
      basicInfo: {
        title: '',
        vehicleImage: '',
        introduction: '',
        brand: '',
        model: '',
        yearRange: ''
      },
      features: {
        supported: [],
        unsupported: []
      },
      compatibleModels: [],
      incompatibleModels: [],
      faqs: [],
      feedback: []
    };
  });

  const [newSupportedFeature, setNewSupportedFeature] = useState('');
  const [newUnsupportedFeature, setNewUnsupportedFeature] = useState('');

  // 自动保存到localStorage
  const autoSaveToLocalStorage = useCallback(() => {
    try {
      saveDraft('structured', formData, article?.id);
      setAutoSaveStatus('saved');
      setLastSaveTime(new Date());
      console.log('自动保存成功');
    } catch (error) {
      console.error('自动保存失败:', error);
      setAutoSaveStatus('unsaved');
    }
  }, [formData, article?.id]);

  // 从localStorage恢复数据
  useEffect(() => {
    if (!article) {
      const draftData = loadDraft('structured', article?.id);

      if (draftData) {
        setDraftRestore({
          show: true,
          data: draftData.formData,
          time: new Date(draftData.timestamp)
        });
      }
    }
  }, [article]);

  // 监听formData变化，debounce自动保存
  useEffect(() => {
    // 跳过初始挂载
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }

    setAutoSaveStatus('unsaved');

    // 3秒后自动保存
    const timer = setTimeout(() => {
      if (formData.basicInfo.title || formData.basicInfo.introduction) {
        setAutoSaveStatus('saving');
        autoSaveToLocalStorage();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [formData, autoSaveToLocalStorage, isInitialMount]);

  // 车型数据不再从localStorage加载（暂时移除车型选择功能，或后续从API加载）
  useEffect(() => {
    // 从后端加载车型列表，用于下拉选择
    let isMounted = true
    import('@/services/vehicleService').then(async ({ getVehicles }) => {
      try {
        const list = await getVehicles()
        if (isMounted) {
          // 统一映射字段，确保有 id/brand/model/year
          setVehicles(
            (list || []).map((v: any) => ({
              id: v.id || v._id || `${v.brand}-${v.model}-${v.year}`,
              brand: v.brand || '',
              model: v.model || v.modelName || '',
              year: v.year || ''
            }))
          )
        }
      } catch (err) {
        console.error('加载车型失败:', err)
        if (isMounted) {setVehicles([])}
      }
    })
    return () => { isMounted = false }
  }, []);

  // 添加数据持久化保护
  useEffect(() => {
    // 组件卸载前保存草稿
    return () => {
      if (formData.basicInfo.title || formData.basicInfo.introduction) {
        saveDraft('structured', formData, article?.id);
      }
    };
  }, [formData, article?.id]);

  // 当 article 改变时重新初始化 formData
  useEffect(() => {
    if (article) {
      console.log('Article changed, reinitializing formData:', article);
      console.log('Article basicInfo importantNotes:', article.basicInfo?.importantNotes);

      const newFormData: StructuredArticle = {
        id: formData.id,
        basicInfo: {
          title: formData.basicInfo.title,
          vehicleImage: formData.basicInfo.vehicleImage,
          introduction: formData.basicInfo.introduction,
          brand: formData.basicInfo.brand,
          model: formData.basicInfo.model,
          yearRange: formData.basicInfo.yearRange,
        },
        features: {
          supported: formData.features.supported,
          unsupported: formData.features.unsupported,
        },
        compatibleModels: formData.compatibleModels,
        incompatibleModels: formData.incompatibleModels,
        faqs: formData.faqs,
        feedback: [], // 添加缺失的feedback字段
      };

      console.log('Setting new formData:', newFormData);
      setFormData(newFormData);
    }
  }, [article]);

  // 组件加载时恢复草稿
  useEffect(() => {
    if (!article) {
      const draft = loadDraft('structured', undefined);
      if (draft) {
        setDraftRestore({ show: true, data: draft.formData, time: new Date(draft.timestamp) });
      }
    }
  }, [article]);

  // 加载用户留言数据
  useEffect(() => {
    if (article && article.id) {
      const loadFeedback = async () => {
        // TODO: 实现反馈加载功能
        // const feedback = await getDocumentFeedback(article.id)
        // setFeedbackList(feedback)

        // 同步到 formData 以保持兼容性
        // setFormData(prev => ({
        //   ...prev,
        //   feedback: feedback.map((fb: any) => ({
        //     id: fb.id,
        //     author: fb.author,
        //     content: fb.content,
        //     timestamp: fb.timestamp,
        //     replies: fb.replies
        //   }))
        // }))

        // console.log(`Loaded ${feedback.length} feedback items for document ${article.id}`)
      }
      loadFeedback()
    }
  }, [article]);

  const handleBasicInfoChange = useCallback((field: keyof typeof formData.basicInfo, value: string) => {
    console.log(`handleBasicInfoChange called: field=${field}, value=`, value);
    setFormData(prev => {
      const newFormData = {
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          [field]: value
        }
      };
      console.log('Updated formData:', newFormData);
      return newFormData;
    });
  }, []);

  // 保存时转换数据结构以匹配查看器期望的格式
  const handleSave = () => {
    console.log('StructuredArticleEditor: handleSave called');
    console.log('StructuredArticleEditor: Current formData:', formData);

         // 数据验证
     const errors = [];

     if (!formData.basicInfo.title?.trim()) {
       errors.push(t('admin.structuredArticle.validation.titleRequired'));
     }

     if (!formData.basicInfo.brand?.trim()) {
       errors.push(t('admin.structuredArticle.validation.brandRequired'));
     }

     if (!formData.basicInfo.model?.trim()) {
       errors.push(t('admin.structuredArticle.validation.modelRequired'));
     }

     if (!formData.basicInfo.yearRange?.trim()) {
       errors.push(t('admin.structuredArticle.validation.yearRangeRequired'));
     }

     if (!formData.basicInfo.introduction?.trim()) {
       errors.push(t('admin.structuredArticle.validation.introductionRequired'));
     }

     // 检查适配型号
     if (formData.compatibleModels.length === 0) {
       errors.push(t('admin.structuredArticle.validation.compatibleModelsRequired'));
     } else {
       formData.compatibleModels.forEach((model, index) => {
         if (!model.name?.trim()) {
           errors.push(t('admin.structuredArticle.validation.compatibleModelNameRequired', { index: index + 1 }));
         }
         if (!model.description?.trim()) {
           errors.push(t('admin.structuredArticle.validation.compatibleModelDescRequired', { index: index + 1 }));
         }
       });
     }

     // 检查FAQ
     if (formData.faqs.length === 0) {
       errors.push(t('admin.structuredArticle.validation.faqsRequired'));
     } else {
       formData.faqs.forEach((faq, index) => {
         if (!faq.title?.trim()) {
           errors.push(t('admin.structuredArticle.validation.faqTitleRequired', { index: index + 1 }));
         }
         if (!faq.description?.trim()) {
           errors.push(t('admin.structuredArticle.validation.faqDescRequired', { index: index + 1 }));
         }
       });
     }

         if (errors.length > 0) {
      showToast({
        type: 'error',
        title: t('admin.structuredArticle.validation.completeInfo'),
        description: errors.join(', ')
      });
      return;
    }

    // 转换数据结构以匹配查看器期望的格式
    const convertedData = {
      id: formData.id,
      type: 'structured', // 添加类型标识
      title: formData.basicInfo.title.trim(),
      // 将基本信息放入 basicInfo 对象中
      basicInfo: {
        brand: formData.basicInfo.brand.trim(),
        model: formData.basicInfo.model.trim(),
        yearRange: formData.basicInfo.yearRange.trim(),
        vehicleImage: formData.basicInfo.vehicleImage || '',
        introduction: formData.basicInfo.introduction || '',
        importantNotes: formData.basicInfo.importantNotes || ''
      },
      // 为了兼容性，也保留扁平结构
      author: formData.basicInfo.author?.trim() || 'Technical Team',
      brand: formData.basicInfo.brand.trim(),
      model: formData.basicInfo.model.trim(),
      yearRange: formData.basicInfo.yearRange.trim(),
      vehicleImage: formData.basicInfo.vehicleImage || '',
      introduction: formData.basicInfo.introduction || '',
      importantNotes: formData.basicInfo.importantNotes || '',
      uploadDate: new Date().toISOString().split('T')[0],
      views: 0,

      // 功能支持 - 确保数据结构正确
      supportedFeatures: formData.features.supported.map(name => ({
        name: name.trim(),
        description: ''
      })),
      unsupportedFeatures: formData.features.unsupported.map(name => ({
        name: name.trim(),
        description: ''
      })),

      // 适配型号 - 确保数据结构正确
      compatibleModels: formData.compatibleModels.map(model => ({
        modelName: model.name.trim(),
        dashboardImage: model.dashboardImage || '',
        description: model.description.trim(),
        originalHost: {
          frontImage: model.originalHost.frontImage || '',
          backImage: model.originalHost.backImage || '',
          pinDefinitionImage: model.originalHost.pinDefinitionImage || '',
          hostDescription: model.originalHost.description || '',
          partNumber: model.originalHost.partNumber || '',
          frontImageDescription: model.originalHost.frontImageDescription || '',
          backImageDescription: model.originalHost.backImageDescription || '',
          pinDefinitionDescription: model.originalHost.pinDefinitionDescription || ''
        },
        optionalModules: {
          airConditioningPanel: {
            image: model.optionalModules.airConditioningPanel.image || '',
            description: model.optionalModules.airConditioningPanel.description || '',
            partNumber: model.optionalModules.airConditioningPanel.partNumber || '',
            interfaceImage: model.optionalModules.airConditioningPanel.interfaceImage || ''
          },
          displayBackPanel: {
            image: model.optionalModules.displayBackPanel.image || '',
            description: model.optionalModules.displayBackPanel.description || '',
            partNumber: model.optionalModules.displayBackPanel.partNumber || '',
            interfaceImage: model.optionalModules.displayBackPanel.interfaceImage || ''
          },
          dashboardPanel: {
            image: model.optionalModules.dashboardPanel.image || '',
            description: model.optionalModules.dashboardPanel.description || '',
            partNumber: model.optionalModules.dashboardPanel.partNumber || '',
            interfaceImage: model.optionalModules.dashboardPanel.interfaceImage || ''
          }
        }
      })),

             // 不适配型号 - 确保数据结构正确
       incompatibleModels: formData.incompatibleModels.map(model => ({
         modelName: model.name.trim(),
         dashboardImage: model.dashboardImage || '',
         description: model.description.trim()
       })),

      // FAQ - 确保数据结构正确
      faqs: formData.faqs.map(faq => ({
        title: faq.title.trim(),
        description: faq.description.trim(),
        solution: '',
        images: faq.images || [],
        // linkedModels 已移除，不再保存
      })),

      // 用户留言 - 确保数据结构正确
      userFeedback: formData.feedback.map(feedback => ({
        user: feedback.author.trim(),
        date: new Date(feedback.timestamp).toISOString().split('T')[0],
        content: feedback.content.trim()
      }))
    };

    console.log('StructuredArticleEditor: Converted data:', convertedData);
    console.log('StructuredArticleEditor: Calling onSave');

    // 清除自动保存的数据
    try {
      const autoSaveKey = `structured_article_autosave_${article?.id || 'new'}`;
      localStorage.removeItem(autoSaveKey);
      console.log('已清除自动保存数据:', autoSaveKey);
    } catch (error) {
      console.error('清除自动保存数据失败:', error);
    }

    onSave(convertedData);
  };

  const addSupportedFeature = () => {
    if (newSupportedFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          supported: [...prev.features.supported, newSupportedFeature.trim()]
        }
      }));
      setNewSupportedFeature('');
    }
  };

  const addUnsupportedFeature = () => {
    if (newUnsupportedFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features,
          unsupported: [...prev.features.unsupported, newUnsupportedFeature.trim()]
        }
      }));
      setNewUnsupportedFeature('');
    }
  };

  const removeFeature = (type: 'supported' | 'unsupported', index: number) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [type]: prev.features[type].filter((_, i) => i !== index)
      }
    }));
  };

  const addCompatibleModel = () => {
    const existingCount = formData.compatibleModels.length;
    const newId = `compatible_${Date.now()}_${existingCount}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Adding compatible model with ID:', newId);
    const newModel: CompatibleModel = {
      id: newId,
      name: '',
      dashboardImage: '',
      description: '',
      originalHost: {
        frontImage: '',
        backImage: '',
        pinDefinitionImage: '',
        description: '',
        partNumber: '', // 新增零件号字段
        frontImageDescription: '', // 新增
        backImageDescription: '', // 新增
        pinDefinitionDescription: '', // 新增
        wiringDiagram: '' // 新增线束连接图
      },
      optionalModules: {
        airConditioningPanel: {
          image: '',
          description: '',
          partNumber: '', // 新增零件号字段
          interfaceImage: '' // 新增接口图片
        },
        displayBackPanel: {
          image: '',
          description: '',
          partNumber: '', // 新增零件号字段
          interfaceImage: '' // 新增接口图片
        },
        dashboardPanel: {
          image: '',
          description: '',
          partNumber: '', // 新增零件号字段
          interfaceImage: '' // 新增接口图片
        }
      }
    };
    setFormData(prev => ({
      ...prev,
      compatibleModels: [...prev.compatibleModels, newModel]
    }));
  };

  const updateCompatibleModel = useCallback((id: string, field: string, value: any) => {
    console.log('updateCompatibleModel called:', { id, field, value });

    setFormData(prev => {
      const updated = {
        ...prev,
        compatibleModels: prev.compatibleModels.map(model => {
          if (model.id === id) {
            console.log('Updating model:', model.id);
            // 处理嵌套字段更新
            if (field.includes('.')) {
              const parts = field.split('.');
              console.log('Nested field update:', { parts, value });

              if (parts[0] === 'originalHost') {
                return {
                  ...model,
                  originalHost: {
                    ...model.originalHost,
                    [parts[1]]: value
                  }
                };
              } else if (parts[0] === 'optionalModules') {
                const moduleName = parts[1];
                const propName = parts[2];
                console.log('Updating optionalModules:', { moduleName, propName, value });

                return {
                  ...model,
                  optionalModules: {
                    ...model.optionalModules,
                    [moduleName]: {
                      ...model.optionalModules[moduleName as keyof OptionalModules],
                      [propName]: value
                    }
                  }
                };
              }
            }
            return { ...model, [field]: value };
          }
          return model;
        })
      };
      console.log('Updated formData:', updated);
      return updated;
    });
  }, []);

  const removeCompatibleModel = (id: string) => {
    setFormData(prev => ({
      ...prev,
      compatibleModels: prev.compatibleModels.filter(model => model.id !== id)
    }));
  };

  const addIncompatibleModel = () => {
    const existingCount = formData.incompatibleModels.length;
    const newId = `incompatible_${Date.now()}_${existingCount}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Adding incompatible model with ID:', newId);
    const newModel: IncompatibleModel = {
      id: newId,
      name: '',
      dashboardImage: '',
      description: ''
    };
    setFormData(prev => ({
      ...prev,
      incompatibleModels: [...prev.incompatibleModels, newModel]
    }));
  };

  const updateIncompatibleModel = useCallback((id: string, field: string, value: string) => {
    console.log('updateIncompatibleModel called:', { id, field, value });

    setFormData(prev => {
      const updated = {
        ...prev,
        incompatibleModels: prev.incompatibleModels.map(model => {
          if (model.id === id) {
            console.log('Updating incompatible model:', model.id, 'field:', field, 'value:', value);
            return { ...model, [field]: value };
          }
          return model;
        })
      };
      console.log('Updated incompatible models formData:', updated.incompatibleModels);
      return updated;
    });
  }, []);

  const removeIncompatibleModel = (id: string) => {
    setFormData(prev => ({
      ...prev,
      incompatibleModels: prev.incompatibleModels.filter(model => model.id !== id)
    }));
  };

  const addFAQ = () => {
    const newFAQ: FAQ = {
      id: `faq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: '',
      description: '',
      images: []
      // linkedModels 已移除
    };
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, newFAQ]
    }));
  };

  const updateFAQ = useCallback((id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.map(faq =>
        faq.id === id ? { ...faq, [field]: value } : faq
      )
    }));
  }, []);

  const removeFAQ = (id: string) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter(faq => faq.id !== id)
    }));
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('admin.structuredArticle.title')}
          </label>
          <Input
            value={formData.basicInfo.title || ''}
            onChange={(e) => handleBasicInfoChange('title', e.target.value)}
            placeholder={t('admin.structuredArticle.titlePlaceholder')}
            className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {t('knowledge.author')}
          </label>
          <Input
            value={formData.basicInfo.author || ''}
            onChange={(e) => handleBasicInfoChange('author', e.target.value)}
            placeholder={t('admin.structuredArticle.authorPlaceholder') || '输入作者名称'}
            className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div>
           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
             {t('admin.structuredArticle.selectVehicle')}
           </label>
          <select
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-slate-900 [&>option]:dark:text-white"
            value={
              formData.basicInfo.brand && formData.basicInfo.model && formData.basicInfo.yearRange
                ? `${formData.basicInfo.brand} ${formData.basicInfo.model} ${formData.basicInfo.yearRange}`
                : ''
            }
            onChange={(e) => {
              const selectedVehicle = vehicles.find(v => `${v.brand} ${v.model} ${v.year}` === e.target.value);
              if (selectedVehicle) {
                handleBasicInfoChange('brand', selectedVehicle.brand);
                handleBasicInfoChange('model', selectedVehicle.model);
                handleBasicInfoChange('yearRange', selectedVehicle.year);
              } else {
                // 清空选择
                handleBasicInfoChange('brand', '');
                handleBasicInfoChange('model', '');
                handleBasicInfoChange('yearRange', '');
              }
            }}
          >
            <option value="">{t('admin.structuredArticle.selectVehiclePlaceholder')}</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}>
                {vehicle.brand} {vehicle.model} {vehicle.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('admin.structuredArticle.vehicleImage')}
        </label>
        <ImageUpload
          value={formData.basicInfo.vehicleImage}
          onChange={(value) => handleBasicInfoChange('vehicleImage', value)}
          placeholder={t('admin.structuredArticle.uploadVehicleImage')}
          imageType="structured-article"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('admin.structuredArticle.introduction')}
        </label>
        <LazyRichTextEditor
          value={formData.basicInfo.introduction}
          onChange={(value) => handleBasicInfoChange('introduction', value)}
          placeholder={t('admin.structuredArticle.introductionPlaceholder')}
        />
      </div>

      {/* 注意事项（红色强调） */}
      <div>
        <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-2">
          {t('admin.structuredArticle.importantNotes')}
        </label>
        <LazyRichTextEditor
          value={formData.basicInfo.importantNotes || ''}
          onChange={(value) => handleBasicInfoChange('importantNotes', value)}
          placeholder={t('admin.structuredArticle.importantNotesPlaceholder')}
        />
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="space-y-6">
      {/* 功能支持 - 左右布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：支持的功能 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            {t('admin.structuredArticle.supportedFeatures')}
          </h3>
          <div className="space-y-2">
            {formData.features.supported.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                <Input
                  value={feature}
                  onChange={(e) => {
                    const newFeatures = [...formData.features.supported];
                    newFeatures[index] = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      features: {
                        ...prev.features,
                        supported: newFeatures
                      }
                    }));
                  }}
                  className="flex-1 bg-white dark:bg-slate-800 border-green-300 dark:border-green-600 text-slate-900 dark:text-white focus:border-green-500 focus:ring-green-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeFeature('supported', index)}
                  className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 border-red-300 dark:border-red-600 hover:border-red-400 dark:hover:border-red-500 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newSupportedFeature}
                onChange={(e) => setNewSupportedFeature(e.target.value)}
                placeholder={t('admin.structuredArticle.addSupportedFeature')}
                className="flex-1 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-green-500 focus:ring-green-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <Button onClick={addSupportedFeature} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 右侧：不支持的功能 */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center">
            <XCircle className="h-5 w-5 mr-2 text-red-500" />
            {t('admin.structuredArticle.unsupportedFeatures')}
          </h3>
          <div className="space-y-2">
            {formData.features.unsupported.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <XCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                <Input
                  value={feature}
                  onChange={(e) => {
                    const newFeatures = [...formData.features.unsupported];
                    newFeatures[index] = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      features: {
                        ...prev.features,
                        unsupported: newFeatures
                      }
                    }));
                  }}
                  className="flex-1 bg-white dark:bg-slate-800 border-red-300 dark:border-red-600 text-slate-900 dark:text-white focus:border-red-500 focus:ring-red-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeFeature('unsupported', index)}
                  className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 border-red-300 dark:border-red-600 hover:border-red-400 dark:hover:border-red-500 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newUnsupportedFeature}
                onChange={(e) => setNewUnsupportedFeature(e.target.value)}
                placeholder={t('admin.structuredArticle.addUnsupportedFeature')}
                className="flex-1 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:border-red-500 focus:ring-red-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <Button onClick={addUnsupportedFeature} className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 兼容模型渲染已迁移为 CompatibleModelsSection（懒加载）
  // 不兼容模型与 FAQ 的内联渲染已删除，统一使用 IncompatibleModelsSection 与 FAQsSection 懒加载呈现。

  // 旧的 renderFeedback 已迁移至 FeedbackSection（懒加载）

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderFeatures();
      case 2:
        return (
          <Suspense fallback={<div className="text-sm text-gray-500">{t('common.loading')}</div>}>
            <CompatibleModelsSection
              models={formData.compatibleModels}
              onAdd={addCompatibleModel}
              onRemove={removeCompatibleModel}
              onUpdate={updateCompatibleModel}
            />
          </Suspense>
        );
      case 3:
        return (
          <Suspense fallback={<div className="text-sm text-gray-500">{t('common.loading')}</div>}>
            <IncompatibleModelsSection
              models={formData.incompatibleModels}
              onAdd={addIncompatibleModel}
              onRemove={removeIncompatibleModel}
              onUpdate={updateIncompatibleModel}
            />
          </Suspense>
        );
      case 4:
        return (
          <Suspense fallback={<div className="text-sm text-gray-500">{t('common.loading')}</div>}>
            <FAQsSection
              faqs={formData.faqs}
              onAdd={addFAQ}
              onRemove={removeFAQ}
              onUpdate={updateFAQ}
            />
          </Suspense>
        );
      default:
        return renderBasicInfo();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('admin.structuredArticle.title')}</CardTitle>
            {/* 自动保存状态显示 */}
            <div className="flex items-center gap-3 text-sm">
              {autoSaveStatus === 'saving' && (
                <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                  <span className="animate-spin">⏳</span> 保存中...
                </span>
              )}
              {autoSaveStatus === 'saved' && lastSaveTime && (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  已自动保存 {lastSaveTime.toLocaleTimeString()}
                </span>
              )}
              {autoSaveStatus === 'unsaved' && (
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> 有未保存的更改
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 导航标签 */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => safeSetActiveSection(index)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                    activeSection === index
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-sm font-medium">{section.title}</span>
                </button>
              );
            })}
          </div>

          {/* 内容区域 */}
          <div className="min-h-[500px] max-h-[70vh] overflow-y-auto scrollbar-none pr-2 mb-8">
            {renderCurrentSection()}
          </div>

          {/* 导航按钮 */}
          <div className="flex justify-between items-center py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 sticky bottom-0 z-10 -mx-6 -mb-6 px-6">
            <Button
              variant="outline"
              onClick={() => safeSetActiveSection(activeSection - 1)}
              disabled={activeSection === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t('admin.structuredArticle.previous')}
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                {t('common.cancel')}
              </Button>

              {activeSection === sections.length - 1 ? (
                <Button onClick={handleSave}>
                  {t('common.save')}
                </Button>
              ) : (
                <Button onClick={() => safeSetActiveSection(activeSection + 1)}>
                  {t('admin.structuredArticle.next')}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={draftRestore.show}
        onClose={() => {
          deleteDraft('structured', article?.id);
          setDraftRestore({ show: false, data: null, time: null });
        }}
        onConfirm={() => {
          if (draftRestore.data && draftRestore.time) {
            setFormData(draftRestore.data);
            setLastSaveTime(draftRestore.time);
            showToast({
              type: 'success',
              title: '已恢复草稿',
              description: `恢复了 ${draftRestore.time.toLocaleString()} 的自动保存数据`
            });
            deleteDraft('structured', article?.id);
          }
          setDraftRestore({ show: false, data: null, time: null });
        }}
        title="恢复草稿"
        message={`检测到未保存的草稿（${draftRestore.time?.toLocaleString() ?? ''}），是否恢复？`}
        confirmText="恢复"
        cancelText="放弃"
        type="info"
      />
    </div>
  );
};

export default StructuredArticleEditor;