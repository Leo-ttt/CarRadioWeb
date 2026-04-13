import crypto from 'crypto';

interface DingtalkConfig {
  webhook: string;
  secret: string;
}

interface DingtalkMessage {
  msgtype: 'text' | 'markdown' | 'link' | 'actionCard';
  text?: {
    content: string;
  };
  markdown?: {
    title: string;
    text: string;
  };
  link?: {
    title: string;
    text: string;
    picUrl: string;
    messageUrl: string;
  };
  actionCard?: {
    title: string;
    text: string;
    btnOrientation?: '0' | '1';
    btns: Array<{
      title: string;
      actionURL: string;
    }>;
  };
  at?: {
    atMobiles?: string[];
    atUserIds?: string[];
    isAtAll?: boolean;
  };
}

class DingtalkService {
  private config: DingtalkConfig;

  constructor() {
    this.config = {
      webhook: process.env.DINGTALK_WEBHOOK || '',
      secret: process.env.DINGTALK_SECRET || '',
    };
  }

  /**
   * 计算签名
   */
  private sign(timestamp: number, secret: string): string {
    const stringToSign = `${timestamp}\n${secret}`;
    const hmac = crypto.createHmac('sha256', secret);
    return encodeURIComponent(hmac.update(stringToSign).digest('base64'));
  }

  /**
   * 发送消息到钉钉
   */
  async sendMessage(message: DingtalkMessage): Promise<boolean> {
    if (!this.config.webhook || !this.config.secret) {
      return false;
    }

    try {
      const timestamp = Date.now();
      const sign = this.sign(timestamp, this.config.secret);
      const url = `${this.config.webhook}&timestamp=${timestamp}&sign=${sign}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json() as any;
      return result.errcode === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * 发送反馈/表单提交通知
   */
  async notifyFormSubmission(data: {
    type: 'feedback' | 'document-feedback';
    name?: string;
    title?: string;
    content: any;
    email?: string;
    phone?: string;
    orderNumber?: string;
    location?: string;
    timestamp?: string;
    documentType?: 'structured' | 'video' | 'image-text' | 'unknown';
  }): Promise<boolean> {
    const typeMap = {
      feedback: '用户反馈',
      'document-feedback': '文档留言',
    };

    // 根据文档类型生成更具体的标签
    let typeLabel = typeMap[data.type] || '表单提交';
    
    if (data.type === 'document-feedback' && data.documentType) {
      const documentTypeMap = {
        'structured': '车型资料留言',
        'video': '视频教程留言',
        'image-text': '图文教程留言',
        'unknown': '文档留言'
      };
      typeLabel = documentTypeMap[data.documentType] || '文档留言';
    }

    // 构建markdown格式消息
    const markdown = this.buildFormMessage(typeLabel, data);

    return this.sendMessage({
      msgtype: 'markdown',
      markdown,
      at: {
        isAtAll: false,
      },
    });
  }

  /**
   * 构建表单消息
   */
  private buildFormMessage(
    typeLabel: string,
    data: any
  ): { title: string; text: string } {
    let location = data.location || '未知';
    
    // 清理内容中的多余空白，但保留换行
    const cleanContent = (text: string) => {
      return text
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
    };

    let contentText = '';

    // 根据不同类型构建内容，每个字段单独一行
    if (data.type === 'feedback') {
      const lines = [
        `**姓名**: ${data.name || '未提供'}`,
        `**邮箱**: ${data.email || '未提供'}`,
        ...(data.orderNumber ? [`**参考信息**: ${data.orderNumber}`] : []),
        `**主题**: ${data.title || '未提供'}`,
        `**所在地**: ${location}`,
        `**内容**:`,
        cleanContent(data.content)
      ];
      contentText = lines.join('\n\n');
    } else if (data.type === 'document-feedback') {
      const lines = [
        `**文档**: ${data.title || '未指定'}`,
        `**提交者**: ${data.name || data.email || '匿名'}`,
        `**反馈内容**:`,
        cleanContent(data.content)
      ];
      contentText = lines.join('\n\n');
    }

    return {
      title: `🔔 新的${typeLabel}`,
      text: `### 🔔 新的${typeLabel}提交

${contentText}

---
⏰ 提交时间: ${data.timestamp || new Date().toLocaleString('zh-CN')}`,
    };
  }

}

// 单例导出
export default new DingtalkService();
