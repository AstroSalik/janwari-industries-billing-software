import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  X,
  Package,
  RefreshCw,
  Tag,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', description: '', hsnCode: '', gstRate: 18 });
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error('Category name is required');
    try {
      const payload = { 
        name: formData.name, 
        description: formData.description, 
        hsnCode: formData.hsnCode, 
        gstRate: formData.gstRate 
      };
      
      if (editingCategory) {
        await api.put(`/categories/${formData.id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/categories', payload);
        toast.success('Category created');
      }
      setShowModal(false);
      setFormData({ id: '', name: '', description: '', hsnCode: '', gstRate: 18 });
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save category');
    }
  };

  const handleEdit = (category: any) => {
    setFormData({ 
      id: category.id, 
      name: category.name, 
      description: category.description || '', 
      hsnCode: category.hsnCode || '', 
      gstRate: category.gstRate || 18 
    });
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string, count: number) => {
    if (count > 0) {
      return toast.error(`Cannot delete ${name}: ${count} products still assigned. Reassign them first.`);
    }
    
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete category');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-['Playfair_Display'] font-bold text-ji-text">Product Categories</h1>
          <p className="text-ji-text-muted text-sm mt-1">Organize your inventory with logical groupings</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => fetchCategories()}
            className="flex-1 sm:flex-none p-2 border border-ji-border bg-ji-surface rounded-lg text-ji-text-muted hover:text-ji-amber hover:border-ji-amber/50 transition-all flex justify-center shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => {
              setEditingCategory(null);
              setFormData({ id: '', name: '', description: '', hsnCode: '', gstRate: 18 });
              setShowModal(true);
            }}
            className="flex-[3] sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-ji-amber hover:bg-ji-amber/90 text-white font-semibold rounded-lg transition-all text-sm shadow-md active:scale-[0.98]"
          >
            <Plus size={18} />
            New Category
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-ji-text-muted">
          <div className="w-6 h-6 border-2 border-ji-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-ji-surface border border-ji-border rounded-xl p-6 hover:border-ji-amber/30 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-ji-amber/10 border border-ji-amber/20 flex items-center justify-center text-ji-amber group-hover:bg-ji-amber shadow-sm group-hover:text-white transition-all cursor-default">
                <Tag size={24} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(cat)}
                  className="p-1.5 text-ji-text-dim hover:text-ji-amber transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(cat.id, cat.name, cat._count?.products || 0)}
                  className="p-1.5 text-ji-text-dim hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-ji-text mb-1 flex items-center gap-2">
                {cat.name}
              </h3>
              <p className="text-sm text-ji-text-muted mb-4 line-clamp-2 h-10">
                {cat.description || 'No description provided'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-ji-border">
              <div className="bg-ji-bg px-3 py-2 rounded-lg border border-ji-border/50 shadow-inner">
                <p className="text-[10px] text-ji-text-dim uppercase tracking-widest mb-0.5 font-bold">HSN Code</p>
                <p className="text-sm font-['JetBrains_Mono'] text-ji-text font-bold">{cat.hsnCode || '—'}</p>
              </div>
              <div className="bg-ji-bg px-3 py-2 rounded-lg border border-ji-border/50 shadow-inner">
                <p className="text-[10px] text-ji-text-dim uppercase tracking-widest mb-0.5 font-bold">GST Rate</p>
                <p className="text-sm font-['JetBrains_Mono'] text-ji-amber font-bold">{cat.gstRate}%</p>
              </div>
            </div>

              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-ji-text-muted bg-ji-bg w-fit px-3 py-1.5 rounded-md border border-ji-border">
                  <Package size={14} className="text-ji-text-dim" />
                  <span className="font-['JetBrains_Mono']">{cat._count?.products || 0}</span> Products
                </div>
              </div>
            </motion.div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-3 text-center py-20 border border-dashed border-ji-border rounded-lg">
              <FolderTree size={32} className="mx-auto text-ji-text-dim mb-3" />
              <p className="text-ji-text-muted">No categories found. Create a category to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal form */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-ji-shadow backdrop-blur-sm z-40" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-ji-surface border border-ji-border rounded-lg shadow-2xl w-full max-w-md max-h-full flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-ji-border">
                  <h2 className="text-lg font-['Playfair_Display'] font-semibold text-ji-text flex items-center gap-2">
                    <FolderTree size={18} className="text-ji-amber" /> {editingCategory ? 'Edit Category' : 'New Category'}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="text-ji-text-muted hover:text-ji-text">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 flex-grow overflow-y-auto">
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-xs text-ji-text-dim uppercase tracking-wider mb-2">Category Name</label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Inverter Batteries"
                      className="w-full px-3 py-2 bg-ji-bg border border-ji-border rounded-md text-sm text-ji-text focus:border-ji-amber outline-none transition-colors"
                      autoFocus
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-xs text-ji-text-dim uppercase tracking-wider mb-2">Description</label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the category"
                      rows={3}
                      className="w-full px-3 py-2 bg-ji-bg border border-ji-border rounded-md text-sm text-ji-text focus:border-ji-amber outline-none transition-colors resize-y"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="hsnCode" className="block text-xs text-ji-text-dim uppercase tracking-wider mb-2">HSN Code</label>
                      <input
                        id="hsnCode"
                        type="text"
                        value={formData.hsnCode}
                        onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                        placeholder="e.g. 8507"
                        className="w-full px-3 py-2 bg-ji-bg border border-ji-border rounded-md text-sm text-ji-text focus:border-ji-amber outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="gstRate" className="block text-xs text-ji-text-dim uppercase tracking-wider mb-2">GST Rate (%)</label>
                      <input
                        id="gstRate"
                        type="number"
                        value={formData.gstRate}
                        onChange={(e) => setFormData({ ...formData, gstRate: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g. 18"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 bg-ji-bg border border-ji-border rounded-md text-sm text-ji-text focus:border-ji-amber outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-ji-border flex justify-end gap-3 bg-ji-bg rounded-b-lg">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-ji-text-muted hover:text-ji-text">Cancel</button>
                  <button onClick={handleSave} className="px-6 py-2 bg-ji-amber hover:bg-ji-amber/90 text-white font-semibold rounded-md text-sm">
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
