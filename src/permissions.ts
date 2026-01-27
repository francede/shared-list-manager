export type Role = "owner" | "editor" | "authenticated";
export type Method = "GET" | "POST" | "PATCH" | "DELETE" | "HEAD"

export type PermissionRule = {
  pattern: RegExp;
  methods: Method[];
  requiredRole: Role | null;
};

export const PERMISSIONS: PermissionRule[] = [
  // View lists
  {
    pattern: /^\/api\/lists$/,
    methods: ["GET", "HEAD"],
    requiredRole: "authenticated"
  },

  // Create list
  {
    pattern: /^\/api\/list$/,
    methods: ["POST"],
    requiredRole: "authenticated"
  },

  // View list
  {
    pattern: /^\/api\/list\/[^/]+$/,
    methods: ["GET", "HEAD"],
    requiredRole: "editor"
  },

  // Get roles
  {
    pattern: /^\/api\/list\/[^/]+\/roles$/,
    methods: ["GET"],
    requiredRole: "authenticated"
  },

  // Viewer permissions (add, edit, remove, clear, move)
  {
    pattern: /^\/api\/list\/[^\/]+\/(add|edit|delete|clear|move|check)$/,
    methods: ["POST"],
    requiredRole: "editor"
  },

  // Delete list / update metadata
  {
    pattern: /^\/api\/list\/[^/]+$/,
    methods: ["DELETE", "PATCH"],
    requiredRole: "owner"
  },

  // Auth token
  {
    pattern: /^\/api\/auth\/token$/,
    methods: ["GET"],
    requiredRole: "authenticated"
  },

  // Next-auth
  {
    pattern: /^\/api\/auth\/(?!token).*$/,
    methods: ["GET", "POST"],
    requiredRole: null
  },

  // Non-API
  {
    pattern: /^\/(?!api).*$/,
    methods: ["GET"],
    requiredRole: null
  }
];