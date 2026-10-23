import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../utils/logger.js';

// Resolve the root directory of the entire cloudp1 repository (one level above mcp-server)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// Color presets for quick styling
const PRESET_THEMES: Record<string, { bgMain: string; bgSurface: string; primary: string; primaryHover: string }> = {
  midnight: {
    bgMain: '#0a0d14',
    bgSurface: '#121722',
    primary: '#4f46e5',
    primaryHover: '#4338ca',
  },
  slate: {
    bgMain: '#0f172a',
    bgSurface: '#1e293b',
    primary: '#38bdf8',
    primaryHover: '#0284c7',
  },
  emerald: {
    bgMain: '#061a14',
    bgSurface: '#0e2e24',
    primary: '#10b981',
    primaryHover: '#059669',
  },
  cyberpunk: {
    bgMain: '#0d021f',
    bgSurface: '#19043d',
    primary: '#f43f5e',
    primaryHover: '#e11d48',
  },
  crimson: {
    bgMain: '#14080a',
    bgSurface: '#240e12',
    primary: '#e11d48',
    primaryHover: '#be123c',
  },
  amber: {
    bgMain: '#140f07',
    bgSurface: '#241a0d',
    primary: '#d97706',
    primaryHover: '#b45309',
  },
  default: {
    bgMain: '#110e0b',
    bgSurface: '#191410',
    primary: '#c4623a',
    primaryHover: '#a94f2c',
  },
};

/**
 * Normalizes color names like "dark blue", "midnight", "black", "navy" to hex
 */
function normalizeColor(input: string): string {
  const clean = input.trim().toLowerCase();
  const named: Record<string, string> = {
    'midnight': '#0a0d14',
    'midnight blue': '#0a0f1d',
    'navy': '#001f3f',
    'dark blue': '#0b132b',
    'slate': '#0f172a',
    'black': '#050505',
    'dark green': '#061a14',
    'emerald': '#10b981',
    'purple': '#1e1035',
    'dark purple': '#140727',
    'dark red': '#1a0608',
    'crimson': '#e11d48',
    'charcoal': '#121212',
    'dark gray': '#18181b',
    'indigo': '#4338ca',
    'blue': '#2563eb',
    'cyan': '#06b6d4',
  };
  return named[clean] || input;
}

/**
 * Registers automatic project & theme tools for Claude Desktop
 */
export function registerProjectTools(server: McpServer): void {
  // Tool 1: change_background_or_theme
  server.tool(
    'change_background_or_theme',
    'Change the dashboard background color, primary accent color, or theme in this project. Automatically edits frontend/src/index.css without requiring the user to specify file paths or select folders.',
    {
      backgroundColor: z
        .string()
        .optional()
        .describe('New background color (hex code like "#0a0f1d" or color name like "dark blue", "midnight", "slate", "black", "purple")'),
      primaryColor: z
        .string()
        .optional()
        .describe('New primary accent/button color (hex code like "#4f46e5" or color name like "indigo", "emerald", "cyan")'),
      themePreset: z
        .enum(['midnight', 'slate', 'emerald', 'cyberpunk', 'crimson', 'amber', 'default'])
        .optional()
        .describe('Optional predefined aesthetic theme palette to apply directly'),
    },
    async (args) => {
      logger.info('Invoked tool: change_background_or_theme', args);
      const cssPath = path.join(PROJECT_ROOT, 'frontend/src/index.css');

      if (!fs.existsSync(cssPath)) {
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `CSS file not found at: ${cssPath}` }],
        };
      }

      let content = fs.readFileSync(cssPath, 'utf8');

      let newBgMain = '';
      let newBgSurface = '';
      let newPrimary = '';
      let newPrimaryHover = '';

      if (args.themePreset && PRESET_THEMES[args.themePreset]) {
        const p = PRESET_THEMES[args.themePreset];
        newBgMain = p.bgMain;
        newBgSurface = p.bgSurface;
        newPrimary = p.primary;
        newPrimaryHover = p.primaryHover;
      }

      if (args.backgroundColor) {
        newBgMain = normalizeColor(args.backgroundColor);
        // Slightly lighter for card/surface elevation
        newBgSurface = newBgMain;
      }

      if (args.primaryColor) {
        newPrimary = normalizeColor(args.primaryColor);
        newPrimaryHover = newPrimary;
      }

      if (!newBgMain && !newPrimary) {
        return {
          isError: true,
          content: [{ type: 'text' as const, text: 'Please specify backgroundColor, primaryColor, or themePreset.' }],
        };
      }

      // Replace CSS variables in :root
      if (newBgMain) {
        content = content.replace(/--bg-main:\s*[^;]+;/, `--bg-main: ${newBgMain};`);
        content = content.replace(/--bg-surface:\s*[^;]+;/, `--bg-surface: ${newBgSurface || newBgMain};`);
        content = content.replace(/--bg-surface-elevated:\s*[^;]+;/, `--bg-surface-elevated: ${newBgSurface || newBgMain};`);
      }

      if (newPrimary) {
        content = content.replace(/--primary:\s*[^;]+;/, `--primary: ${newPrimary};`);
        if (newPrimaryHover) {
          content = content.replace(/--primary-hover:\s*[^;]+;/, `--primary-hover: ${newPrimaryHover};`);
        }
        content = content.replace(/--border-focus:\s*[^;]+;/, `--border-focus: ${newPrimary};`);
      }

      fs.writeFileSync(cssPath, content, 'utf8');
      logger.info('Updated frontend/src/index.css theme successfully.');

      return {
        content: [
          {
            type: 'text' as const,
            text: `✅ **Theme and Background Color Updated Successfully!**\n- **Background:** \`${newBgMain || 'unchanged'}\`\n- **Primary Accent:** \`${newPrimary || 'unchanged'}\`\n- **File Modified:** \`frontend/src/index.css\`\n\nThe local Vite dev server hot-reloads this change instantly on your dashboard!`,
          },
        ],
      };
    }
  );

  // Tool 2: edit_project_file
  server.tool(
    'edit_project_file',
    'Edit or update any code file in this full-stack project (frontend, backend, styles, models). Paths are automatically relative to the project root D:\\cloudp1. Example: "frontend/src/components/Header.jsx" or "backend/src/routes/studentRoutes.js".',
    {
      filePath: z.string().describe('Relative file path from project root (e.g. "frontend/src/components/Header.jsx", "frontend/src/index.css", "backend/src/models/Student.js")'),
      findText: z.string().optional().describe('Exact text to find and replace in the file (optional if fullContent is provided)'),
      replaceText: z.string().optional().describe('Replacement text to swap in for findText'),
      fullContent: z.string().optional().describe('Complete new file content (use if overwriting or creating)'),
    },
    async (args) => {
      logger.info(`Invoked tool: edit_project_file for "${args.filePath}"`);
      const targetPath = path.resolve(PROJECT_ROOT, args.filePath);

      // Security check: ensure path stays within project root
      if (!targetPath.startsWith(PROJECT_ROOT)) {
        return {
          isError: true,
          content: [{ type: 'text' as const, text: 'Access denied: Path is outside the project root.' }],
        };
      }

      if (args.fullContent !== undefined) {
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, args.fullContent, 'utf8');
        return {
          content: [{ type: 'text' as const, text: `✅ File "${args.filePath}" updated successfully.` }],
        };
      }

      if (!fs.existsSync(targetPath)) {
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `File "${args.filePath}" does not exist.` }],
        };
      }

      if (args.findText && args.replaceText !== undefined) {
        const fileData = fs.readFileSync(targetPath, 'utf8');
        if (!fileData.includes(args.findText)) {
          return {
            isError: true,
            content: [{ type: 'text' as const, text: `findText was not found in "${args.filePath}".` }],
          };
        }
        const updated = fileData.replace(args.findText, args.replaceText);
        fs.writeFileSync(targetPath, updated, 'utf8');
        return {
          content: [{ type: 'text' as const, text: `✅ Replaced text in "${args.filePath}" successfully.` }],
        };
      }

      return {
        isError: true,
        content: [{ type: 'text' as const, text: 'Please provide either (findText and replaceText) or fullContent.' }],
      };
    }
  );

  // Tool 3: read_project_file
  server.tool(
    'read_project_file',
    'Read the content of any file in this project. Paths are automatically relative to project root D:\\cloudp1. E.g. "frontend/src/components/Header.jsx" or "backend/src/models/Student.js".',
    {
      filePath: z.string().describe('Relative path from project root (e.g. "frontend/src/components/Header.jsx", "frontend/src/index.css")'),
    },
    async (args) => {
      logger.info(`Invoked tool: read_project_file for "${args.filePath}"`);
      const targetPath = path.resolve(PROJECT_ROOT, args.filePath);

      if (!targetPath.startsWith(PROJECT_ROOT)) {
        return {
          isError: true,
          content: [{ type: 'text' as const, text: 'Access denied: Path is outside the project root.' }],
        };
      }

      if (!fs.existsSync(targetPath)) {
        return {
          isError: true,
          content: [{ type: 'text' as const, text: `File "${args.filePath}" does not exist.` }],
        };
      }

      const content = fs.readFileSync(targetPath, 'utf8');
      return {
        content: [
          {
            type: 'text' as const,
            text: `### File: \`${args.filePath}\`\n\n\`\`\`\n${content}\n\`\`\``,
          },
        ],
      };
    }
  );

  // Tool 4: get_project_overview
  server.tool(
    'get_project_overview',
    'Get an architectural map of this project: where frontend components, styling, backend routes, models, and configs are located.',
    {},
    async () => {
      const overview = [
        `# Student Information Management System (D:\\cloudp1)`,
        `## Frontend (React + Vite)`,
        `- Styles & Theme: \`frontend/src/index.css\` (CSS variables: --bg-main, --primary)`,
        `- Header & Title: \`frontend/src/components/Header.jsx\``,
        `- Student Table: \`frontend/src/components/StudentTable.jsx\``,
        `- Add/Edit Modal: \`frontend/src/components/StudentModal.jsx\``,
        `- API Client: \`frontend/src/services/api.js\``,
        `- Main App: \`frontend/src/App.jsx\``,
        `## Backend (Express + MongoDB Atlas)`,
        `- Routes: \`backend/src/routes/studentRoutes.js\` (GET/POST /api/students, PUT/DELETE /api/students/:id)`,
        `- Controllers: \`backend/src/controllers/studentController.js\``,
        `- Mongoose Model: \`backend/src/models/Student.js\``,
        `- Validation: \`backend/src/middleware/validateStudent.js\``,
        `- DB Connection: \`backend/src/config/db.js\` (student_db)`,
      ].join('\n');

      return {
        content: [{ type: 'text' as const, text: overview }],
      };
    }
  );

  logger.info('All 4 Full-Stack Project & Theme MCP tools registered successfully.');
}
