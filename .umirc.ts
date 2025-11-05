import { defineConfig } from '@umijs/max';

export default defineConfig({
  title: 'Mateflow',
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  // reactStrictMode: true,
  locale: {
    default: 'en-US',
    antd: true,
    baseSeparator: '-',
  },
  layout: {
    title: 'Mateflow',
    locale: true,
  },
  favicons: ['/logo.png'],
  routes: [
    {
      path: '/login',
      layout: false,
      component: './Login',
    },
    {
      path: '/',
      redirect: '/home',
    },
    {
      name: 'Home',
      path: '/home',
      component: './Home',
      access: 'isAuthenticated',
    },
    {
      name: 'Access',
      path: '/access',
      component: './Access',
      access: 'isAuthenticated',
    },
    {
      name: 'CRUD Demo',
      path: '/table',
      component: './Table',
      access: 'isAuthenticated',
    },
  ],
  npmClient: 'pnpm',
  // Define environment variables that should be available in the browser
  // These will be replaced at build time with their actual values from .env files
  define: {
    'process.env.UMI_APP_API_BASE_URL':
      process.env.UMI_APP_API_BASE_URL || 'http://localhost:8080',
  },
});
