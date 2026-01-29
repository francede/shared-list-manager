export type Method = "GET" | "POST" | "PATCH" | "DELETE" | "HEAD"

export type PermissionRule = {
  pattern: RegExp;
  methods: Method[];
  authRequired: boolean
};

export const PERMISSIONS: PermissionRule[] = [
  // View lists
  {
    pattern: /^\/api\/lists$/,
    methods: ["GET", "HEAD"],
    authRequired: true
  },

  // Create list
  {
    pattern: /^\/api\/list$/,
    methods: ["POST"],
    authRequired: true
  },

  // View list
  {
    pattern: /^\/api\/list\/[^/]+$/,
    methods: ["GET", "HEAD"],
    authRequired: true
  },

  // Get roles
  {
    pattern: /^\/api\/list\/[^/]+\/roles$/,
    methods: ["GET"],
    authRequired: true
  },

  // Viewer permissions (add, edit, remove, clear, move)
  {
    pattern: /^\/api\/list\/[^\/]+\/(add|edit|delete|clear|move|check|uncheck)$/,
    methods: ["POST"],
    authRequired: true
  },

  // Delete list / update metadata
  {
    pattern: /^\/api\/list\/[^/]+$/,
    methods: ["DELETE", "PATCH"],
    authRequired: true
  },

  // Auth token
  {
    pattern: /^\/api\/auth\/token$/,
    methods: ["GET"],
    authRequired: true
  },

  // Next-auth
  {
    pattern: /^\/api\/auth\/(?!token).*$/,
    methods: ["GET", "POST"],
    authRequired: false
  },

  // Non-API
  {
    pattern: /^\/(?!api).*$/,
    methods: ["GET"],
    authRequired: false
  }
];