import { query } from '../db';
import { logAdminAction } from './adminService';

export interface Article {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    published: boolean;
    author_id: string;
    created_at: string;
    updated_at: string;
    header_image?: string;
    keywords?: string;
}

export interface Announcement {
    id: string;
    message: string;
    type: 'info' | 'warning' | 'success';
    link?: string;
    active: boolean;
    created_at: string;
}

// Articles
export const getArticles = async (onlyPublished = false): Promise<Article[]> => {
    // Exclude 'content' to drastically reduce the payload size for the main listing page
    const sql = onlyPublished
        ? 'SELECT id, title, slug, excerpt, published, author_id, created_at, updated_at, header_image, keywords FROM articles WHERE published = true ORDER BY created_at DESC'
        : 'SELECT id, title, slug, excerpt, published, author_id, created_at, updated_at, header_image, keywords FROM articles ORDER BY created_at DESC';
    const res = await query(sql);
    return res.rows;
};

export const getArticleBySlug = async (slug: string): Promise<Article | null> => {
    const res = await query('SELECT * FROM articles WHERE slug = $1', [slug]);
    return res.rows[0] || null;
};

export const upsertArticle = async (article: Partial<Article>, adminId: string): Promise<Article> => {
    const { id, title, slug, content, excerpt, published, header_image, keywords } = article;

    const safeTitle = title ?? null;
    const safeSlug = slug ?? null;
    const safeContent = content ?? null;
    const safeExcerpt = excerpt ?? null;
    const safePublished = published ?? false;
    const safeHeaderImage = header_image ?? null;
    const safeKeywords = keywords ?? null;

    if (id) {
        const res = await query(
            `UPDATE articles 
             SET title = $1, slug = $2, content = $3, excerpt = $4, published = $5, header_image = $6, keywords = $7, updated_at = NOW() 
             WHERE id = $8 RETURNING *`,
            [safeTitle, safeSlug, safeContent, safeExcerpt, safePublished, safeHeaderImage, safeKeywords, id]
        );
        await logAdminAction(adminId, 'update_article', id, { title });
        return res.rows[0];
    } else {
        const res = await query(
            `INSERT INTO articles (title, slug, content, excerpt, published, header_image, keywords, author_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [safeTitle, safeSlug, safeContent, safeExcerpt, safePublished, safeHeaderImage, safeKeywords, adminId]
        );
        await logAdminAction(adminId, 'create_article', res.rows[0].id, { title });
        return res.rows[0];
    }
};

export const deleteArticle = async (id: string, adminId: string): Promise<void> => {
    await query('DELETE FROM articles WHERE id = $1', [id]);
    await logAdminAction(adminId, 'delete_article', id);
};

// Announcements
export const getAnnouncements = async (onlyActive = false): Promise<Announcement[]> => {
    const sql = onlyActive
        ? 'SELECT * FROM announcements WHERE active = true ORDER BY created_at DESC'
        : 'SELECT * FROM announcements ORDER BY created_at DESC';
    const res = await query(sql);
    return res.rows;
};

export const upsertAnnouncement = async (announcement: Partial<Announcement>, adminId: string): Promise<Announcement> => {
    const { id, message, type, link, active } = announcement;

    const safeMessage = message ?? null;
    const safeType = type ?? null;
    const safeLink = link ?? null;
    const safeActive = active ?? false;

    if (id) {
        const res = await query(
            `UPDATE announcements 
             SET message = $1, type = $2, link = $3, active = $4 
             WHERE id = $5 RETURNING *`,
            [safeMessage, safeType, safeLink, safeActive, id]
        );
        await logAdminAction(adminId, 'update_announcement', id, { active });
        return res.rows[0];
    } else {
        const res = await query(
            `INSERT INTO announcements (message, type, link, active) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [safeMessage, safeType, safeLink, safeActive]
        );
        await logAdminAction(adminId, 'create_announcement', res.rows[0].id, { active });
        return res.rows[0];
    }
};

export const deleteAnnouncement = async (id: string, adminId: string): Promise<void> => {
    await query('DELETE FROM announcements WHERE id = $1', [id]);
    await logAdminAction(adminId, 'delete_announcement', id);
};
