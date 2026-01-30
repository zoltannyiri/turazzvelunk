import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import huLocale from '@fullcalendar/core/locales/hu';
import moment from 'moment'; 
import 'moment/locale/hu';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { X, ChevronLeft, ChevronRight, MapPin, Euro, Clock, Sparkles, Calendar as CalIcon } from 'lucide-react';
import { AuthContext } from "../../context/AuthContext";
import { toast } from 'react-toastify';
import './CalendarScreen.css';

const CalendarScreen = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const calendarRef = useRef(null);
    const [tours, setTours] = useState([]);
    const [currentMonth, setCurrentMonth] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTourId, setEditingTourId] = useState(null);

    const initialTourState = {
        title: '', location: '', description: '', price: '', duration: '', 
        difficulty: 'Könnyű', image_url: '', start_date: '', end_date: ''
    };
    const [newTour, setNewTour] = useState(initialTourState);
    const [hoveredEvent, setHoveredEvent] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const fetchTours = useCallback(async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/tours`);
            const data = await res.json();
            setTours(data.map(t => ({
                id: t.id,
                title: t.title,
                start: t.start_date,
                end: moment(t.end_date).add(1, 'days').format('YYYY-MM-DD'), 
                extendedProps: { ...t }
            })));
        } catch (err) { toast.error("Hiba a betöltéskor!"); }
    }, []);

    useEffect(() => { 
        fetchTours(); 
        setTimeout(() => {
            if (calendarRef.current) setCurrentMonth(calendarRef.current.getApi().view.title);
        }, 150);
    }, [fetchTours]);

    const handleSubmitTour = async (e) => {
        e.preventDefault();
        const formatDate = (date) => (date instanceof Date ? moment(date).format('YYYY-MM-DD') : date);
        const payload = {
            ...newTour,
            start_date: formatDate(newTour.start_date),
            end_date: formatDate(newTour.end_date),
        };
        const method = editingTourId ? 'PUT' : 'POST';
        const url = editingTourId ? `${import.meta.env.VITE_API_URL}/tours/${editingTourId}` : `${import.meta.env.VITE_API_URL}/tours`;

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            toast.success("🚀 Kész!");
            setIsModalOpen(false);
            setEditingTourId(null);
            setNewTour(initialTourState);
            fetchTours();
        }
    };

    const handleSelect = (info) => {
        if (user?.role !== 'admin') return;
        setEditingTourId(null);
        setNewTour({
            ...initialTourState,
            start_date: new Date(info.startStr),
            end_date: moment(info.endStr).subtract(1, 'days').toDate()
        });
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#fcfdfe] p-4 lg:p-10" onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
            <div className="max-w-[1550px] mx-auto">
                <header className="flex justify-between items-center mb-10 gap-8">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
                        Túra<span className="text-emerald-500 not-italic">Naptár</span>
                    </h1>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                        <button onClick={() => { calendarRef.current.getApi().prev(); setCurrentMonth(calendarRef.current.getApi().view.title); }} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronLeft size={24}/></button>
                        <span className="text-xl font-black text-slate-800 min-w-[220px] text-center capitalize">{currentMonth}</span>
                        <button onClick={() => { calendarRef.current.getApi().next(); setCurrentMonth(calendarRef.current.getApi().view.title); }} className="p-2 hover:bg-slate-50 rounded-xl transition-all"><ChevronRight size={24}/></button>
                    </div>
                </header>

                <div className="calendar-main-container">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locales={[huLocale]}
                        locale="hu"
                        firstDay={1}
                        selectable={user?.role === 'admin'}
                        select={handleSelect}
                        events={tours}
                        eventContent={(info) => {
                            const colors = { 'Könnyű': '#10b981', 'Közepes': '#f59e0b', 'Nehéz': '#ef4444' };
                            return (
                                <div className="event-bar-wrapper" style={{ backgroundColor: colors[info.event.extendedProps.difficulty] || '#6366f1' }}>
                                    <span className="event-title-text truncate">{info.event.title}</span>
                                </div>
                            );
                        }}
                        eventMouseEnter={(info) => setHoveredEvent(info.event.extendedProps)}
                        eventMouseLeave={() => setHoveredEvent(null)}
                        eventClick={(info) => navigate(`/tours/${info.event.id}`)}
                        height={740}
                        headerToolbar={false}
                    />
                </div>
            </div>
            
            {hoveredEvent && (
                <div className="tour-tooltip-card" style={{ left: mousePos.x + 20, top: mousePos.y > window.innerHeight - 360 ? mousePos.y - 380 : mousePos.y + 20 }}>
                    <img src={hoveredEvent.image_url} className="tooltip-image" alt="" />
                    <div className="tooltip-content">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{hoveredEvent.difficulty}</span>
                            <span className="tooltip-price-tag">{hoveredEvent.price?.toLocaleString()} Ft</span>
                        </div>
                        <h3 className="font-black text-slate-900 text-xl mb-4">{hoveredEvent.title}</h3>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-xl" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] animate-in zoom-in duration-300">
                        <h2 className="text-3xl font-black text-emerald-950 mb-8 italic">{editingTourId ? 'Túra szerkesztése' : 'Új túra meghirdetése'}</h2>
                        <form onSubmit={handleSubmitTour} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="form-label-premium">Túra megnevezése</label>
                                <input type="text" required value={newTour.title} className="form-input-premium" onChange={e => setNewTour({...newTour, title: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label-premium">Helyszín</label>
                                <input type="text" required value={newTour.location} className="form-input-premium" onChange={e => setNewTour({...newTour, location: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label-premium">Nehézség</label>
                                <select value={newTour.difficulty} className="form-input-premium" onChange={e => setNewTour({...newTour, difficulty: e.target.value})}>
                                    <option>Könnyű</option><option>Közepes</option><option>Nehéz</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="form-label-premium">Időtartam (Intervallum)</label>
                                <div className="relative">
                                    <DatePicker selectsRange startDate={newTour.start_date} endDate={newTour.end_date} onChange={(u) => setNewTour({...newTour, start_date: u[0], end_date: u[1]})} className="form-input-premium font-bold" dateFormat="yyyy. MM. dd." />
                                    <CalIcon className="absolute right-4 top-5 text-emerald-500/50" size={20} />
                                </div>
                            </div>
                            <div><label className="form-label-premium">Ár (Ft)</label><input type="number" value={newTour.price} className="form-input-premium" onChange={e => setNewTour({...newTour, price: e.target.value})} /></div>
                            <div><label className="form-label-premium">Idő (Óra)</label><input type="number" value={newTour.duration} className="form-input-premium" onChange={e => setNewTour({...newTour, duration: e.target.value})} /></div>
                            <div className="md:col-span-2"><label className="form-label-premium">Kép URL</label><input type="text" value={newTour.image_url} className="form-input-premium" onChange={e => setNewTour({...newTour, image_url: e.target.value})} /></div>
                            <div className="md:col-span-2"><label className="form-label-premium">Leírás</label><textarea rows="3" value={newTour.description} className="form-input-premium" onChange={e => setNewTour({...newTour, description: e.target.value})}></textarea></div>
                            <button type="submit" className="md:col-span-2 w-full py-5 rounded-[2rem] font-black text-xl bg-emerald-600 text-white shadow-xl hover:bg-emerald-700 transition-all uppercase">
                                {editingTourId ? '💾 Módosítások mentése' : '🚀 Túra közzététele'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarScreen;