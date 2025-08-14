import { useState } from 'react';

interface InfoField {
  id: string;
  value: string;
}

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (sectionName: string, informationNeeded: string[]) => void;
}

export default function AddSectionModal({ isOpen, onClose, onAdd }: AddSectionModalProps) {
  const [sectionName, setSectionName] = useState('');
  const [infoFields, setInfoFields] = useState<InfoField[]>([
    { id: crypto.randomUUID(), value: '' }
  ]);

  const handleAddField = () => {
    setInfoFields(prev => [...prev, { id: crypto.randomUUID(), value: '' }]);
  };

  const handleRemoveField = (id: string) => {
    if (infoFields.length === 1) return;
    setInfoFields(prev => prev.filter(field => field.id !== id));
  };

  const handleFieldChange = (id: string, value: string) => {
    setInfoFields(prev => 
      prev.map(field => field.id === id ? { ...field, value } : field)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validFields = infoFields.map(f => f.value.trim()).filter(Boolean);
    if (!sectionName.trim() || validFields.length === 0) return;
    
    onAdd(sectionName.trim(), validFields);
    setSectionName('');
    setInfoFields([{ id: crypto.randomUUID(), value: '' }]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Add Analysis Section
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="sectionName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Section Name
            </label>
            <input
              type="text"
              id="sectionName"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="e.g., Technical Analysis"
              className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Information Needed
              </label>
              <button
                type="button"
                onClick={handleAddField}
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Field
              </button>
            </div>

            <div className="space-y-3">
              {infoFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={`Information field ${index + 1}`}
                    className="flex-1 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary"
                    required
                  />
                  {infoFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveField(field.id)}
                      className="p-2 text-slate-400 hover:text-error transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg"
            >
              Add Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 