import React, { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Building2, Save, X, Loader2 } from 'lucide-react';
import { useToast } from './Toast';

type CompanySettingsProps = Record<string, never>;

const CompanySettings: React.FC<CompanySettingsProps> = () => {
    const { user } = useUser();
    const { getToken } = useAuth();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [companyName, setCompanyName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    // Edit State
    const [isEditingName, setIsEditingName] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);
    const [isSavingLogo, setIsSavingLogo] = useState(false);

    // Fetch existing settings
    useEffect(() => {
        if (!user) return;
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                // Pass email to ensure user creation
                const email = user.primaryEmailAddress?.emailAddress;
                const url = email ? `/api/user?email=${encodeURIComponent(email)}` : `/api/user`;
                const token = await getToken();
                const res = await fetch(url, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.company_name) setCompanyName(data.company_name);
                    if (data.company_logo_url) setLogoUrl(data.company_logo_url);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [user]);

    const handleSaveName = async () => {
        if (!user) return;
        setIsSavingName(true);
        try {
            const email = user.primaryEmailAddress?.emailAddress;
            const token = await getToken();
            const res = await fetch(`/api/user`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    company_name: companyName,
                    email // Pass email for auto-creation
                })
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('Save failed:', res.status, errorData);
                throw new Error(errorData.error || 'Failed to update settings');
            }
            showToast('Company name updated', 'success');
            setIsEditingName(false);
        } catch {
            showToast('Failed to update name', 'error');
        } finally {
            setIsSavingName(false);
        }
    };

    const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!user || !e.target.files?.[0]) return;

        const file = e.target.files[0];
        if (file.size > 500 * 1024) { // 500KB limit
            showToast('Logo must be under 500KB', 'error');
            return;
        }

        setIsSavingLogo(true);

        // Convert to Base64
        const reader = new FileReader();
        reader.onload = async (ev) => {
            if (ev.target?.result) {
                const newLogoUrl = ev.target.result as string;
                try {
                    const email = user.primaryEmailAddress?.emailAddress;
                    const token = await getToken();
                    const res = await fetch(`${API_URL}/user`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({
                            company_logo_url: newLogoUrl,
                            email // Pass email for auto-creation
                        })
                    });

                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        console.error('Logo upload failed:', res.status, errorData);
                        throw new Error(errorData.error || 'Failed to update settings');
                    }

                    setLogoUrl(newLogoUrl);
                    showToast('Logo updated successfully', 'success');
                } catch (error) {
                    console.error(error);
                    showToast('Failed to upload logo', 'error');
                } finally {
                    setIsSavingLogo(false);
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = async () => {
        if (!user) return;
        if (!confirm('Are you sure you want to remove the logo?')) return;

        setIsSavingLogo(true);
        try {
            const token = await getToken();
            await fetch(`/api/user`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ company_logo_url: '' })
            });
            setLogoUrl('');
            showToast('Logo removed', 'success');
        } catch {
            showToast('Failed to remove logo', 'error');
        } finally {
            setIsSavingLogo(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl">
            <div className="mb-6 pb-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Company details</h2>
                <p className="text-sm text-slate-500 mt-1">Manage branding for exports.</p>
            </div>

            <div className="space-y-0">
                {/* Company Name Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 border-b border-slate-200 gap-4">
                    <div className="sm:w-1/3">
                        <label className="text-sm font-semibold text-slate-900">Company Name</label>
                    </div>

                    <div className="flex-1 w-full sm:w-auto">
                        {isEditingName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
                                    placeholder="Enter company name"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={handleSaveName}
                                        disabled={isSavingName}
                                        className="p-1.5 bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        {isSavingName ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    </button>
                                    <button
                                        onClick={() => setIsEditingName(false)}
                                        className="p-1.5 text-slate-500 hover:text-slate-800"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between w-full">
                                <span className={companyName ? "text-sm text-slate-900" : "text-sm text-slate-400 italic"}>
                                    {companyName || 'Not set'}
                                </span>
                            </div>
                        )}
                    </div>

                    {!isEditingName && (
                        <div className="sm:w-auto">
                            <button
                                onClick={() => setIsEditingName(true)}
                                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                Update
                            </button>
                        </div>
                    )}
                </div>

                {/* Company Logo Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 border-b border-slate-200 gap-4">
                    <div className="sm:w-1/3">
                        <label className="text-sm font-semibold text-slate-900">Company Logo</label>
                    </div>

                    <div className="flex-1 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                            ) : (
                                <Building2 className="text-slate-400" size={18} />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">
                                {logoUrl ? 'Logo uploaded' : 'No logo set'}
                            </span>
                        </div>
                    </div>

                    <div className="sm:w-auto flex items-center gap-3">
                        {logoUrl && (
                            <button
                                onClick={handleRemoveLogo}
                                disabled={isSavingLogo}
                                className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                            >
                                Remove
                            </button>
                        )}

                        <div className="relative">
                            <input
                                type="file"
                                id="logo-upload-row"
                                className="hidden"
                                accept="image/*"
                                onChange={handleLogoSelect}
                                disabled={isSavingLogo}
                            />
                            <label
                                htmlFor="logo-upload-row"
                                className={`text-sm font-medium ${isSavingLogo ? 'text-slate-300' : 'text-slate-500 hover:text-slate-900'} cursor-pointer transition-colors`}
                            >
                                {isSavingLogo ? 'Uploading...' : (logoUrl ? 'Change logo' : 'Upload logo')}
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanySettings;

