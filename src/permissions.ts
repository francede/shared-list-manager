export type Role = "owner" | "editor" | "authenticated";
export type Method = "GET" | "POST" | "PATCH" | "DELETE"

export type PermissionRule = {
  pattern: RegExp;
  methods: Method[];
  requiredRole: Role;
};

export const PERMISSIONS: PermissionRule[] = [
  // Create list
  {
    pattern: /^\/api\/list$/,
    methods: ["POST"],
    requiredRole: "authenticated"
  },

  // View list
  {
    pattern: /^\/api\/list\/[^/]+$/,
    methods: ["GET"],
    requiredRole: "editor"
  },

  // Viewer permissions (add, edit, remove, clear, move)
  {
    pattern: /^\/api\/list\/[^\/]+\/(add|edit|delete|clear|move|check)$/,
    methods: ["POST"],
    requiredRole: "editor"
  },

  // Delete list
  {
    pattern: /^\/api\/list\/[^/]+$/,
    methods: ["DELETE"],
    requiredRole: "owner"
  },

  // Edit metadata
  {
    pattern: /^\/api\/list\/[^/]+$/,
    methods: ["PATCH"],
    requiredRole: "owner"
  },

  // Auth token
  {
    pattern: /^\/api\/auth\/token$/,
    methods: ["GET"],
    requiredRole: "authenticated"
  }
];