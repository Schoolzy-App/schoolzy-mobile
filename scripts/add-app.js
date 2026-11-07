#!/usr/bin/env node

/**
 * Script to generate a new app configuration
 *
 * Usage: node scripts/add-app.js [options]
 *
 * Options:
 *   --name <name>              App display name (required)
 *   --id <id>                  App ID/slug (required)
 *   --api-url <url>            API URL (required)
 *   --package <package>        Android package name (required)
 *   --bundle-id <id>           iOS bundle identifier (required)
 *   --primary-color <color>    Primary theme color in hex (default: #1E5A96)
 *   --secondary-color <color>  Secondary theme color in hex (default: #5A9FD4)
 *
 * Example:
 *   node scripts/add-app.js \\
 *     --name "Lincoln" \\
 *     --id lincoln \\
 *     --api-url "https://api.lincoln.example.com" \\
 *     --package "com.lincoln.app" \\
 *     --bundle-id "com.lincoln.app" \\
 *     --primary-color "#8B4513" \\
 *     --secondary-color "#D2691E"
 */

const fs = require("fs");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace(/^--/, "");
  const value = args[i + 1];
  options[key] = value;
}

// Validate required options
const required = ["name", "id", "api-url", "package", "bundle-id"];
for (const req of required) {
  if (!options[req]) {
    console.error(`❌ Error: Missing required option: --${req}`);
    process.exit(1);
  }
}

const appId = options.id;
const appName = options.name;
const apiUrl = options["api-url"];
const androidPackage = options.package;
const iosBundleId = options["bundle-id"];
const primaryColor = options["primary-color"] || "#1E5A96";
const secondaryColor = options["secondary-color"] || "#5A9FD4";

const configDir = path.join(__dirname, "..", "config");

// Generate app config
const appConfigTemplate = `  ${appId}: {
    id: '${appId}',
    name: '${appName}',
    slug: '${appId}',
    version: '1.0.0',
    description: '${appName} School Management App',
    apiUrl: '${apiUrl}',
    scheme: '${appId}',
    themeId: '${appId}',
    icon: './assets/images/${appId}/icon.png',
    splash: './assets/images/${appId}/splash-icon.png',
    android: {
      package: '${androidPackage}',
      backgroundColor: '${primaryColor}',
      foregroundImage: './assets/images/${appId}/android-icon-foreground.png',
      backgroundImage: './assets/images/${appId}/android-icon-background.png',
      monochromeImage: './assets/images/${appId}/android-icon-monochrome.png',
    },
    ios: {
      bundleIdentifier: '${iosBundleId}',
    },
  },`;

// Generate theme config
const themeConfigTemplate = `/**
 * ${appName} Theme
 * Main color scheme for ${appName} School Management App
 */

export const ${appId}Theme = {
  id: '${appId}',
  name: '${appName}',
  colors: {
    light: {
      text: '#1A1A1A',
      background: '#FFFFFF',
      tint: '${primaryColor}',
      icon: '#4A5568',
      tabIconDefault: '#A0AEC0',
      tabIconSelected: '${primaryColor}',
      primary: '${primaryColor}',
      secondary: '${secondaryColor}',
      success: '#22863A',
      warning: '#E8A923',
      danger: '#CB2431',
    },
    dark: {
      text: '#F5F5F5',
      background: '#1A1A1A',
      tint: '${secondaryColor}',
      icon: '#E2E8F0',
      tabIconDefault: '#718096',
      tabIconSelected: '${secondaryColor}',
      primary: '${primaryColor}',
      secondary: '${secondaryColor}',
      success: '#28A745',
      warning: '#FFC107',
      danger: '#FF4757',
    },
  },
};
`;

try {
  // Update app config file
  const appConfigPath = path.join(configDir, "apps", "index.ts");
  let appConfigContent = fs.readFileSync(appConfigPath, "utf8");

  // Find the insertion point (before closing brace of apps object)
  const insertPoint = appConfigContent.lastIndexOf("};");
  if (insertPoint === -1) {
    throw new Error("Could not find insertion point in apps config");
  }

  appConfigContent =
    appConfigContent.slice(0, insertPoint) +
    appConfigTemplate +
    "\n" +
    appConfigContent.slice(insertPoint);

  fs.writeFileSync(appConfigPath, appConfigContent);
  console.log(`✅ Updated ${appConfigPath}`);

  // Create theme file
  const themeFilePath = path.join(configDir, "themes", `${appId}.ts`);
  fs.writeFileSync(themeFilePath, themeConfigTemplate);
  console.log(`✅ Created ${themeFilePath}`);

  // Update themes index file
  const themesIndexPath = path.join(configDir, "themes", "index.ts");
  let themesIndexContent = fs.readFileSync(themesIndexPath, "utf8");

  // Add import
  if (!themesIndexContent.includes(`import { ${appId}Theme }`)) {
    const importLine = `import { ${appId}Theme } from './${appId}';`;
    const lastImportMatch = themesIndexContent.match(
      /import.*from '\.\/[^']+';/g,
    );
    if (lastImportMatch) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      themesIndexContent = themesIndexContent.replace(
        lastImport,
        lastImport + "\n" + importLine,
      );
    }
  }

  // Add to themes object
  if (!themesIndexContent.includes(`${appId}:`)) {
    const objectInsertPoint = themesIndexContent.lastIndexOf("};");
    themesIndexContent =
      themesIndexContent.slice(0, objectInsertPoint) +
      `  ${appId}: ${appId}Theme,\n` +
      themesIndexContent.slice(objectInsertPoint);
  }

  fs.writeFileSync(themesIndexPath, themesIndexContent);
  console.log(`✅ Updated ${themesIndexPath}`);

  // Create assets directory structure
  const assetsDir = path.join(__dirname, "..", "assets", "images", appId);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log(`✅ Created assets directory: ${assetsDir}`);
    console.log(`   ℹ️  Add the following images to this directory:`);
    console.log(`      - icon.png (1024x1024)`);
    console.log(`      - splash-icon.png (200x200)`);
    console.log(`      - android-icon-foreground.png (108x108)`);
    console.log(`      - android-icon-background.png (108x108)`);
    console.log(`      - android-icon-monochrome.png (108x108)`);
  }

  console.log(`\n✨ App "${appName}" has been added successfully!`);
  console.log(`\n📝 To use this app, set the APP_ID environment variable:`);
  console.log(`   export APP_ID=${appId}`);
  console.log(`\n   Or modify app.json to use the new app configuration`);
} catch (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}
