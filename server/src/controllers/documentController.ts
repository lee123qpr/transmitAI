import { Request, Response } from 'express';
import crypto from 'crypto';
import { extractDocumentData } from '../services/aiService';
import { getUser, createUser, checkLimit, incrementUsage } from '../services/userService';
import { query } from '../db';

export const getDocuments = async (req: Request, res: Response) => {
    try {
        const userId = req.auth.userId;

        const result = await query(
            'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        // Transform for frontend
        const documents = result.rows.map(doc => {
            let excerpt = doc.excerpt_data;
            if (typeof excerpt === 'string') {
                try { excerpt = JSON.parse(excerpt); } catch (e) { excerpt = {}; }
            }

            return {
                id: doc.id,
                filename: doc.filename,
                documentNumber: doc.doc_number,
                revision: doc.revision,
                title: doc.title,
                issueDate: doc.issue_date,
                discipline: excerpt?.discipline || 'Unknown',
                consultant: excerpt?.consultant || 'Unknown',
                status: doc.status || 'Pending',
                uploadedAt: doc.created_at,
                transmittalTitle: excerpt?.transmittalTitle
            };
        });

        res.json(documents);
    } catch (error) {
        console.error('[DocumentController] Get Documents Error:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

export const uploadDocument = async (req: Request, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const userId = req.auth.userId;
        const userEmail = req.body.email;

        // 1. Ensure User Exists & Check Limits
        let user = await getUser(userId);
        if (!user && userEmail) {
            user = await createUser(userId, userEmail);
        }

        const limitCheck = await checkLimit(userId);
        if (!limitCheck.allowed) {
            return res.status(403).json({ error: limitCheck.message });
        }

        console.log(`[DocumentController] Processing file: ${req.file.originalname} for user: ${userId}`);

        // 2. Duplicate Check
        const fileHash = crypto.createHash('md5').update(req.file.buffer).digest('hex');
        const duplicateCheck = await query(
            `SELECT id FROM documents 
             WHERE user_id = $1 
             AND excerpt_data->>'fileHash' = $2 
             AND filename = $3
             LIMIT 1`,
            [userId, fileHash, req.file.originalname]
        );

        if (duplicateCheck.rowCount && duplicateCheck.rowCount > 0) {
            return res.status(409).json({
                error: 'Duplicate file detected',
                message: `The file "${req.file.originalname}" has already been uploaded.`
            });
        }

        // 3. Extract Data
        let extractedData;
        try {
            extractedData = await extractDocumentData(req.file.buffer, req.file.originalname);
        } catch (extractionError) {
            console.error('[DocumentController] Extraction failed:', extractionError);
            return res.status(400).json({
                error: 'File Processing Failed',
                message: 'The file appears to be corrupt or unreadable.'
            });
        }

        if (!extractedData) {
            return res.status(422).json({ error: 'Extraction Failed', message: 'Could not extract text.' });
        }

        if (req.body.transmittalTitle) extractedData.transmittalTitle = req.body.transmittalTitle;
        extractedData.fileHash = fileHash;

        // 4. Save to DB
        const docResult = await query(
            `INSERT INTO documents (
                user_id, filename, file_size, file_type, 
                doc_number, revision, title, status, issue_date, excerpt_data
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [
                userId,
                req.file.originalname,
                req.file.size,
                req.file.mimetype,
                extractedData.documentNumber || null,
                extractedData.revision || null,
                extractedData.title || null,
                extractedData.status || 'Pending',
                extractedData.issueDate || null,
                JSON.stringify(extractedData)
            ]
        );

        // 5. Increment Usage
        await incrementUsage(userId);

        res.json({
            message: 'File processed successfully',
            filename: req.file.originalname,
            data: extractedData,
            usage: {
                current: (user?.documents_usage || 0) + 1,
                limit: user?.documents_limit || 10
            }
        });

    } catch (error) {
        console.error('[DocumentController] Upload processing error:', error);
        res.status(500).json({ error: 'Failed to process document', details: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.auth.userId;

        const result = await query(
            'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Document not found or unauthorized' });
        }

        res.json({ success: true, id });
    } catch (error) {
        console.error('[DocumentController] Delete Document Error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
};

export const deleteTransmittal = async (req: Request, res: Response) => {
    try {
        const { title } = req.body;
        const userId = req.auth.userId;

        if (!title) return res.status(400).json({ error: 'Missing title' });

        const titleQuery = title === 'Unsorted Uploads' ? null : title;
        let result;

        if (titleQuery) {
            result = await query(
                `DELETE FROM documents 
                 WHERE user_id = $1 
                 AND (
                    excerpt_data->>'transmittalTitle' = $2 
                    OR title = $2
                    OR (excerpt_data->>'transmittalTitle' IS NULL AND title IS NULL AND $2 = 'Unsorted Uploads')
                 )`,
                [userId, titleQuery]
            );
        } else {
            result = await query(
                `DELETE FROM documents 
                 WHERE user_id = $1 
                 AND (excerpt_data->>'transmittalTitle' IS NULL OR excerpt_data->>'transmittalTitle' = '')`,
                [userId]
            );
        }

        res.json({ success: true, count: result.rowCount });
    } catch (error) {
        console.error('[DocumentController] Delete Transmittal Error:', error);
        res.status(500).json({ error: 'Failed to delete transmittal' });
    }
};
