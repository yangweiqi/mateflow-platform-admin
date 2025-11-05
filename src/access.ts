import type { InitialState } from './app';

export default (initialState: InitialState | undefined) => {
  // 在这里按照初始化数据定义项目中的权限，统一管理
  // 参考文档 https://umijs.org/docs/max/access

  // Check if user is authenticated
  const isAuthenticated = !!initialState?.currentUser?.token;

  return {
    // Can access admin pages
    canSeeAdmin: isAuthenticated,
    // Is authenticated
    isAuthenticated,
  };
};
