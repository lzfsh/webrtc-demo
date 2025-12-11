import type { ConfigProviderProps } from 'antd'
// import zhCN from 'antd/locale/zh_CN'
// import dayjs from 'dayjs'
// import 'dayjs/locale/zh-cn'

/**
//  * dayjs设置中文，防止 antd 时间类组件的国际化 locale 失败
 * @see {@link https://ant-design.antgroup.com/docs/react/faq-cn#%E4%B8%BA%E4%BB%80%E4%B9%88%E6%97%B6%E9%97%B4%E7%B1%BB%E7%BB%84%E4%BB%B6%E7%9A%84%E5%9B%BD%E9%99%85%E5%8C%96-locale-%E8%AE%BE%E7%BD%AE%E4%B8%8D%E7%94%9F%E6%95%88}
 */
// dayjs.locale('zh-cn')

export const globalAntdConf: Readonly<ConfigProviderProps> = Object.freeze({
  form: { colon: false },
  // locale: zhCN,
  theme: { token: { fontSize: 14 } },
})
