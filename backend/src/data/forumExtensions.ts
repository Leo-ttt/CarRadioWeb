/**
 * 论坛插件元数据：用于“论坛插件管理”内置列表
 * extensionId 与 Flarum 后台 extensions_enabled 一致；composerPackage 用于 composer require/remove
 */
export interface ForumExtensionMeta {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  developer: string;
  composerPackage: string;
  logNameVariants?: string[];
  vcsUrl?: string;
}

// Composer 包名以 Flarum 官方 composer.json / Packagist 为准：flarum/tags、flarum/lang-english 等（非 flarum/flarum-*）
export const FORUM_EXTENSIONS: ForumExtensionMeta[] = [
  { id: 'flarum-flags', name: 'Flags', nameZh: '举报', description: 'Allow users to flag posts for moderation.', descriptionZh: '允许用户举报帖子供审核。', developer: 'Flarum', composerPackage: 'flarum/flags' },
  { id: 'flarum-tags', name: 'Tags', nameZh: '标签', description: 'Organize discussions with tags and tag-based permissions.', descriptionZh: '用标签组织讨论并设置基于标签的权限。', developer: 'Flarum', composerPackage: 'flarum/tags' },
  { id: 'flarum-approval', name: 'Approval', nameZh: '审核', description: 'Require posts and discussions to be approved before they are visible.', descriptionZh: '帖子和讨论需审核通过后才可见。', developer: 'Flarum', composerPackage: 'flarum/approval' },
  { id: 'flarum-mentions', name: 'Mentions', nameZh: '提及', description: 'Mention users with @username and get notified.', descriptionZh: '通过 @用户名 提及用户并接收通知。', developer: 'Flarum', composerPackage: 'flarum/mentions' },
  { id: 'flarum-subscriptions', name: 'Subscriptions', nameZh: '订阅', description: 'Subscribe to discussions to receive notifications for new posts.', descriptionZh: '订阅讨论以接收新回复通知。', developer: 'Flarum', composerPackage: 'flarum/subscriptions' },
  { id: 'flarum-suspend', name: 'Suspend', nameZh: '封禁', description: 'Suspend users and remove their posts from the discussion.', descriptionZh: '封禁用户并可移除其帖子。', developer: 'Flarum', composerPackage: 'flarum/suspend' },
  { id: 'flarum-markdown', name: 'Markdown', nameZh: 'Markdown', description: 'Support Markdown in posts.', descriptionZh: '在帖子中支持 Markdown。', developer: 'Flarum', composerPackage: 'flarum/markdown' },
  { id: 'flarum-sticky', name: 'Sticky', nameZh: '置顶', description: 'Pin discussions to the top of the discussion list.', descriptionZh: '将讨论置顶到列表顶部。', developer: 'Flarum', composerPackage: 'flarum/sticky' },
  { id: 'flarum-statistics', name: 'Statistics', nameZh: '统计', description: 'Track and display forum statistics.', descriptionZh: '统计并展示论坛数据。', developer: 'Flarum', composerPackage: 'flarum/statistics' },
  { id: 'flarum-pusher', name: 'Pusher', nameZh: '实时推送', description: 'Real-time notifications and updates via Pusher.', descriptionZh: '通过 Pusher 实现实时通知与更新。', developer: 'Flarum', composerPackage: 'flarum/pusher' },
  { id: 'flarum-nicknames', name: 'Nicknames', nameZh: '昵称', description: 'Allow users to set a display nickname.', descriptionZh: '允许用户设置显示昵称。', developer: 'Flarum', composerPackage: 'flarum/nicknames' },
  { id: 'flarum-lock', name: 'Lock', nameZh: '锁定', description: 'Lock discussions to prevent new replies.', descriptionZh: '锁定讨论以防止新回复。', developer: 'Flarum', composerPackage: 'flarum/lock' },
  { id: 'flarum-likes', name: 'Likes', nameZh: '点赞', description: 'Allow users to like posts.', descriptionZh: '允许用户对帖子点赞。', developer: 'Flarum', composerPackage: 'flarum/likes' },
  { id: 'flarum-lang-english', name: 'English', nameZh: '英语语言包', description: 'English language pack.', descriptionZh: '英语语言包。', developer: 'Flarum', composerPackage: 'flarum/lang-english' },
  { id: 'flarum-emoji', name: 'Emoji', nameZh: '表情', description: 'Add emoji support to posts.', descriptionZh: '在帖子中支持表情。', developer: 'Flarum', composerPackage: 'flarum/emoji' },
  { id: 'flarum-bbcode', name: 'BBCode', nameZh: 'BBCode', description: 'Support BBCode in posts.', descriptionZh: '在帖子中支持 BBCode。', developer: 'Flarum', composerPackage: 'flarum/bbcode' },
  { id: 'v17development-seo', name: 'SEO', nameZh: 'SEO', description: 'Improve forum SEO with meta tags and structured data.', descriptionZh: '通过 meta 与结构化数据优化论坛 SEO。', developer: 'v17development', composerPackage: 'v17development/flarum-seo' },
  { id: 'fof-follow-tags', name: 'Follow Tags', nameZh: '关注标签', description: 'Follow tags and get notified of new discussions and replies.', descriptionZh: '关注标签并接收新讨论与回复通知。', developer: 'Friends of Flarum', composerPackage: 'fof/follow-tags' },
  { id: 'fof-user-bio', name: 'User Bio', nameZh: '用户简介', description: 'Allow users to add a short bio to their profile.', descriptionZh: '允许用户在个人资料中添加简短简介。', developer: 'Friends of Flarum', composerPackage: 'fof/user-bio' },
  { id: 'fof-upload', name: 'Upload', nameZh: '上传', description: 'Upload images and files to posts (Imgur, local, S3, etc.).', descriptionZh: '在帖子中上传图片与文件（Imgur、本地、S3 等）。', developer: 'Friends of Flarum', composerPackage: 'fof/upload' },
  { id: 'fof-subscribed', name: 'Subscribed', nameZh: '订阅增强', description: 'Email digest and subscription management.', descriptionZh: '邮件摘要与订阅管理。', developer: 'Friends of Flarum', composerPackage: 'fof/subscribed' },
  { id: 'fof-sitemap', name: 'Sitemap', nameZh: '站点地图', description: 'Generate a sitemap for search engines.', descriptionZh: '为搜索引擎生成站点地图。', developer: 'Friends of Flarum', composerPackage: 'fof/sitemap' },
  { id: 'fof-reactions', name: 'Reactions', nameZh: '表情反应', description: 'Add emoji reactions to posts (like, love, etc.).', descriptionZh: '为帖子添加表情反应（赞、喜欢等）。', developer: 'Friends of Flarum', composerPackage: 'fof/reactions' },
  { id: 'fof-oauth', name: 'OAuth', nameZh: '第三方登录', description: 'Sign in with Google, GitHub, Discord, etc.', descriptionZh: '使用 Google、GitHub、Discord 等登录。', developer: 'Friends of Flarum', composerPackage: 'fof/oauth' },
  { id: 'fof-nightmode', name: 'Nightmode', nameZh: '夜间模式', description: 'Toggle dark mode for the forum.', descriptionZh: '论坛深色模式切换。', developer: 'Friends of Flarum', composerPackage: 'fof/nightmode', logNameVariants: ['fof-night-mode'] },
  { id: 'fof-mason', name: 'Mason', nameZh: '讨论字段', description: 'Add custom fields to discussions (e.g. Q&A).', descriptionZh: '为讨论添加自定义字段（如问答）。', developer: 'Friends of Flarum', composerPackage: 'fof/mason' },
  { id: 'fof-formatting', name: 'Formatting', nameZh: '格式化', description: 'Auto-embed images/videos and other formatting.', descriptionZh: '自动嵌入图片/视频等格式化。', developer: 'Friends of Flarum', composerPackage: 'fof/formatting' },
  { id: 'fof-filter', name: 'Filter', nameZh: '敏感词过滤', description: 'Auto-moderation and word filtering.', descriptionZh: '自动审核与敏感词过滤。', developer: 'Friends of Flarum', composerPackage: 'fof/filter' },
  { id: 'fof-byobu', name: 'Byobu', nameZh: '私信', description: 'Private discussions between users.', descriptionZh: '用户之间的私密讨论。', developer: 'Friends of Flarum', composerPackage: 'fof/byobu' },
  { id: 'fof-best-answer', name: 'Best Answer', nameZh: '最佳答案', description: 'Mark a post as the best answer in discussions.', descriptionZh: '将帖子标记为讨论的最佳答案。', developer: 'Friends of Flarum', composerPackage: 'fof/best-answer' },
  { id: 'fof-ban-ips', name: 'Ban IPs', nameZh: 'IP 封禁', description: 'Ban users by IP address.', descriptionZh: '按 IP 封禁用户。', developer: 'Friends of Flarum', composerPackage: 'fof/ban-ips' },
  { id: 'afrux-forum-widgets-core', name: 'Forum Widgets Core', nameZh: '论坛小部件核心', description: 'Core for forum sidebar widgets.', descriptionZh: '论坛侧边栏小部件核心。', developer: 'Afrux', composerPackage: 'afrux/forum-widgets-core' },
  { id: 'afrux-online-users-widget', name: 'Online Users Widget', nameZh: '在线用户小部件', description: 'Show online users in the sidebar.', descriptionZh: '在侧边栏显示在线用户。', developer: 'Afrux', composerPackage: 'afrux/online-users-widget', logNameVariants: ['afrux-onlineusers'] },
  { id: 'ziiven-post-number', name: 'Post Number', nameZh: '帖子编号', description: 'Display post numbers in discussions.', descriptionZh: '在讨论中显示帖子编号。', developer: 'Ziiven', composerPackage: 'ziiven/flarum-post-number' },
  { id: 'michaelbelgium-discussion-views', name: 'Discussion Views', nameZh: '讨论浏览量', description: 'Track and display discussion view counts.', descriptionZh: '统计并显示讨论浏览量。', developer: 'Michael Belgium', composerPackage: 'michaelbelgium/flarum-discussion-views' },
  { id: 'leo-t-flarum-notify-push', name: 'Notify Push', nameZh: '推送通知', description: 'Push forum notifications to WeCom, DingTalk, ServerChan, Email and Webhook.', descriptionZh: '将论坛动态推送到企业微信、钉钉、Server酱、邮件与 Webhook。', developer: 'Leo-ttt', composerPackage: 'leo-t/flarum-notify-push', vcsUrl: 'https://github.com/Leo-ttt/Notify-Push' },
  { id: 'justoverclock-thread-read-time', name: 'Thread Read Time', nameZh: '阅读时间', description: 'Show estimated read time for discussions.', descriptionZh: '显示讨论的预估阅读时间。', developer: 'JustOverclock', composerPackage: 'justoverclock/thread-read-time' },
  { id: 'justoverclock-guestengagement', name: 'Guest Engagement', nameZh: '访客引导', description: 'Encourage guests to sign up with call-to-action boxes.', descriptionZh: '通过引导框鼓励访客注册。', developer: 'JustOverclock', composerPackage: 'justoverclock/flarum-ext-guestengagement' },
  { id: 'jslirola-login2seeplus', name: 'Login to See Plus', nameZh: '登录后可见', description: 'Hide post content or media until user logs in.', descriptionZh: '未登录时隐藏部分帖子内容或媒体。', developer: 'Jslirola', composerPackage: 'jslirola/flarum-ext-login2seeplus' },
  { id: 'isaced-email-verification-switch', name: 'Email Verification Switch', nameZh: '邮箱验证开关', description: 'Toggle email verification requirement.', descriptionZh: '开关邮箱验证要求。', developer: 'Isaced', composerPackage: 'isaced/flarum-ext-email-verification-switch' },
  { id: 'ianm-follow-users', name: 'Follow Users', nameZh: '关注用户', description: 'Follow users and get notified of their activity.', descriptionZh: '关注用户并接收其动态通知。', developer: 'IanM', composerPackage: 'ianm/follow-users' },
  { id: 'datlechin-link-preview', name: 'Link Preview', nameZh: '链接预览', description: 'Show link previews (title, image) in posts.', descriptionZh: '在帖子中显示链接预览（标题、图片）。', developer: 'Datlechin', composerPackage: 'datlechin/flarum-link-preview' },
  { id: 'clarkwinkelmann-shadow-ban', name: 'Shadow Ban', nameZh: '影子封禁', description: 'Hide content from specific users without them knowing.', descriptionZh: '对特定用户隐藏内容而不被察觉。', developer: 'Clark Winkelmann', composerPackage: 'clarkwinkelmann/flarum-ext-shadow-ban' },
  { id: 'clarkwinkelmann-emojionearea', name: 'Emoji One Area', nameZh: '表情选择器', description: 'Emoji picker for the composer.', descriptionZh: '发帖框表情选择器。', developer: 'Clark Winkelmann', composerPackage: 'clarkwinkelmann/flarum-ext-emojionearea' },
  { id: 'askvortsov-rich-text', name: 'Rich Text', nameZh: '富文本编辑器', description: 'Rich text editor for posts.', descriptionZh: '帖子富文本编辑器。', developer: 'Askvortsov', composerPackage: 'askvortsov/flarum-rich-text' },
];
