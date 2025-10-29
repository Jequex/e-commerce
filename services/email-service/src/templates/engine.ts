import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { EmailTemplate, EmailTemplateData } from '../schema';

// Import mjml with proper typing
const mjml = require('mjml');

export interface TemplateEngine {
  compile(template: string, data: EmailTemplateData): Promise<{ html: string; text: string }>;
  compileFromFile(templatePath: string, data: EmailTemplateData): Promise<{ html: string; text: string }>;
  registerPartial(name: string, template: string): void;
  registerHelper(name: string, helper: Handlebars.HelperDelegate): void;
}

export class HandlebarsTemplateEngine implements TemplateEngine {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private textTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.registerDefaultHelpers();
  }

  private registerDefaultHelpers() {
    // Register common helpers
    Handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      if (!date) return '';
      
      const options: Intl.DateTimeFormatOptions = {};
      
      switch (format) {
        case 'short':
          options.dateStyle = 'short';
          break;
        case 'medium':
          options.dateStyle = 'medium';
          break;
        case 'long':
          options.dateStyle = 'long';
          break;
        case 'full':
          options.dateStyle = 'full';
          break;
        default:
          options.dateStyle = 'medium';
      }
      
      return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
    });

    Handlebars.registerHelper('formatCurrency', (amount: number, currency = 'USD') => {
      if (typeof amount !== 'number') return '';
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(amount);
    });

    Handlebars.registerHelper('uppercase', (str: string) => {
      return str?.toString().toUpperCase() || '';
    });

    Handlebars.registerHelper('lowercase', (str: string) => {
      return str?.toString().toLowerCase() || '';
    });

    Handlebars.registerHelper('truncate', (str: string, length: number) => {
      if (!str || typeof str !== 'string') return '';
      return str.length > length ? str.substring(0, length) + '...' : str;
    });

    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('lt', (a: any, b: any) => a < b);
    Handlebars.registerHelper('gt', (a: any, b: any) => a > b);
    Handlebars.registerHelper('and', (a: any, b: any) => a && b);
    Handlebars.registerHelper('or', (a: any, b: any) => a || b);
  }

  registerPartial(name: string, template: string): void {
    Handlebars.registerPartial(name, template);
  }

  registerHelper(name: string, helper: Handlebars.HelperDelegate): void {
    Handlebars.registerHelper(name, helper);
  }

  async compile(template: string, data: EmailTemplateData): Promise<{ html: string; text: string }> {
    const compiledTemplate = Handlebars.compile(template);
    const renderedHtml = compiledTemplate(data);
    
    // Generate text version by stripping HTML tags
    const text = this.htmlToText(renderedHtml);
    
    return { html: renderedHtml, text };
  }

  async compileFromFile(templatePath: string, data: EmailTemplateData): Promise<{ html: string; text: string }> {
    const template = await this.loadTemplate(templatePath);
    return this.compile(template, data);
  }

  private async loadTemplate(templatePath: string): Promise<string> {
    const fullPath = path.resolve(templatePath);
    return await fs.readFile(fullPath, 'utf-8');
  }

  protected htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }
}

export class MjmlTemplateEngine extends HandlebarsTemplateEngine {
  async compile(template: string, data: EmailTemplateData): Promise<{ html: string; text: string }> {
    // First compile with Handlebars
    const compiledTemplate = Handlebars.compile(template);
    const renderedMjml = compiledTemplate(data);
    
    // Then compile MJML to HTML
    const mjmlResult = mjml(renderedMjml, {
      validationLevel: 'strict',
      keepComments: false,
    });
    
    if (mjmlResult.errors.length > 0) {
      throw new Error(`MJML compilation errors: ${mjmlResult.errors.map((e: any) => e.message).join(', ')}`);
    }
    
    const html = mjmlResult.html;
    const text = this.htmlToText(html);
    
    return { html, text };
  }
}

// Template manager for caching and managing templates
export class TemplateManager {
  private engine: TemplateEngine;
  private templateCache: Map<string, { html: string; text?: string; lastModified: number }> = new Map();
  private templatesDir: string;

  constructor(engine: TemplateEngine, templatesDir: string) {
    this.engine = engine;
    this.templatesDir = templatesDir;
  }

  async getTemplate(templateName: string, data: EmailTemplateData, useCache = true): Promise<{ html: string; text: string }> {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);
    
    if (useCache) {
      const cached = await this.getCachedTemplate(templatePath);
      if (cached) {
        return this.engine.compile(cached.html, data);
      }
    }
    
    return this.engine.compileFromFile(templatePath, data);
  }

  private async getCachedTemplate(templatePath: string): Promise<{ html: string; text?: string } | null> {
    try {
      const stats = await fs.stat(templatePath);
      const cached = this.templateCache.get(templatePath);
      
      if (cached && cached.lastModified >= stats.mtime.getTime()) {
        return cached.text ? { html: cached.html, text: cached.text } : { html: cached.html };
      }
      
      // Load and cache template
      const template = await fs.readFile(templatePath, 'utf-8');
      this.templateCache.set(templatePath, {
        html: template,
        lastModified: stats.mtime.getTime(),
      });
      
      return { html: template };
    } catch (error) {
      return null;
    }
  }

  async loadPartials(): Promise<void> {
    const partialsDir = path.join(this.templatesDir, 'partials');
    
    try {
      const files = await fs.readdir(partialsDir);
      const partialFiles = files.filter(file => file.endsWith('.hbs'));
      
      for (const file of partialFiles) {
        const partialName = path.basename(file, '.hbs');
        const partialContent = await fs.readFile(path.join(partialsDir, file), 'utf-8');
        this.engine.registerPartial(partialName, partialContent);
      }
    } catch (error) {
      // Partials directory doesn't exist or is empty
      console.warn('No partials directory found or accessible');
    }
  }

  clearCache(): void {
    this.templateCache.clear();
  }
}