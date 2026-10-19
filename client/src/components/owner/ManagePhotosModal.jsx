import React, { useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Filter,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { propertyService } from '../../services/propertyService';

const CATEGORIES = [
  { label: 'All Photos', value: 'ALL' },
  { label: 'Cover Image', value: 'COVER' },
  { label: 'Gallery', value: 'GALLERY' },
  { label: 'Rooms', value: 'ROOM' },
  { label: 'Common Area', value: 'COMMON_AREA' },
  { label: 'Kitchen & Dining', value: 'KITCHEN' },
  { label: 'Bathroom', value: 'BATHROOM' },
  { label: 'Other', value: 'OTHER' },
];

export const ManagePhotosModal = ({ isOpen, property, onClose, onRefresh }) => {
  const [photos, setPhotos] = useState(property?.photos || []);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New photo form state
  const [newPhoto, setNewPhoto] = useState({
    url: '',
    category: 'GALLERY',
    caption: '',
    isCover: false,
  });

  if (!isOpen || !property) return null;

  const filteredPhotos =
    selectedCategory === 'ALL'
      ? photos
      : photos.filter((p) => p.category === selectedCategory || (selectedCategory === 'COVER' && p.isCover));

  const handleAddPhotoSubmit = async (e) => {
    e.preventDefault();
    if (!newPhoto.url.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await propertyService.addPropertyPhoto(property._id, newPhoto);
      if (res.success && res.data?.photos) {
        setPhotos(res.data.photos);
        setSuccessMsg('Photo added to gallery successfully!');
        setNewPhoto({
          url: '',
          category: 'GALLERY',
          caption: '',
          isCover: false,
        });
        setShowAddPhoto(false);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add photo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to remove this photo?')) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await propertyService.deletePropertyPhoto(property._id, photoId);
      if (res.success && res.data?.photos) {
        setPhotos(res.data.photos);
        setSuccessMsg('Photo removed.');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase text-brand-600">
              {property.title} • Media Center
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">Manage Property Photos</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Filter Pills & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1.5 font-bold rounded-xl transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setShowAddPhoto(!showAddPhoto)}
            variant="primary"
            size="sm"
            icon={Plus}
          >
            {showAddPhoto ? 'Cancel' : 'Add Photo'}
          </Button>
        </div>

        {/* Add Photo Form */}
        {showAddPhoto && (
          <div className="p-5 rounded-2xl bg-brand-50/40 border border-brand-200 space-y-4 animate-in fade-in duration-150">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-brand-600" /> Add Categorized Photo
            </h4>

            <form onSubmit={handleAddPhotoSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                  Photo URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={newPhoto.url}
                  onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    Photo Category
                  </label>
                  <select
                    value={newPhoto.category}
                    onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500 font-semibold"
                  >
                    <option value="COVER">Cover Photo</option>
                    <option value="GALLERY">General Gallery</option>
                    <option value="ROOM">Room / Bed View</option>
                    <option value="COMMON_AREA">Common Area / Lounge</option>
                    <option value="KITCHEN">Kitchen / Dining</option>
                    <option value="BATHROOM">Bathroom / Washroom</option>
                    <option value="OTHER">Other / Exterior</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    Caption (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Spacious 2-Seater with Study Table"
                    value={newPhoto.caption}
                    onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  id="setAsCover"
                  checked={newPhoto.isCover}
                  onChange={(e) => setNewPhoto({ ...newPhoto, isCover: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="setAsCover" className="cursor-pointer">
                  Set as Main Cover Image
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setShowAddPhoto(false)} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={loading}>
                  {loading ? 'Uploading...' : 'Save Photo'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Photos Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No photos in this category</h4>
            <p className="text-xs text-slate-500">
              Click "Add Photo" above to upload photos for this section.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((photo, idx) => (
              <div
                key={photo._id || idx}
                className="group relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-[4/3] shadow-sm flex flex-col justify-end"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || `Photo ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Top Badge */}
                <div className="absolute top-2 left-2 flex gap-1 z-10">
                  {photo.isCover && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white font-bold text-[10px] flex items-center gap-1 shadow">
                      <Star className="w-3 h-3 fill-white" /> Cover
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-xs text-white font-semibold text-[10px] shadow">
                    {photo.category || 'GALLERY'}
                  </span>
                </div>

                {/* Delete overlay */}
                {photo._id && (
                  <button
                    onClick={() => handleDeletePhoto(photo._id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-rose-700 shadow"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Caption Footer */}
                {photo.caption && (
                  <div className="relative z-10 p-2 bg-gradient-to-t from-slate-950/80 to-transparent text-white text-[11px] font-medium truncate">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagePhotosModal;
