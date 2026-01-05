import React, { useState, useRef } from 'react';
import { dbService } from '../services/dbService';
import { Language } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { Upload, Download, Trash2, AlertTriangle } from 'lucide-react';

interface SettingsProps {
    language: Language;
}

const Settings: React.FC<SettingsProps> = ({ language }) => {
    const { t } = useTranslation(language);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        await dbService.exportData();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setMessage(null);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                await dbService.importData(content);
                setMessage({ type: 'success', text: t('settings.importSuccess') });
            } catch (error) {
                console.error(error);
                setMessage({ type: 'error', text: t('settings.importError') });
            } finally {
                // Reset file input
                if(fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };
        reader.readAsText(file);
    };
    
    const handleClear = async () => {
        if (window.confirm(t('settings.clearConfirm'))) {
            await dbService.clearData();
            // Optionally, refresh the page to reflect changes
            window.location.reload();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-slate-900 font-heading">{t('settings.title')}</h2>
                <p className="text-slate-500 max-w-3xl mx-auto">{t('settings.description')}</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-center font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Export Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                            <Download size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 font-heading">{t('settings.exportTitle')}</h3>
                    </div>
                    <p className="text-slate-500 flex-1 mb-6">{t('settings.exportDesc')}</p>
                    <button onClick={handleExport} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                        {t('settings.exportButton')}
                    </button>
                </div>

                {/* Import Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-lg">
                            <Upload size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 font-heading">{t('settings.importTitle')}</h3>
                    </div>
                    <p className="text-slate-500 flex-1 mb-6">{t('settings.importDesc')}</p>
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".json"
                    />
                    <button onClick={handleImportClick} className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20">
                        {t('settings.importButton')}
                    </button>
                </div>
            </div>

            {/* Clear Data Card */}
            <div className="bg-red-50/50 p-6 rounded-2xl border-2 border-dashed border-red-200">
                <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-lg">
                        <AlertTriangle size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-red-800 font-heading">{t('settings.clearTitle')}</h3>
                </div>
                <p className="text-red-600 mb-6">{t('settings.clearDesc')}</p>
                <button onClick={handleClear} className="w-full bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">
                    {t('settings.clearButton')}
                </button>
            </div>
        </div>
    );
};

export default Settings;
