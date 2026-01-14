import React from "react";

declare global {
  /**
   * Fix for 'Cannot augment module process':
   * We declare a global namespace for process instead of trying to augment a module.
   */
  namespace NodeJS {
    interface ProcessEnv {
      readonly API_KEY: string;
      readonly ADMIN_HARDCODED: string;
      readonly NODE_ENV: "development" | "production" | "test";
    }
    interface Process {
      env: ProcessEnv;
      // Fixed: Property 'platform' must be of type 'Platform' to match NodeJS internal definitions
      readonly platform: Platform;
      readonly version: string;
      browser: boolean;
    }
  }

  /**
   * Declaring a separate interface for AIStudio to avoid modifier mismatch issues
   * and ensure consistency.
   */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
    /**
     * Use the interface defined above.
     * Fixed: Removed modifiers and ensured identical declaration structure to prevent mismatch.
     */
    aistudio: AIStudio;
  }
}

// Ensure this file is treated as a module
export {};
