import { Request, Response } from 'express';
import { getUser, createUser, updateUser } from '../services/userService';

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.auth.userId;
        const { email } = req.query;

        console.log(`[UserController] Fetching profile for: ${userId}`);

        let user = await getUser(userId);

        // Auto-create user if not exists (Lazy/JIT creation)
        if (!user && email) {
            console.log(`[UserController] User not found, creating new user...`);
            user = await createUser(userId, String(email));
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('[UserController] Get Profile Error:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

export const updateUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.auth.userId;
        const { company_name, company_logo_url, email } = req.body;

        console.log(`[UserController] Updating profile for: ${userId}`);

        let updatedUser = await updateUser(userId, {
            company_name,
            company_logo_url
        });

        // Auto-create if not found and email provided
        if (!updatedUser && email) {
            console.log(`[UserController] User not found during update, creating now...`);
            try {
                await createUser(userId, String(email));
            } catch (createError: any) {
                if (createError.code !== '23505') console.error('[UserController] Auto-creation failed:', createError);
            }
            updatedUser = await updateUser(userId, { company_name, company_logo_url });
        }

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found or no changes made' });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error('[UserController] Update Profile Error:', error);
        res.status(500).json({ error: 'Failed to update user profile' });
    }
};
