import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PrimeReactProvider, addLocale, locale } from 'primereact/api'
import App from './App.tsx'
import './index.css'
import './i18n'

// PrimeReact 样式
import 'primereact/resources/themes/lara-dark-blue/theme.css'
import 'primeicons/primeicons.css'
import '@/styles/primereact-custom.css'

// 集成优化工具
import { QueryProvider } from './config/queryClient.tsx'
import { initSentry } from './config/sentry'
import { primeReactConfig } from './configs/primereact.config'
import { primeReactLocales } from './configs/primereact-locale'

// 初始化 Sentry 错误监控
initSentry()

// 注册 PrimeReact 语言包
Object.entries(primeReactLocales).forEach(([key, value]) => {
  addLocale(key, value)
})

// 设置默认语言为中文
locale('zh')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrimeReactProvider value={primeReactConfig}>
      <QueryProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryProvider>
    </PrimeReactProvider>
  </React.StrictMode>,
)