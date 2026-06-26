import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Settings2, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function FilterSettings() {
  const { rules, addRule, updateRule, deleteRule } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', pattern: '', replacement: '' });

  const handleAdd = async () => {
    if (!newRule.name || !newRule.pattern) return;
    await addRule({
      id: uuidv4(),
      name: newRule.name,
      pattern: newRule.pattern,
      replacement: newRule.replacement,
      enabled: true,
      isSystem: false
    });
    setNewRule({ name: '', pattern: '', replacement: '' });
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
          <Settings2 className="w-5 h-5 text-indigo-500" />
          Bộ lọc chuẩn hóa văn bản
        </h3>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Thêm quy tắc
        </button>
      </div>

      {isEditing && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg space-y-3">
          <input
            placeholder="Tên quy tắc (vd: Xóa dấu ngoặc)"
            value={newRule.name}
            onChange={e => setNewRule(r => ({ ...r, name: e.target.value }))}
            className="w-full text-sm p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <div className="flex gap-2">
            <input
              placeholder="Biểu thức Regex"
              value={newRule.pattern}
              onChange={e => setNewRule(r => ({ ...r, pattern: e.target.value }))}
              className="flex-1 text-sm p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono"
            />
            <input
              placeholder="Thay thế bằng"
              value={newRule.replacement}
              onChange={e => setNewRule(r => ({ ...r, replacement: e.target.value }))}
              className="flex-1 text-sm p-2 rounded border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">Hủy</button>
            <button onClick={handleAdd} className="px-3 py-1 text-sm bg-indigo-500 text-white rounded hover:bg-indigo-600">Lưu</button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {rules.map(rule => (
          <div key={rule.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => updateRule({ ...rule, enabled: !rule.enabled })}
                className={`w-10 h-5 rounded-full relative transition-colors ${rule.enabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${rule.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{rule.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono opacity-70 group-hover:opacity-100">
                  /{rule.pattern}/g → "{rule.replacement}"
                </p>
              </div>
            </div>
            {!rule.isSystem && (
              <button 
                onClick={() => deleteRule(rule.id)}
                className="text-red-400 hover:text-red-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {rule.isSystem && (
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Sys</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
