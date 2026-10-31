import { Request, Response } from 'express';
import { db } from '../config/database';
import { siteSettings, legalDocuments, legalDocumentVersions } from '../schema/store';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class LegalAndSettingsController {
  // Public: Get contact information
  async getContactInfo(req: Request, res: Response): Promise<void> {
    try {
      const settings = await db.query.siteSettings.findFirst();

      if (!settings) {
        res.json({
          phone: '+1 (800) 555-0199',
          email: 'support@jequex.com',
          address: '123 Commerce Boulevard, Suite 500, San Francisco, CA 94105',
          city: 'San Francisco',
          state: 'CA',
          postalCode: '94105',
          country: 'United States',
          businessHours: 'Mon - Fri: 9:00 AM - 6:00 PM EST',
          supportHours: '24/7 Priority Support',
          socialFacebook: 'https://facebook.com',
          socialTwitter: 'https://twitter.com',
          socialInstagram: 'https://instagram.com',
          socialLinkedin: 'https://linkedin.com',
          admin_app_url: 'http://localhost:3006',
          app_name: 'Jequex E-Commerce',
          app_logo_url: ''
        });
        return;
      }

      res.json(settings);
    } catch (error) {
      console.error('Error fetching contact info:', error);
      res.status(500).json({ error: 'Failed to fetch contact info' });
    }
  }

  // Super Admin: Update contact information
  async updateContactInfo(req: Request, res: Response) {
    try {
      const {
        phone,
        email,
        address,
        city,
        state,
        postalCode,
        country,
        businessHours,
        supportHours,
        socialFacebook,
        socialTwitter,
        socialInstagram,
        socialLinkedin,
        adminAppUrl,
        admin_app_url,
        appName,
        app_name,
        appLogoUrl,
        app_logo_url,
        updatedById,
        updatedByName
      } = req.body;

      const finalAdminAppUrl = adminAppUrl || admin_app_url;
      const finalAppName = appName || app_name || 'Jequex E-Commerce';
      const finalAppLogoUrl = appLogoUrl !== undefined ? appLogoUrl : app_logo_url;
      const existing = await db.query.siteSettings.findFirst();

      let result;
      if (existing) {
        [result] = await db
          .update(siteSettings)
          .set({
            phone,
            email,
            address,
            city,
            state,
            postal_code: postalCode,
            country,
            business_hours: businessHours,
            support_hours: supportHours,
            social_facebook: socialFacebook,
            social_twitter: socialTwitter,
            social_instagram: socialInstagram,
            social_linkedin: socialLinkedin,
            admin_app_url: finalAdminAppUrl,
            app_name: finalAppName,
            app_logo_url: finalAppLogoUrl,
            updated_by_id: updatedById,
            updated_by_name: updatedByName,
            updated_at: new Date()
          })
          .where(eq(siteSettings.id, existing.id))
          .returning();
      } else {
        [result] = await db
          .insert(siteSettings)
          .values({
            phone,
            email,
            address,
            city,
            state,
            postal_code: postalCode,
            country,
            business_hours: businessHours,
            support_hours: supportHours,
            social_facebook: socialFacebook,
            social_twitter: socialTwitter,
            social_instagram: socialInstagram,
            social_linkedin: socialLinkedin,
            admin_app_url: finalAdminAppUrl || 'http://localhost:3006',
            app_name: finalAppName,
            app_logo_url: finalAppLogoUrl || '',
            updated_by_id: updatedById,
            updated_by_name: updatedByName,
            updated_at: new Date()
          })
          .returning();
      }

      res.json({
        message: 'Contact settings updated successfully',
        settings: result
      });
    } catch (error) {
      console.error('Error updating contact settings:', error);
      res.status(500).json({ error: 'Failed to update contact settings' });
    }
  }

  // Public: List all legal documents with their current version
  async getAllLegalDocuments(req: Request, res: Response) {
    try {
      const docs = await db.select().from(legalDocuments);
      res.json({ documents: docs });
    } catch (error) {
      console.error('Error fetching legal documents:', error);
      res.status(500).json({ error: 'Failed to fetch legal documents' });
    }
  }

  // Public: Get current active version of a legal document
  async getLegalDocumentByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;

      const doc = await db.query.legalDocuments.findFirst({
        where: eq(legalDocuments.type, type)
      });

      if (!doc) {
        res.status(404).json({ error: 'Legal document not found' });
        return;
      }

      const activeVersion = await db.query.legalDocumentVersions.findFirst({
        where: eq(legalDocumentVersions.document_type, type),
        orderBy: desc(legalDocumentVersions.created_at)
      });

      res.json({
        document: doc,
        activeVersion
      });
    } catch (error) {
      console.error('Error fetching legal document:', error);
      res.status(500).json({ error: 'Failed to fetch legal document' });
    }
  }

  // Super Admin: Get all versions (audit log) for a specific legal document
  async getLegalDocumentVersions(req: Request, res: Response) {
    try {
      const { type } = req.params;

      const versions = await db
        .select()
        .from(legalDocumentVersions)
        .where(eq(legalDocumentVersions.document_type, type))
        .orderBy(desc(legalDocumentVersions.created_at));

      res.json({ versions });
    } catch (error) {
      console.error('Error fetching legal document versions:', error);
      res.status(500).json({ error: 'Failed to fetch document versions' });
    }
  }

  // Super Admin: Create and publish a new version of a legal document
  async createLegalDocumentVersion(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const {
        version,
        title,
        content,
        changeSummary,
        effectiveDate,
        createdById,
        createdByName,
        createdByEmail
      } = req.body;

      if (!version || !title || !content) {
        res.status(400).json({ error: 'version, title, and content are required' });
        return;
      }

      // Insert new version into audit trail
      const [newVersion] = await db
        .insert(legalDocumentVersions)
        .values({
          id: uuidv4(),
          document_type: type,
          version,
          title,
          content,
          change_summary: changeSummary || 'Updated content',
          effective_date: effectiveDate ? new Date(effectiveDate) : new Date(),
          created_at: new Date(),
          created_by_id: createdById,
          created_by_name: createdByName || 'Super Admin',
          created_by_email: createdByEmail || 'superadmin@ecommerce.com',
          is_active: true
        })
        .returning();

      // Update current version in parent legal_documents
      await db
        .update(legalDocuments)
        .set({
          title,
          current_version: version,
          updated_at: new Date()
        })
        .where(eq(legalDocuments.type, type));

      res.status(201).json({
        message: 'New version published successfully',
        version: newVersion
      });
    } catch (error) {
      console.error('Error publishing new legal version:', error);
      res.status(500).json({ error: 'Failed to publish new version' });
    }
  }
}
