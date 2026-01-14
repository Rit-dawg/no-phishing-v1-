import { Keystatic } from "@keystatic/core/ui";
import keystaticConfig from "./keystatic.config";

/**
 * The Keystatic component is the standard entry point for the Keystatic Admin UI.
 * This wrapper allows for lazy loading of the admin interface to reduce initial bundle size.
 */
const KeystaticAdmin = () => {
  return <Keystatic config={keystaticConfig} />;
};

export default KeystaticAdmin;
