import type { ReactNode, ComponentType } from 'react'
import { createRoot, type Root } from 'react-dom/client'

const ROOT_MARK = Symbol('root')

type Container = (Element | DocumentFragment) & {
  /** 存储 React 根实例的标识 */
  [ROOT_MARK]?: Root
}

/**
 * DocumentFragment 是一个轻量级的节点容器对象，一般用于向真实 dom 批量插入节点，减少重排与重绘。
 * DocumentFragment 不是真实 dom 树的一部分，因此没有父节点。
 * 当 DocumentFragment 被插入到真实 dom 时，其子节点被转移到目标位置，此时 DocumentFragment 本身变为空容器。
 * 所以对于 DocumentFragment 类型，该函数不需要额外处理。
 */
export function unmount(container: Container) {
  const root = container[ROOT_MARK]
  if (root) {
    root.unmount()
    delete container[ROOT_MARK]
  }
  if (container instanceof Element) container.remove()
}

/**
 * 渲染 React 节点到容器中，并返回一个卸载函数。
 * @see {@link https://github.com/react-component/util/blob/master/src/React/render.ts}
 */
export function renderNode(node: ReactNode, container: Container) {
  const root = container[ROOT_MARK] ?? createRoot(container)
  root.render(node)
  container[ROOT_MARK] = root
  return () => unmount(container)
}

/**
 * 渲染 React 组件到容器中，并返回一个卸载函数。
 */
export function renderComponent<P extends object>(Comp: ComponentType<P>, props: P, container: Container) {
  return renderNode(<Comp {...props} />, container)
}
