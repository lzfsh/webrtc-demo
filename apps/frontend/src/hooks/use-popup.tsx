import type { ReactNode, ComponentType } from 'react'
import { ConfigProvider } from 'antd'
import { renderNode, unmount as unmountContainer } from '@/utils/react'
import { globalAntdConf } from '@/configs/antd'

/** 弹窗组件的基本 props */
export interface PopupProps {
  /** 控制弹窗是否显示 */
  open: boolean
  /** 点击确认按钮时触发的回调函数 */
  onOk?: (...args: any[]) => any | Promise<any>
  /** 关闭弹窗时触发的回调函数 */
  onClose?: (...args: any[]) => any | Promise<any>
}

/** 弹窗组件的配置选项 */
export interface PopupOptions<P extends PopupProps = PopupProps> {
  /** 默认的弹窗 props */
  defaultProps?: Partial<P>
  /** 弹窗组件的挂载容器，默认值为 document.body */
  container?: Element | DocumentFragment
  /** 是否在关闭弹窗后自动卸载组件，默认值为 { delay: 300 }, 表示延迟 300ms 后卸载组件 */
  unmount?: boolean | { delay: number }
  /** 是否在点击确认或者关闭按钮后自动关闭弹窗，默认值为 true */
  autoClose?: boolean
  /** 弹窗组件的包装函数，在弹窗组件外再包裹一层，可以用于注入 context */
  wrapper?: (node: ReactNode) => ReactNode
  /** 是否保留弹窗组件上次的 props，默认值为 false */
  preserveProps?: boolean
}

export interface PopupAction<P extends PopupProps = PopupProps> {
  /** 只读的弹窗组件配置选项 */
  options: Readonly<Required<PopupOptions<P>>>
  /** 渲染弹窗组件 */
  render: (props?: Partial<P>) => Promise<void>
  /** 打开弹窗组件 */
  open: (props?: Partial<P>) => Promise<void>
  /** 关闭弹窗组件 */
  close: (props?: Partial<P>, opts?: Pick<PopupOptions<P>, 'unmount'>) => Promise<void>
  /** 手动卸载弹窗组件 */
  unmount: () => void
}

/**
 * 创建一个弹窗控制器，提供一组方法（传入组件 props）用于命令式控制弹窗组件的状态和行为
 * TODO: 新写一个函数，返回当前的 props
 * @see {@link https://github.com/ant-design/ant-design/blob/master/components/modal/confirm.tsx}
 */
export function createPopup<P extends PopupProps>(Comp: ComponentType<P>, opts: PopupOptions<P> = {}): PopupAction<P> {
  const body = window.document.body
  const defaultOptions = {
    defaultProps: {},
    container: body,
    autoClose: true,
    unmount: { delay: 300 },
    wrapper: (node: any) => node,
    preserveProps: false,
  }
  const options: Required<PopupOptions<P>> = { ...defaultOptions, ...opts }
  let lastProps: Partial<P> = Object.freeze(defaultOptions.defaultProps)
  const action: PopupAction<P> = { options: Object.freeze(options), render, open, close, unmount }

  /** 转换函数，主要是为 onOk 和 onClose 回调添加添加自动关闭弹窗的逻辑 */
  function transform(props: Partial<P> = {}): P {
    const onOk = async (...args: any[]) => {
      const ret = await props.onOk?.(...args, action)
      // 如果启用自动关闭且有返回值为 true，则关闭弹窗
      if (options.autoClose && !!ret) close(props, options)
      return ret
    }
    const onClose = async (...args: any[]) => {
      const ret = await props.onClose?.(...args, action)
      // 如果启用自动关闭，则关闭弹窗
      if (options.autoClose) close(props, options)
      return ret
    }
    return { open: false, ...props, onOk, onClose } as P
  }

  function unmount() {
    unmountContainer(options.container)
  }

  let timer: number = NaN
  function render(props: Partial<P> = {}) {
    return new Promise<void>((resolve) => {
      // 防抖，防止重复渲染
      if (timer) window.clearTimeout(timer)

      timer = window.setTimeout(() => {
        // 如果容器是 DocumentFragment 或者元素没有挂载到 body，则挂载到 body
        if (options.container instanceof DocumentFragment || !body.contains(options.container)) {
          body.appendChild(options.container)
        }

        const mergedProps = { ...lastProps, ...props }
        // 更新 lastProps 为当前 props，用于下一次渲染时保留 props
        if (options.preserveProps) lastProps = mergedProps
        // 使用包装器包装组件并渲染到容器中
        const node = options.wrapper(<Comp {...transform(mergedProps)} />)
        /**
         * 在典型的 react 应用中，root.render() 方法通常只在应用初始化时调用一次，后续的渲染更新都是通过状态改变触发。
         * 对同一个根组件多次调用 root.render()，只要组件树结构保持一致，react 也会保留状态。
         * 也就是说，当多次调用 root.render() 时，只要根组件保持结构不变且传入的 props 不同，也能引起组件更新。
         * @see {@link https://react.dev/reference/react-dom/client/createRoot#updating-a-root-component}
         */
        renderNode(node, options.container)
        resolve()
        timer = NaN
      })
    })
  }

  function open(props: Partial<P> = {}) {
    return render({ ...props, open: true })
  }

  function close(props: Partial<P> = {}, opts: Pick<PopupOptions<P>, 'unmount'> = {}) {
    const { unmount } = { ...options, ...opts }
    return render({ ...props, open: false }).then(() => {
      return new Promise<void>((resolve) => {
        if (!unmount) return resolve()

        const delay = typeof unmount === 'boolean' ? 0 : unmount.delay
        window.setTimeout(() => {
          unmountContainer(options.container)
          resolve()
        }, delay)
      })
    })
  }

  return action
}

/** 创建一个带有自定义配置选项的弹窗工厂函数，类似于 createPopup，这样可以在创建多个具有相同配置的弹窗时避免重复传入相同的选项 */
export function withPopupDefaults<P extends PopupProps>(defaultOpts: PopupOptions<P> = {}) {
  return function <P extends PopupProps>(Comp: ComponentType<P>, opts: PopupOptions<P> = {}): PopupAction<P> {
    return createPopup(Comp, Object.assign({}, defaultOpts, opts))
  }
}

export interface PopupHook<S> {
  (): S
  <R = S>(selector: (store: S) => R): R
}

/** 创建一个弹窗控制器的 react 钩子函数，用于在函数组件中使用弹窗 */
export function createPopupHook<P extends PopupProps = PopupProps, S = PopupAction<P>>(
  Comp: ComponentType<P>,
  init?: (popup: PopupAction<P>) => S,
  opts?: PopupOptions<P>,
): PopupHook<S>
export function createPopupHook<P extends PopupProps = PopupProps, S = PopupAction<P>>(
  Comp: ComponentType<P>,
  init?: (popup: PopupAction<P>) => S,
  factory?: (Comp: ComponentType<P>, opts?: PopupOptions<P>) => PopupAction<P>,
  opts?: PopupOptions<P>,
): PopupHook<S>
export function createPopupHook<P extends PopupProps = PopupProps, S = PopupAction<P>>(...args: any[]): PopupHook<S> {
  const Comp: ComponentType<P> = args[0]
  const init: undefined | ((popup: PopupAction<P>) => S) = typeof args[1] === 'function' ? args[1] : undefined
  const factory: typeof createPopup = typeof args[2] === 'function' ? args[2] : createPopup
  const opts: PopupOptions<P> | undefined = typeof args[2] === 'function' ? args[3] : args[2]
  const state = init ? init(factory(Comp, opts)) : factory(Comp, opts)

  function hook(): S
  function hook<R = S>(selector: (s: S) => R): R
  function hook(selector?: any): any {
    return typeof selector === 'function' ? selector(state) : state
  }
  return hook
}

export const createAntdPopup = withPopupDefaults({
  container: document.createDocumentFragment(),
  wrapper: (node) => <ConfigProvider {...globalAntdConf}>{node}</ConfigProvider>,
  preserveProps: true,
})
