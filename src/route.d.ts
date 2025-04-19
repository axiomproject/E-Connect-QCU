import 'vue-router'

// To ensure proper type checking with route meta properties
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresAdmin?: boolean
  }
}
