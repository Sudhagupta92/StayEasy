import React, { useState, useEffect } from 'react';
import {
  X,
  BedDouble,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  User,
  ShieldAlert,
  Settings2,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { propertyService } from '../../services/propertyService';

const BED_STATUS_COLORS = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  BOOKED: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  OCCUPIED: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  MAINTENANCE: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  BLOCKED: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
};

export const ManageRoomsModal = ({ isOpen, property, onClose, onRefresh }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Room Form State
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoom, setNewRoom] = useState({
    floor: 1,
    roomNumber: '',
    roomType: 'SINGLE',
    sharingType: 'SINGLE',
    rent: 10000,
    deposit: 15000,
    bedCount: 1,
    attachedWashroom: true,
    hasAC: false,
    hasBalcony: false,
  });
  const [addingRoom, setAddingRoom] = useState(false);

  // Bed Status Quick Edit Modal
  const [selectedBed, setSelectedBed] = useState(null); // { roomId, bed }
  const [bedStatusForm, setBedStatusForm] = useState('AVAILABLE');
  const [bedNotes, setBedNotes] = useState('');
  const [updatingBed, setUpdatingBed] = useState(false);

  // Fetch Rooms
  const fetchRooms = async () => {
    if (!property?._id) return;
    setLoading(true);
    try {
      const res = await propertyService.getPropertyRooms(property._id);
      if (res.success && res.data?.rooms) {
        setRooms(res.data.rooms);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && property?._id) {
      fetchRooms();
      setShowAddRoom(false);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, property?._id]);

  if (!isOpen || !property) return null;

  // Group Rooms by Floor
  const groupedByFloor = rooms.reduce((acc, room) => {
    const fl = room.floor || 1;
    if (!acc[fl]) acc[fl] = [];
    acc[fl].push(room);
    return acc;
  }, {});

  const floorKeys = Object.keys(groupedByFloor).sort((a, b) => Number(a) - Number(b));

  // Compute Total Metrics
  let totalBeds = 0;
  let availableBeds = 0;
  let occupiedBeds = 0;
  let maintenanceBeds = 0;

  rooms.forEach((r) => {
    if (r.beds && r.beds.length > 0) {
      r.beds.forEach((b) => {
        totalBeds++;
        if (b.status === 'AVAILABLE') availableBeds++;
        else if (b.status === 'OCCUPIED' || b.status === 'BOOKED') occupiedBeds++;
        else if (b.status === 'MAINTENANCE' || b.status === 'BLOCKED') maintenanceBeds++;
      });
    }
  });

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault();
    setAddingRoom(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await propertyService.addRoom(property._id, newRoom);
      if (res.success) {
        setSuccessMsg(`Room ${newRoom.roomNumber} added successfully!`);
        setShowAddRoom(false);
        setNewRoom({
          floor: newRoom.floor,
          roomNumber: '',
          roomType: 'SINGLE',
          sharingType: 'SINGLE',
          rent: 10000,
          deposit: 15000,
          bedCount: 1,
          attachedWashroom: true,
          hasAC: false,
          hasBalcony: false,
        });
        await fetchRooms();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add room');
    } finally {
      setAddingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId, roomNumber) => {
    if (!window.confirm(`Are you sure you want to delete Room ${roomNumber}?`)) return;
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await propertyService.deleteRoom(property._id, roomId);
      if (res.success) {
        setSuccessMsg(`Room ${roomNumber} deleted.`);
        await fetchRooms();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete room');
    }
  };

  const handleUpdateBedStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBed) return;

    setUpdatingBed(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await propertyService.updateBedStatus(
        property._id,
        selectedBed.roomId,
        selectedBed.bed._id,
        {
          status: bedStatusForm,
          notes: bedNotes,
        }
      );

      if (res.success) {
        setSuccessMsg(`Bed ${selectedBed.bed.bedNumber} status updated to ${bedStatusForm}!`);
        setSelectedBed(null);
        await fetchRooms();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update bed status');
    } finally {
      setUpdatingBed(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase text-brand-600">
              {property.title} • {property.propertyType}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900">Rooms & Beds Matrix Management</h3>
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

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Rooms</span>
            <span className="text-xl font-extrabold text-slate-900 font-mono">{rooms.length}</span>
          </div>
          <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Available Beds</span>
            <span className="text-xl font-extrabold text-emerald-600 font-mono">{availableBeds}</span>
          </div>
          <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100">
            <span className="text-[10px] font-bold text-blue-700 uppercase block">Occupied / Booked</span>
            <span className="text-xl font-extrabold text-blue-600 font-mono">{occupiedBeds}</span>
          </div>
          <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100">
            <span className="text-[10px] font-bold text-amber-700 uppercase block">Occupancy Rate</span>
            <span className="text-xl font-extrabold text-amber-600 font-mono">
              {totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Layers className="w-4 h-4 text-brand-600" />
            <span>Floor-by-Floor Inventory View</span>
          </div>
          <Button
            onClick={() => setShowAddRoom(!showAddRoom)}
            variant="primary"
            size="sm"
            icon={Plus}
          >
            {showAddRoom ? 'Cancel' : 'Add New Room'}
          </Button>
        </div>

        {/* Add Room Inline Form */}
        {showAddRoom && (
          <div className="p-5 rounded-2xl bg-brand-50/40 border border-brand-200 space-y-4 animate-in fade-in duration-150">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-brand-600" /> Add Room to Property
            </h4>

            <form onSubmit={handleAddRoomSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Floor Number
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newRoom.floor}
                    onChange={(e) => setNewRoom({ ...newRoom, floor: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Room Number / Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 101, 202A"
                    value={newRoom.roomNumber}
                    onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Sharing Type
                  </label>
                  <select
                    value={newRoom.sharingType}
                    onChange={(e) => {
                      const type = e.target.value;
                      let count = 1;
                      if (type === 'DOUBLE') count = 2;
                      if (type === 'TRIPLE') count = 3;
                      if (type === 'FOUR_SHARING') count = 4;
                      setNewRoom({
                        ...newRoom,
                        sharingType: type,
                        roomType: type,
                        bedCount: count,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="SINGLE">Single Seater (1 Bed)</option>
                    <option value="DOUBLE">Double Sharing (2 Beds)</option>
                    <option value="TRIPLE">Triple Sharing (3 Beds)</option>
                    <option value="FOUR_SHARING">4-Seater Sharing (4 Beds)</option>
                    <option value="FLAT_FULL">Entire Flat</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Number of Beds
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={newRoom.bedCount}
                    onChange={(e) => setNewRoom({ ...newRoom, bedCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Monthly Rent per Bed (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newRoom.rent}
                    onChange={(e) => setNewRoom({ ...newRoom, rent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newRoom.deposit}
                    onChange={(e) => setNewRoom({ ...newRoom, deposit: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoom.hasAC}
                    onChange={(e) => setNewRoom({ ...newRoom, hasAC: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Air Conditioner (AC)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoom.attachedWashroom}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, attachedWashroom: e.target.checked })
                    }
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Attached Washroom</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRoom.hasBalcony}
                    onChange={(e) => setNewRoom({ ...newRoom, hasBalcony: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Balcony</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => setShowAddRoom(false)} variant="outline" size="sm">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={addingRoom}>
                  {addingRoom ? 'Creating Room...' : 'Create Room & Beds'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Room Matrix Loading / Empty / Content */}
        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            <span>Loading rooms and beds...</span>
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <BedDouble className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No structured rooms configured yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "Add New Room" above to set up floor-by-floor rooms and manage individual bed vacancy.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {floorKeys.map((fl) => (
              <div key={fl} className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200 text-xs font-bold text-slate-800">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono text-[11px]">
                    F{fl}
                  </span>
                  <span>Floor {fl}</span>
                  <span className="text-slate-400 font-normal">({groupedByFloor[fl].length} Rooms)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedByFloor[fl].map((room) => (
                    <div
                      key={room._id}
                      className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                            Room {room.roomNumber}
                          </span>
                          <Badge variant="brand" size="sm">
                            {room.sharingType?.replace('_', ' ') || room.roomType}
                          </Badge>
                        </div>

                        <button
                          onClick={() => handleDeleteRoom(room._id, room.roomNumber)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Room"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="font-bold text-slate-900 font-mono">
                          ₹{room.rent?.toLocaleString()}/mo
                        </span>
                        <span>•</span>
                        <span>Deposit: ₹{room.deposit?.toLocaleString()}</span>
                        {room.hasAC && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">AC</span>}
                        {room.attachedWashroom && <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">Bath</span>}
                        {room.hasBalcony && <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">Balcony</span>}
                      </div>

                      {/* Bed Status Grid */}
                      <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Beds ({room.beds?.length || 0}) • Click bed to change status
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {room.beds?.map((bed) => {
                            const statusColor =
                              BED_STATUS_COLORS[bed.status] || BED_STATUS_COLORS.AVAILABLE;
                            return (
                              <button
                                key={bed._id}
                                type="button"
                                onClick={() => {
                                  setSelectedBed({ roomId: room._id, bed });
                                  setBedStatusForm(bed.status);
                                  setBedNotes(bed.notes || '');
                                }}
                                className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${statusColor}`}
                              >
                                <span>{bed.bedNumber}</span>
                                <span className="text-[10px] font-normal uppercase opacity-75">
                                  ({bed.status})
                                </span>
                                {bed.occupiedBy && (
                                  <User className="w-3 h-3 text-blue-600 ml-0.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Bed Status Editor Modal */}
        {selectedBed && (
          <div className="fixed inset-0 z-60 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-brand-600">Bed Status Manager</span>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Update {selectedBed.bed.bedNumber}
                  </h4>
                </div>
                <button onClick={() => setSelectedBed(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                  ✕
                </button>
              </div>

              {selectedBed.bed.occupiedBy && (
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-xs space-y-0.5 text-blue-900">
                  <span className="font-bold block">Assigned Resident:</span>
                  <p>{selectedBed.bed.occupiedBy.name || selectedBed.bed.occupiedBy.email}</p>
                </div>
              )}

              <form onSubmit={handleUpdateBedStatusSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    Select Bed Status
                  </label>
                  <select
                    value={bedStatusForm}
                    onChange={(e) => setBedStatusForm(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="AVAILABLE">AVAILABLE (Vacant Seat)</option>
                    <option value="OCCUPIED">OCCUPIED (Active Resident)</option>
                    <option value="BOOKED">BOOKED (Reserved)</option>
                    <option value="MAINTENANCE">MAINTENANCE (Repair in progress)</option>
                    <option value="BLOCKED">BLOCKED (Unavailable)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 block mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Reserved for corporate joiner"
                    value={bedNotes}
                    onChange={(e) => setBedNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button onClick={() => setSelectedBed(null)} variant="outline" size="sm">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={updatingBed}>
                    {updatingBed ? 'Saving...' : 'Update Bed'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageRoomsModal;
