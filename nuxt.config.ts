export default defineNuxtConfig({
  // vite: {
  //   server: {
  //     allowedHosts: true
  //   }
  // },
  compatibilityDate: '2026-06-29',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: true,
  },

  runtimeConfig: {
    mysqlHost: process.env.MYSQL_HOST ?? '127.0.0.1',
    mysqlPort: Number(process.env.MYSQL_PORT ?? 3306),
    mysqlDatabase: process.env.MYSQL_DATABASE ?? '',
    mysqlUser: process.env.MYSQL_USER ?? '',
    mysqlPassword: process.env.MYSQL_PASSWORD ?? '',
    mysqlSlowQueryMs: Number(process.env.MYSQL_SLOW_QUERY_MS ?? 200),
    public: {},
  },

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL ?? '/',
    head: {
      title: 'B2B Catalog',
      meta: [
        {
          name: 'description',
          content: 'Browse our international B2B product catalog.',
        },
      ],
    },
  },
})
