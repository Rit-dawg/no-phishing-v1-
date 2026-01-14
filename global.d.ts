// Use interface merging for process if it exists, otherwise declare it
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    ADMIN_HARDCODED: string;
    [key: string]: string | undefined;
  }
}

// Ensure the global process variable is recognized without redeclaring or conflicting with existing node types
declare interface Process {
  env: NodeJS.ProcessEnv;
  platform: string;
  version: string;
}

// Use a conditional global check instead of direct declaration to avoid "Cannot redeclare block-scoped variable"
declare const process: Process;

interface ImportMetaEnv {
  readonly VITE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
