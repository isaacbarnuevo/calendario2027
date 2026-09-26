import React, { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Calculator, LayoutGrid, PlaneTakeoff, Settings, Flame, Users, Edit3, XCircle, CheckCircle2, ChevronDown, ChevronUp, Star, CalendarDays, Clock, Bell, CalendarCheck, Play } from 'lucide-react';

const QUOTAS_INITIAL = {
  A: {
    1: { L: 0, SD: 0 }, 2: { L: 155, SD: 18 }, 3: { L: 155, SD: 18 }, 4: { L: 147, SD: 15 },
    5: { L: 147, SD: 15 }, 6: { q1: { L: 138, SD: 15 }, q2: { L: 86, SD: 10 } },
    7: { L: 82, SD: 10 }, 8: { L: 80, SD: 10 }, 9: { L: 84, SD: 10 },
    10: { L: 138, SD: 15 }, 11: { L: 120, SD: 10 }, 12: { L: 88, SD: 10 }
  }
};

const WEEK_DAYS  = ['L','M','X','J','V','S','D'];
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const PATTERN_28_DAYS = [
  true, false,false,false,false,true, true,
  false,false,false,false,false,true, true,
  false,false,false,true, true, false,false,
  false,true, true, false,false,false,false
];

const VACATIONS = {
  summer: [
    { id:'S1',  name:'Gr.1: 16/Jun - 15/Jul', m1:6,d1:16,m2:7, d2:15 },
    { id:'S2',  name:'Gr.2: 8/Ago - 30/Ago',  m1:8,d1:8, m2:8, d2:30 },
    { id:'S3',  name:'Gr.3: 1/Sep - 30/Sep',  m1:9,d1:1, m2:9, d2:30 },
    { id:'S4',  name:'Gr.4: 16/Jul - 7/Ago',  m1:7,d1:16,m2:8, d2:7  },
    { id:'S51', name:'Gr.51: 1/Ago - 30/Ago', m1:8,d1:1, m2:8, d2:30 },
    { id:'S52', name:'Gr.52: 1/Jul - 30/Jul', m1:7,d1:1, m2:7, d2:30 },
    { id:'S53', name:'Gr.53: 1/Sep - 30/Sep', m1:9,d1:1, m2:9, d2:30 }
  ],
  winter: [
    { id:'W11', name:'Gr.11: 18/Nov - 08/Dic', m1:11,d1:18,m2:12,d2:8  },
    { id:'W12', name:'Gr.12: 26/Oct - 15/Nov', m1:10,d1:26,m2:11,d2:15 },
    { id:'W21', name:'Gr.21: 24/Abr - 21/May', m1:4, d1:24,m2:5, d2:21 },
    { id:'W22', name:'Gr.22: 01/Ene - 28/Ene', m1:1, d1:1, m2:1, d2:28 },
    { id:'W23', name:'Gr.23: 25/Feb - 24/Mar', m1:2, d1:25,m2:3, d2:24 },
    { id:'W24', name:'Gr.24: 26/Mar - 22/Abr', m1:3, d1:26,m2:4, d2:22 },
    { id:'W31', name:'Gr.31: 23/May - 12/Jun', m1:5, d1:23,m2:6, d2:12 },
    { id:'W32', name:'Gr.32: 11/Dic - 31/Dic', m1:12,d1:11,m2:12,d2:31 },
    { id:'W52', name:'Gr.52: 3/Feb - 23/Feb',  m1:2, d1:3, m2:2, d2:23 }
  ]
};

function getEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export default function App() {
  const [selectedYear,    setSelectedYear]  = useState(2027);
  const [turn,            setTurn]          = useState(1);
  const [restGroup,       setRestGroup]     = useState(2);
  const [groupLastYear,   setGroupLastYear] = useState(3);
  const [subGroup5,       setSubGroup5]     = useState('S51');
  const [winVac,          setWinVac]        = useState('W11');
  const [requestedDays,   setRequestedDays] = useState(new Set());
  
  const [showConfig,      setShowConfig]    = useState(false);
  const [clickMode,       setClickMode]     = useState('pedir'); // pedir | plan_a | plan_b | plan_c | vacaciones | agotar
  const [shiftPhase,      setShiftPhase]    = useState('manana'); // manana | tarde
  
  const [customVacationDays, setCustomVacationDays] = useState(new Set());
  const [planA,           setPlanA]         = useState(new Set());
  const [planB,           setPlanB]         = useState(new Set());
  const [planC,           setPlanC]         = useState(new Set());
  const [exhaustedDays,   setExhaustedDays] = useState(new Set());
  const [errorMsg,        setErrorMsg]      = useState('');

  const [appDay,          setAppDay]        = useState(22);
  const [appTime,         setAppTime]       = useState('10:00');
  const [simMode,         setSimMode]       = useState('real');
  const [simOffset,       setSimOffset]     = useState(0);
  const [now,             setNow]           = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const effectiveNow = new Date(now.getTime() + simOffset);

  const simulateTo = (mode) => {
    if (mode === 'real') { setSimOffset(0); setSimMode('real'); return; }
    let target;
    const currentYear = selectedYear;
    if (mode === 'jan15') target = new Date(currentYear, 0, 15, 12, 0);
    else if (mode === 'jan22_pre') {
       const [h,m] = appTime.split(':');
       target = new Date(currentYear, 0, appDay, parseInt(h), parseInt(m) - 4);
    }
    else if (mode === 'jan22_in') {
       const [h,m] = appTime.split(':');
       target = new Date(currentYear, 0, appDay, parseInt(h), parseInt(m) + 2);
    }
    else if (mode === 'jan29') target = new Date(currentYear, 0, 29, 10, 0);
    
    setSimOffset(target.getTime() - new Date().getTime());
    setSimMode(mode);
  };

  const targetCita = new Date(selectedYear, 0, appDay, parseInt(appTime.split(':')[0]), parseInt(appTime.split(':')[1]));
  const msToCita = targetCita.getTime() - effectiveNow.getTime();
  
  const isPreAccess = msToCita <= 300000 && msToCita > 0;
  const isActiveTurn = msToCita <= 0 && msToCita > -600000;
  
  const formatMs = (ms) => {
    const abs = Math.abs(ms);
    const m = Math.floor(abs / 60000);
    const s = Math.floor((abs % 60000) / 1000);
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const optPositions = 13;
  const currentTurn  = Math.min(turn, optPositions);

  useEffect(() => { if (turn > optPositions) setTurn(optPositions); }, [optPositions, turn]);

  const handleYearChange = (newYear) => {
    setSelectedYear(newYear);
    setRequestedDays(new Set());
    setPlanA(new Set());
    setPlanB(new Set());
    setPlanC(new Set());
    setExhaustedDays(new Set());
  };

  const dynamicMonths = useMemo(() => {
    const list = [];
    for (let m = 1; m <= 12; m++) {
      const daysInMonth = new Date(selectedYear, m, 0).getDate();
      let startD = new Date(selectedYear, m - 1, 1).getDay();
      startD = (startD === 0) ? 6 : startD - 1; // 0=Mon, ..., 6=Sun
      list.push({ id: m, name: MONTH_NAMES[m-1], days: daysInMonth, startDay: startD });
    }
    return list;
  }, [selectedYear]);

  const highDemandDays = useMemo(() => {
    const hd = new Set();
    const fixedHolidays = ['1-1', '1-6', '5-1', '5-2', '8-15', '10-12', '11-1', '11-9', '12-6', '12-8', '12-25'];
    
    const addDays = (date, days) => new Date(date.getTime() + days * 86400000);
    const formatDate = (date) => `${date.getMonth() + 1}-${date.getDate()}`;
    
    // Semana Santa
    const easter = getEasterSunday(selectedYear);
    const holyWeek = [4,3,2,1,0,-1].map(d => formatDate(addDays(easter, -d)));
    holyWeek.forEach(d => hd.add(d));

    // Puentes dinámicos
    fixedHolidays.forEach(hStr => {
      const [m, d] = hStr.split('-').map(Number);
      const date = new Date(selectedYear, m - 1, d);
      const dow = date.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      
      hd.add(hStr);
      
      if (dow === 2) { // Martes -> Lunes es puente y Viernes anterior
        hd.add(formatDate(addDays(date, -1)));
        hd.add(formatDate(addDays(date, -4)));
      } else if (dow === 4) { // Jueves -> Viernes es puente
        hd.add(formatDate(addDays(date, 1)));
      } else if (dow === 1) { // Lunes -> Viernes anterior
        hd.add(formatDate(addDays(date, -3)));
      } else if (dow === 3) { // Miércoles -> Jueves y Viernes
        hd.add(formatDate(addDays(date, 1)));
        hd.add(formatDate(addDays(date, 2)));
      }
    });

    // Semana del puente de Diciembre (6 y 8)
    const dec6 = new Date(selectedYear, 11, 6);
    let dec6Dow = dec6.getDay();
    dec6Dow = dec6Dow === 0 ? 7 : dec6Dow; 
    const startOfDecWeek = addDays(dec6, -(dec6Dow - 1)); // Lunes
    for (let i = -3; i <= 4; i++) {
      const current = addDays(startOfDecWeek, i);
      if (current.getDay() > 0 && current.getDay() < 6) { // Solo L-V
        hd.add(formatDate(current));
      }
    }

    // Navidades completas
    for (let i = 23; i <= 31; i++) {
      hd.add(`12-${i}`);
    }

    // Puente de Mayo (Si 1 o 2 caen en finde)
    const may1 = new Date(selectedYear, 4, 1);
    const may2 = new Date(selectedYear, 4, 2);
    if (may1.getDay() === 6) hd.add('4-30'); // Sábado -> Viernes 30
    if (may2.getDay() === 0) { hd.add('5-3'); hd.add('5-4'); } // Domingo -> Lunes 3 y Martes 4

    return hd;
  }, [selectedYear]);

  const MAQUINISTAS_PER_TURN = 154;
  const maquinistasAhead     = (currentTurn - 1) * MAQUINISTAS_PER_TURN;
  const diasArrasados        = Math.round(maquinistasAhead * 11.5);

  const groupCurrentYear = (groupLastYear % 5) + 1;

  const sumVac = useMemo(() => {
    if (groupCurrentYear === 1) return 'S1';
    if (groupCurrentYear === 2) return 'S2';
    if (groupCurrentYear === 3) return 'S3';
    if (groupCurrentYear === 4) return 'S4';
    return subGroup5;
  }, [groupCurrentYear, subGroup5]);

  const sumVacName = VACATIONS.summer.find(v => v.id === sumVac)?.name || '';

  useEffect(() => {
    const s = new Set();
    const addRange = vac => {
      if (!vac) return;
      for (let m = vac.m1; m <= vac.m2; m++) {
        const mDays = new Date(selectedYear, m, 0).getDate();
        const start = m === vac.m1 ? vac.d1 : 1;
        const end   = m === vac.m2 ? vac.d2 : mDays;
        for (let d = start; d <= end; d++) s.add(`${m}-${d}`);
      }
    };
    addRange(VACATIONS.summer.find(v => v.id === sumVac));
    addRange(VACATIONS.winter.find(v => v.id === winVac));
    setCustomVacationDays(s);
  }, [sumVac, winVac, selectedYear]);

  const vacationDays = customVacationDays;

  const baseOffDays = useMemo(() => {
    const s = new Set();
    const anchor = new Date(2027, 0, 1).getTime();
    const offset = (restGroup - 1) * 7;
    
    for (let m = 1; m <= 12; m++) {
      const daysInMonth = new Date(selectedYear, m, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const current = new Date(selectedYear, m - 1, d).getTime();
        const diffInDays = Math.round((current - anchor) / 86400000);
        const pi = (diffInDays - 3 + offset + 280000) % 28;
        if (PATTERN_28_DAYS[pi]) s.add(`${m}-${d}`);
      }
    }
    return s;
  }, [restGroup, selectedYear]);

  const stats = useMemo(() => {
    let workedDaysGross = 0, offDaysCount = 0, vacDaysCount = 0;
    dynamicMonths.forEach(mObj => {
      for (let day = 1; day <= mObj.days; day++) {
        const dateKey = `${mObj.id}-${day}`;
        if (baseOffDays.has(dateKey))             offDaysCount++;
        else if (vacationDays.has(dateKey))       vacDaysCount++;
        else workedDaysGross++;
      }
    });
    const grossCredit  = Math.max(0, workedDaysGross - 202);
    const creditNeto   = grossCredit;
    const obligatoryLV = Math.min(grossCredit, 7);
    const freeSD       = Math.max(0, grossCredit - 7);
    return { workedDays: workedDaysGross, offDaysCount, vacDaysCount,
             grossCredit, credit: creditNeto, obligatoryLV, freeSD };
  }, [baseOffDays, vacationDays, dynamicMonths]);

  const reqStats = useMemo(() => {
    let usedLV = 0, usedSD = 0;
    requestedDays.forEach(key => {
      const [mStr, dStr] = key.split('-');
      const mObj  = dynamicMonths.find(x => x.id === parseInt(mStr));
      if (!mObj) return;
      const dow   = (mObj.startDay + parseInt(dStr) - 1) % 7;
      if (dow >= 5) usedSD++; else usedLV++;
    });
    return { usedLV, usedSD, total: usedLV + usedSD };
  }, [requestedDays, dynamicMonths]);

  const sortDays = (setOfDays) => {
    return Array.from(setOfDays).map(key => {
      const [m, d] = key.split('-').map(Number);
      return { m, d, key };
    }).sort((a,b) => a.m !== b.m ? a.m - b.m : a.d - b.d);
  };

  const sortedRequestedDays = useMemo(() => sortDays(requestedDays), [requestedDays]);
  const sortedPlanA = useMemo(() => sortDays(planA), [planA]);
  const sortedPlanB = useMemo(() => sortDays(planB), [planB]);
  const sortedPlanC = useMemo(() => sortDays(planC), [planC]);

  const getRemainingQuota = (monthId, day, isWeekend) => {
    if (monthId === 1) return 0;
    const optKey = 'A';
    let initial;
    if (monthId === 6)
      initial = day <= 15
        ? (isWeekend ? QUOTAS_INITIAL[optKey][6].q1.SD : QUOTAS_INITIAL[optKey][6].q1.L)
        : (isWeekend ? QUOTAS_INITIAL[optKey][6].q2.SD : QUOTAS_INITIAL[optKey][6].q2.L);
    else
      initial = isWeekend ? QUOTAS_INITIAL[optKey][monthId].SD : QUOTAS_INITIAL[optKey][monthId].L;

    // Apply half-quota rule based on morning/afternoon split
    initial = shiftPhase === 'manana' ? Math.ceil(initial / 2) : Math.floor(initial / 2);

    const tp        = (currentTurn - 1) / Math.max(optPositions - 1, 1);
    const isSummer  = monthId===7 || monthId===8 || (monthId===6 && day>15);
    const isPuente  = highDemandDays.has(`${monthId}-${day}`) && !isWeekend;
    const isGood    = (monthId===5||monthId===9||monthId===12||(monthId===6&&day<=15)) && !isWeekend && !isPuente;

    let factor = 1;
    if (isPuente)   factor = 2.1;
    else if (isSummer)   factor = 1.9;
    else if (isWeekend)  factor = 1.7;
    else if (isGood)     factor = 1.1;
    else                 factor = 0.6;

    if (shiftPhase === 'tarde') {
      factor = factor * 0.70; // 30% less aggressive depletion in the afternoon since many have exhausted credit
    }

    return Math.round(initial * Math.max(0, 1 - tp * factor));
  };

  const toggleExhausted = (dateKey) => {
    const n = new Set(exhaustedDays);
    if (n.has(dateKey)) {
      n.delete(dateKey);
    } else {
      n.add(dateKey);
      if (requestedDays.has(dateKey)) { const req = new Set(requestedDays); req.delete(dateKey); setRequestedDays(req); }
      if (planA.has(dateKey)) { const a = new Set(planA); a.delete(dateKey); setPlanA(a); }
      if (planB.has(dateKey)) { const b = new Set(planB); b.delete(dateKey); setPlanB(b); }
      if (planC.has(dateKey)) { const c = new Set(planC); c.delete(dateKey); setPlanC(c); }
    }
    setExhaustedDays(n);
  };

  const setPlanDay = (dateKey, planType) => {
    if (planA.has(dateKey)) { const a = new Set(planA); a.delete(dateKey); setPlanA(a); }
    if (planB.has(dateKey)) { const b = new Set(planB); b.delete(dateKey); setPlanB(b); }
    if (planC.has(dateKey)) { const c = new Set(planC); c.delete(dateKey); setPlanC(c); }
    
    // Si estaba en el mismo plan, ya lo hemos borrado actuando como Toggle. Si estaba en otro, lo añadimos al nuevo.
    let isTogglingOff = false;
    if (planType === 'plan_a' && planA.has(dateKey)) isTogglingOff = true;
    if (planType === 'plan_b' && planB.has(dateKey)) isTogglingOff = true;
    if (planType === 'plan_c' && planC.has(dateKey)) isTogglingOff = true;

    if (!isTogglingOff) {
      if (planType === 'plan_a') { const a = new Set(planA); a.delete(dateKey); a.add(dateKey); setPlanA(a); }
      if (planType === 'plan_b') { const b = new Set(planB); b.delete(dateKey); b.add(dateKey); setPlanB(b); }
      if (planType === 'plan_c') { const c = new Set(planC); c.delete(dateKey); c.add(dateKey); setPlanC(c); }
    }
  };

  const handleDayClick = (monthId, day, isWeekend) => {
    const dateKey = `${monthId}-${day}`;
    
    if (clickMode === 'vacaciones') {
      if (baseOffDays.has(dateKey)) {
        showError('No puedes marcar vacaciones en un día de descanso por patrón (LIB).');
        return;
      }
      const n = new Set(customVacationDays);
      if (n.has(dateKey)) n.delete(dateKey); else n.add(dateKey);
      setCustomVacationDays(n);
      return;
    }

    if (monthId === 1) { showError('Enero está bloqueado para nuevas peticiones.'); return; }
    if (baseOffDays.has(dateKey)||vacationDays.has(dateKey)) return;

    if (clickMode === 'agotar') {
      toggleExhausted(dateKey);
      return;
    }

    if (exhaustedDays.has(dateKey)) {
      showError('Día agotado. (Usa el modo "❌ Agotar" o Click Derecho para desmarcarlo)');
      return;
    }

    if (clickMode.startsWith('plan_')) {
      setPlanDay(dateKey, clickMode);
      return;
    }

    // clickMode === 'pedir'
    if (requestedDays.has(dateKey)) {
      const n = new Set(requestedDays); n.delete(dateKey);
      setRequestedDays(n); setErrorMsg(''); return;
    }

    const quota = getRemainingQuota(monthId, day, isWeekend);
    if (quota <= 0) { showError(`Cupo agotado en el turno ${currentTurn}.`); return; }
    if (isWeekend && reqStats.usedLV < Math.floor(stats.obligatoryLV))
      { showError(`Primero debes pedir ${Math.floor(stats.obligatoryLV)} días L-V.`); return; }
    if (reqStats.total >= Math.floor(stats.credit)) 
      { showError(`Crédito completo (${Math.floor(stats.credit)} días) ya usado.`); return; }

    const n = new Set(requestedDays); n.add(dateKey);
    setRequestedDays(n); 
    
    if (planA.has(dateKey)) { const a = new Set(planA); a.delete(dateKey); setPlanA(a); }
    if (planB.has(dateKey)) { const b = new Set(planB); b.delete(dateKey); setPlanB(b); }
    if (planC.has(dateKey)) { const c = new Set(planC); c.delete(dateKey); setPlanC(c); }
    
    setErrorMsg('');
  };

  const handleRightClick = (e, monthId, day) => {
    e.preventDefault();
    const dateKey = `${monthId}-${day}`;
    if (monthId === 1) return;
    if (baseOffDays.has(dateKey)||vacationDays.has(dateKey)) return;
    toggleExhausted(dateKey);
  };

  const showError = msg => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 5000); };

  const renderMonthCalendar = monthData => {
    const cells = [];
    for (let i = 0; i < monthData.startDay; i++)
      cells.push(<div key={`e-${i}`} className="bg-slate-50 opacity-40 border-r border-b" />);

    for (let day = 1; day <= monthData.days; day++) {
      const dow       = (monthData.startDay + day - 1) % 7;
      const isWeekend = dow >= 5;
      const dateKey   = `${monthData.id}-${day}`;
      const quota     = getRemainingQuota(monthData.id, day, isWeekend);
      const isOff     = baseOffDays.has(dateKey);
      const isVac     = vacationDays.has(dateKey);
      const isReq     = requestedDays.has(dateKey);
      const isExhausted = exhaustedDays.has(dateKey);
      
      const isPA = planA.has(dateKey);
      const isPB = planB.has(dateKey);
      const isPC = planC.has(dateKey);
      const isPlan = isPA || isPB || isPC;
      const isPuente  = highDemandDays.has(dateKey) && !isWeekend;

      let cls = 'relative border-r border-b flex flex-col h-14 md:h-16 p-0.5 md:p-1 transition-all duration-150 ';
      if      (isVac)  cls += 'bg-yellow-300 text-yellow-800 shadow-inner opacity-60';
      else if (isOff)  cls += 'bg-slate-800 text-white shadow-inner opacity-60';
      else if (isExhausted) cls += 'bg-red-200 text-red-900 border-red-400 opacity-60 cursor-not-allowed';
      else if (isReq)  cls += 'bg-green-500 text-white ring-2 ring-green-600 shadow-md cursor-pointer scale-100 z-10';
      else if (isPA)   cls += 'bg-yellow-50 text-yellow-900 border-2 border-dashed border-yellow-500 shadow-sm cursor-pointer hover:bg-yellow-100';
      else if (isPB)   cls += 'bg-orange-50 text-orange-900 border-2 border-dashed border-orange-500 shadow-sm cursor-pointer hover:bg-orange-100';
      else if (isPC)   cls += 'bg-slate-50 text-slate-700 border-2 border-dashed border-slate-500 shadow-sm cursor-pointer hover:bg-slate-100';
      else if (quota===0 && monthData.id!==1) cls += 'bg-red-50 text-red-400 cursor-not-allowed opacity-70';
      else if (isPuente) cls += 'bg-orange-50 hover:bg-orange-100 cursor-pointer border-orange-200';
      else               cls += 'bg-white hover:bg-blue-50 cursor-pointer';

      cells.push(
        <div key={day} 
             onClick={() => handleDayClick(monthData.id, day, isWeekend)} 
             onContextMenu={(e) => handleRightClick(e, monthData.id, day)}
             className={cls}>
          {isExhausted && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <XCircle size={28} strokeWidth={1.5} className="text-red-600 opacity-30 md:opacity-40" />
             </div>
          )}
          {isPuente && !isVac && !isOff && !isExhausted && (
            <div className="absolute top-0 right-0 p-0.5">
              <Flame size={10} className="text-orange-500 opacity-60 md:opacity-80" />
            </div>
          )}
          <div className="flex justify-between items-start leading-none relative z-10">
            <span className={`font-black text-xs md:text-sm ${
              !isOff&&!isVac&&!isReq&&!isExhausted&&!isPlan
                ? isWeekend?'text-red-500':isPuente?'text-orange-700':'text-slate-700'
                : ''}`}>
              {day}
            </span>
            {isVac  && <span className="text-[7px] md:text-[8px] font-black text-yellow-800 hidden sm:inline">VAC</span>}
            {isOff  && !isVac && <span className="text-[7px] md:text-[8px] text-slate-400 hidden sm:inline">LIB</span>}
            {isReq  && <span className="text-[7px] md:text-[8px] bg-white text-green-700 font-black px-0.5 rounded hidden sm:inline">PED</span>}
            {isPA && <span className="text-[7px] md:text-[8px] bg-yellow-400 text-yellow-900 font-black px-0.5 rounded hidden sm:inline">PLA</span>}
            {isPB && <span className="text-[7px] md:text-[8px] bg-orange-400 text-orange-900 font-black px-0.5 rounded hidden sm:inline">PLB</span>}
            {isPC && <span className="text-[7px] md:text-[8px] bg-slate-400 text-white font-black px-0.5 rounded hidden sm:inline">PLC</span>}
          </div>
          {!isOff&&!isVac&&!isReq&&!isExhausted&&monthData.id!==1 && (
            <div className={`mt-auto text-center font-bold rounded-sm text-[8px] md:text-[9px] p-0.5 relative z-10 truncate ${
              quota===0
                ?'bg-red-100 text-red-700 border border-red-200'
                :isPlan 
                  ?(isPA?'bg-yellow-200 text-yellow-800 border-yellow-300':(isPB?'bg-orange-200 text-orange-900 border-orange-300':'bg-slate-200 text-slate-800 border-slate-300'))
                  :isPuente
                    ?'bg-orange-100 text-orange-800 border border-orange-200'
                    :'bg-slate-100 text-slate-600 border border-slate-200'}`}>
              {quota}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={monthData.id}
           className={`bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm flex flex-col ${monthData.id===1?'opacity-70 grayscale-[0.3]':''}`}>
        <div className={`text-white font-black text-center uppercase tracking-widest py-1 text-[10px] md:text-xs flex items-center justify-center gap-1 ${monthData.id===1?'bg-slate-500':'bg-slate-800'}`}>
          {monthData.name} <span className="opacity-70 font-medium ml-1">{selectedYear}</span>
        </div>
        <div className="grid grid-cols-7 bg-slate-100 text-slate-500 border-b border-slate-300">
          {WEEK_DAYS.map((d,i) => (
            <div key={d} className={`text-center font-bold uppercase border-r border-slate-200 py-1 text-[9px] md:text-[10px] ${i>=5?'text-red-400':''}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1 bg-slate-200 gap-px">{cells}</div>
      </div>
    );
  };

  const handleClearAll = () => {
    setRequestedDays(new Set());
    setPlanA(new Set());
    setPlanB(new Set());
    setPlanC(new Set());
    setExhaustedDays(new Set());
  };

  const renderWishlist = (title, arr, isPA=false, isPB=false, isPC=false) => {
    if (arr.length === 0) return null;
    return (
      <div className="mb-3">
        <h4 className={`font-bold text-[9px] md:text-[10px] uppercase mb-1.5 flex items-center gap-1 ${isPA?'text-yellow-700':isPB?'text-orange-700':'text-slate-600'}`}>
           <Star size={10} /> {title}
        </h4>
        <ul className={`text-[10px] md:text-xs font-black flex flex-col gap-1 ${isPA?'text-yellow-900':isPB?'text-orange-900':'text-slate-700'}`}>
          {arr.map(({m, d, key}, idx) => {
            const monthObj = dynamicMonths.find(x => x.id === m);
            const dow = (monthObj.startDay + d - 1) % 7;
            const isLV = dow < 5;
            return (
              <li key={key} className={`flex justify-between items-center bg-white px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg border shadow-sm ${isPA?'border-yellow-300':isPB?'border-orange-300':'border-slate-300'}`}>
                <span className="tracking-wide opacity-90">{idx+1}. {String(d).padStart(2,'0')} {monthObj.name.substring(0,3).toUpperCase()}</span>
                <div className="flex gap-2 items-center">
                  <span className={`text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded uppercase ${isLV ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>{isLV ? 'L-V' : 'S-D'}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-1 sm:p-2 md:p-4 font-sans text-slate-800 pb-24 md:pb-6">
      <div className="max-w-[1500px] mx-auto bg-white rounded-xl md:rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col relative">

        {isPreAccess && (
          <div className="bg-yellow-500 text-yellow-900 font-black p-3 md:p-4 text-center z-50 animate-pulse shadow-md text-xs md:text-sm border-b-4 border-yellow-700 flex justify-center items-center gap-2">
             <Bell className="animate-bounce w-4 h-4 md:w-5 md:h-5" /> ALERTA: ACCESO PREVIO EN {formatMs(msToCita)}. PREPÁRATE PARA ENTRAR AL SISTEMA.
          </div>
        )}
        {isActiveTurn && (
          <div className="bg-red-600 text-white font-black p-3 md:p-4 text-center z-50 shadow-md text-sm md:text-lg border-b-4 border-red-800 flex justify-center items-center gap-2 md:gap-3">
             <Clock size={24} className="animate-pulse flex-shrink-0" /> <span className="animate-pulse">¡TURNO ACTIVO PIDE AHORA!</span> <span>CIERRE EN {formatMs(msToCita + 600000)}</span>
          </div>
        )}

        <div className="bg-slate-900 p-3 md:p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-4 border-blue-500">
          <div className="flex gap-4 items-center w-full sm:w-auto">
            <h1 className="text-xl md:text-2xl font-black flex items-center gap-2 flex-grow">
              <Calculator className="text-blue-400 w-5 h-5 md:w-6 md:h-6" /> Planificador
            </h1>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
              <CalendarDays size={18} className="text-slate-400"/>
              <select value={selectedYear} onChange={e=>handleYearChange(parseInt(e.target.value))} className="bg-transparent font-black text-blue-400 outline-none cursor-pointer">
                {[2026,2027,2028,2029,2030,2031].map(y => <option key={y} value={y} className="text-black">{y}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleClearAll}
                  className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold flex items-center gap-2 transition-colors border border-slate-600 text-xs md:text-sm">
            <RefreshCw size={14} className="md:w-[18px] md:h-[18px]" /> Reset
          </button>
        </div>

        <div className="flex flex-col xl:flex-row flex-1">

          <div className="xl:w-96 bg-slate-50 border-r border-slate-200 p-2 md:p-6 flex flex-col gap-3 md:gap-5 overflow-y-auto xl:max-h-[calc(100vh-100px)]">

            <button onClick={() => setShowConfig(!showConfig)} 
                    className="xl:hidden bg-slate-800 text-white p-3 rounded-xl font-bold flex justify-between items-center shadow-md active:scale-[0.98] transition-all">
              <span className="flex items-center gap-2"><Settings size={16}/> Variables {selectedYear}</span>
              {showConfig ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
            </button>

            <div className={`${showConfig ? 'flex' : 'hidden'} xl:flex flex-col gap-3 md:gap-5`}>
              <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-slate-800 uppercase text-xs flex items-center gap-2">
                    <Settings size={14}/> 1. Turno de Petición
                  </h3>
                  <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200 shadow-inner">
                    <button onClick={() => setShiftPhase('manana')} className={`px-2 py-0.5 rounded text-[10px] md:text-xs font-bold transition-all ${shiftPhase === 'manana' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}>Mañana</button>
                    <button onClick={() => setShiftPhase('tarde')} className={`px-2 py-0.5 rounded text-[10px] md:text-xs font-bold transition-all ${shiftPhase === 'tarde' ? 'bg-slate-700 shadow text-white' : 'text-slate-500 hover:text-slate-700'}`}>Tarde</button>
                  </div>
                </div>
                
                <input type="range" min="1" max={optPositions} value={currentTurn}
                       onChange={e=>setTurn(parseInt(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                <p className="text-center font-bold text-sm mt-2 text-blue-700">
                  {shiftPhase === 'manana' ? '🌅' : '🌇'} Turno {currentTurn} de {optPositions}
                </p>
              </div>

              <div className="bg-red-50 p-3 md:p-4 rounded-xl border-2 border-red-200 shadow-sm">
                <h4 className="text-[10px] md:text-xs font-black text-red-800 uppercase flex items-center gap-1 mb-2">
                  <Users size={14}/> Efecto Tsunami ({MAQUINISTAS_PER_TURN} maq/turno)
                </h4>
                <div className="flex justify-between text-xs md:text-sm border-b border-red-100 pb-1 mb-1">
                  <span className="font-bold text-red-700">Compañeros delante:</span>
                  <span className="font-black text-red-900">{maquinistasAhead}</span>
                </div>
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="font-bold text-red-700">Días arrasados:</span>
                  <span className="font-black text-red-900">{diasArrasados}</span>
                </div>
              </div>

              <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-black mb-3 text-slate-800 uppercase text-xs flex items-center gap-2">
                  <PlaneTakeoff size={14}/> 2. Personales
                </h3>

                <label className="block text-[10px] md:text-[11px] font-bold text-slate-500 mb-1">Grupo de Descanso:</label>
                <select value={restGroup} onChange={e=>setRestGroup(parseInt(e.target.value))}
                        className="w-full mb-2 p-1.5 md:p-2 text-xs border rounded-lg bg-slate-50 font-bold text-slate-700 border-slate-200">
                  {[1,2,3,4].map(g=><option key={g} value={g}>Grupo {g} (Patrón 28 días)</option>)}
                </select>

                <label className="block text-[10px] md:text-[11px] font-bold text-slate-500 mb-1">Grupo Verano año anterior:</label>
                <select value={groupLastYear} onChange={e=>setGroupLastYear(parseInt(e.target.value))}
                        className="w-full mb-2 p-1.5 md:p-2 text-xs border rounded-lg bg-slate-50 font-bold text-slate-700 border-slate-200">
                  <option value={1}>Grupo 1 (Jun/Jul)</option>
                  <option value={2}>Grupo 2 (Agosto)</option>
                  <option value={3}>Grupo 3 (Septiembre)</option>
                  <option value={4}>Grupo 4 (Jul/Ago)</option>
                  <option value={5}>Grupo 5 (A elegir)</option>
                </select>

                <div className="bg-yellow-50 p-2 md:p-3 rounded-lg border border-yellow-200 mb-2">
                  <span className="text-[9px] md:text-[10px] font-bold text-yellow-800 uppercase block mb-0.5">Te toca en {selectedYear}:</span>
                  <div className="font-black text-yellow-900 text-xs md:text-sm leading-tight">{sumVacName}</div>
                  {groupCurrentYear===5 && (
                    <select value={subGroup5} onChange={e=>setSubGroup5(e.target.value)}
                            className="w-full mt-2 p-1 text-[10px] md:text-xs border rounded bg-white font-bold text-yellow-900 border-yellow-300">
                      <option value="S51">S5.1: 1/Ago - 30/Ago</option>
                      <option value="S52">S5.2: 1/Jul - 30/Jul</option>
                      <option value="S53">S5.3: 1/Sep - 30/Sep</option>
                    </select>
                  )}
                </div>

                <label className="block text-[10px] md:text-[11px] font-bold text-slate-500 mb-1">Inviernos:</label>
                <select value={winVac} onChange={e=>setWinVac(e.target.value)}
                        className="w-full p-1.5 md:p-2 text-xs border rounded-lg bg-yellow-50 font-bold text-yellow-900 border-yellow-200">
                  {VACATIONS.winter.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
                </select>

                <div className="mt-3 bg-slate-50 p-2 md:p-3 rounded-lg border border-slate-200 shadow-inner">
                  <p className="text-[10px] text-slate-500 mb-2 font-bold text-center">¿Fraccionas vacaciones (quincenas / días sueltos)?</p>
                  <button onClick={() => setClickMode(clickMode === 'vacaciones' ? 'pedir' : 'vacaciones')} 
                          className={`w-full py-1.5 flex items-center justify-center gap-2 rounded-lg font-black text-xs transition-all shadow-sm ${clickMode === 'vacaciones' ? 'bg-yellow-400 text-yellow-900 border-2 border-yellow-500 scale-105' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'}`}>
                    <Edit3 size={14}/> {clickMode==='vacaciones'?'Terminar Edición (Guardar)':'Editar Días en el Calendario'}
                  </button>
                  {clickMode==='vacaciones' && <p className="text-[9px] md:text-[10px] text-yellow-700 font-bold mt-2 text-center animate-pulse">Haz clic en los días del calendario para sumar o restar VAC.</p>}
                </div>
              </div>

              <div className="bg-blue-50 p-3 md:p-5 rounded-xl border border-blue-200 shadow-sm">
                <h3 className="font-black text-blue-900 uppercase tracking-wide text-xs mb-2 md:mb-3">3. Cómputo Anual</h3>
                <div className="flex justify-between items-end mb-3 md:mb-4">
                  <div>
                    <span className="font-bold text-blue-900 text-sm md:text-base">Crédito Libre:</span>
                    <span className="text-[10px] md:text-xs text-blue-600 block">Pide donde quieras</span>
                  </div>
                  <span className="text-2xl md:text-3xl font-black text-blue-700">{Math.floor(stats.credit)} <span className="text-[10px] md:text-sm">días</span></span>
                </div>
                <div className="bg-white p-2 md:p-3 rounded-lg border border-orange-200">
                  <h4 className="text-[10px] md:text-xs font-black text-orange-800 uppercase mb-1 md:mb-2">Regla 7 L-V</h4>
                  <div className="flex justify-between text-xs md:text-sm mb-1">
                    <span className="font-bold text-slate-600">Obligatorios L-V:</span>
                    <span className="font-black text-red-600">{Math.floor(stats.obligatoryLV)}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="font-bold text-slate-600">Libres (S-D/L-V):</span>
                    <span className="font-black text-green-600">{Math.floor(stats.freeSD)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-black mb-2 md:mb-3 text-slate-800 uppercase text-[10px] md:text-xs flex items-center gap-2">
                <LayoutGrid size={14}/> 4. Estado Petición
              </h3>
              <div className="flex justify-between font-bold text-xs md:text-sm mb-1.5 md:mb-2">
                <span className="text-slate-500">L-V: <span className="text-blue-600">{reqStats.usedLV}</span>/{Math.floor(stats.obligatoryLV)}</span>
                <span className="text-slate-500">S-D: <span className="text-green-600">{reqStats.usedSD}</span>/{Math.floor(stats.freeSD)}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 md:h-3 border border-slate-200 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-300"
                     style={{width:`${stats.grossCredit>0?(reqStats.total/Math.floor(stats.grossCredit))*100:0}%`}} />
              </div>
            </div>

            <div className="bg-amber-50 p-3 md:p-4 rounded-xl border border-amber-200 shadow-sm relative overflow-hidden">
               <h3 className="font-black mb-2 md:mb-3 text-amber-900 uppercase text-[10px] md:text-xs flex items-center gap-2">
                 <CalendarCheck size={14}/> 5. Asistente Cronológico ({selectedYear})
               </h3>
               
               <div className="flex gap-2 mb-3">
                 <div className="flex-1">
                   <label className="block text-[9px] md:text-[10px] uppercase font-bold text-amber-700 mb-1">Día (Ene)</label>
                   <select value={appDay} onChange={e=>setAppDay(parseInt(e.target.value))} className="w-full border rounded p-1 text-xs font-bold bg-white text-amber-900 border-amber-300">
                     {[22,23,24,25,26,27].map(d=><option key={d} value={d}>{d}</option>)}
                   </select>
                 </div>
                 <div className="flex-1">
                   <label className="block text-[9px] md:text-[10px] uppercase font-bold text-amber-700 mb-1">Hora</label>
                   <input type="time" value={appTime} onChange={e=>setAppTime(e.target.value)} className="w-full border rounded p-1 px-2 text-xs font-bold bg-white text-amber-900 border-amber-300" />
                 </div>
               </div>

               <div className="text-[10px] font-bold text-slate-500 border-l-2 border-amber-200 ml-2 pl-3 py-1 flex flex-col gap-1.5 relative mb-2">
                  <div className={`relative ${effectiveNow >= new Date(selectedYear,0,15) && effectiveNow < new Date(selectedYear,0,20) ? 'text-amber-700 font-black text-[11px]' : ''}`}>
                    <div className={`absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full ${effectiveNow >= new Date(selectedYear,0,15) && effectiveNow < new Date(selectedYear,0,20)?'bg-amber-500 ring-2 ring-amber-200':'bg-amber-200'}`} />
                    15 Ene: Listados + Reclamaciones
                  </div>
                  <div className={`relative ${(msToCita <= 300000 && msToCita > -600000) ? 'text-red-600 font-black text-xs' : ''}`}>
                    <div className={`absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full ${(msToCita <= 300000 && msToCita > -600000)?'bg-red-500 animate-ping':'bg-amber-200'}`} />
                    <div className={`absolute -left-[17px] top-1.5 w-2.5 h-2.5 rounded-full ${(msToCita <= 300000 && msToCita > -600000)?'bg-red-500':'bg-transparent'}`} />
                    {appDay} Ene {appTime}: Tu Cita (10 min)
                  </div>
                  <div className={`relative ${effectiveNow >= new Date(selectedYear,0,29) && effectiveNow < new Date(selectedYear,1,6) ? 'text-amber-700 font-black text-[11px]' : ''}`}>
                    <div className={`absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full ${(effectiveNow >= new Date(selectedYear,0,29) && effectiveNow < new Date(selectedYear,1,6))?'bg-amber-500':'bg-amber-200'}`} />
                    29 Ene - 5 Feb: Repesca Libre
                  </div>
                  <div className={`relative ${effectiveNow >= new Date(selectedYear,1,6) ? 'text-slate-800 font-black text-[11px]' : ''}`}>
                    <div className={`absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full ${effectiveNow >= new Date(selectedYear,1,6)?'bg-slate-800':'bg-amber-200'}`} />
                    {">"} 5 Feb: Cierre Oficial
                  </div>
               </div>

               <div className="flex gap-1 overflow-x-auto pb-1 mt-1">
                  <button onClick={()=>simulateTo('real')} className={`shrink-0 px-2 py-1 rounded text-[9px] font-black uppercase ${simMode==='real'?'bg-amber-600 text-white':'bg-white text-amber-700 border border-amber-300'}`}>Real</button>
                  <button onClick={()=>simulateTo('jan15')} className={`shrink-0 px-2 py-1 rounded text-[9px] font-black uppercase ${simMode==='jan15'?'bg-amber-600 text-white':'bg-white text-amber-700 border border-amber-300'}`}>15 ENE</button>
                  <button onClick={()=>simulateTo('jan22_pre')} className={`shrink-0 px-2 py-1 rounded text-[9px] font-black uppercase flex items-center gap-1 ${simMode==='jan22_pre'?'bg-yellow-500 text-yellow-900 truncate':'bg-white text-yellow-700 border border-yellow-400'}`}>-5 MIN</button>
                  <button onClick={()=>simulateTo('jan22_in')} className={`shrink-0 px-2 py-1 rounded text-[9px] font-black uppercase flex items-center gap-1 ${simMode==='jan22_in'?'bg-red-600 text-white truncate':'bg-white text-red-600 border border-red-300'}`}>CITA</button>
                  <button onClick={()=>simulateTo('jan29')} className={`shrink-0 px-2 py-1 rounded text-[9px] font-black uppercase ${simMode==='jan29'?'bg-amber-600 text-white':'bg-white text-amber-700 border border-amber-300'}`}>REPESC</button>
               </div>
            </div>

            <div className="bg-emerald-50 p-3 md:p-4 rounded-xl border-2 border-emerald-300 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-emerald-200 rounded-bl-full -z-10 opacity-50"></div>
              <h3 className="font-black mb-2 md:mb-3 text-emerald-900 uppercase text-[10px] md:text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600"/> 6. Resumen de Días
              </h3>
              
              <h4 className="font-bold text-[9px] md:text-[10px] text-green-700 uppercase mb-2">Pedidos Realizados</h4>
              {sortedRequestedDays.length === 0 ? (
                <p className="text-[10px] md:text-xs text-emerald-700 italic font-medium mb-3">No has pedido días todavía.</p>
              ) : (
                <ul className="text-xs md:text-sm font-black text-emerald-900 flex flex-col gap-1 md:gap-1.5 mb-3 md:mb-4">
                  {sortedRequestedDays.map(({m, d, key}, idx) => {
                    const monthObj = dynamicMonths.find(x => x.id === m);
                    const dow = (monthObj.startDay + d - 1) % 7;
                    const isLV = dow < 5;
                    return (
                      <li key={key} className="flex justify-between items-center bg-white px-2 md:px-2.5 py-1 md:py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                        <span className="tracking-wide">{idx+1}. {String(d).padStart(2,'0')} {monthObj.name.substring(0,3).toUpperCase()}</span>
                        <div className="flex gap-2 items-center">
                          <span className={`text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded uppercase ${isLV ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{isLV ? 'L-V' : 'S-D'}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {sortedPlanA.length === 0 && sortedPlanB.length === 0 && sortedPlanC.length === 0 && (
                 <p className="text-[10px] md:text-xs text-slate-500 italic font-medium mt-4">Tus planes A, B y C aparecerán aquí.</p>
              )}

              <div className="mt-4">
                {renderWishlist('Plan A (Foco Principal)', sortedPlanA, true, false, false)}
                {renderWishlist('Plan B (Alternativas)', sortedPlanB, false, true, false)}
                {renderWishlist('Plan C (Salvavidas)', sortedPlanC, false, false, true)}
              </div>
            </div>

          </div>

          <div className="flex-1 p-2 md:p-6 bg-slate-200/50 overflow-y-auto relative w-full">

            <div className={`fixed top-4 md:top-20 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-10 w-[90%] md:w-auto z-50 p-3 md:p-4 bg-red-600 text-white rounded-xl font-bold shadow-2xl flex items-center gap-3 transition-all duration-300 transform ${errorMsg?'translate-y-0 opacity-100':'-translate-y-20 opacity-0 pointer-events-none'}`}>
              <AlertTriangle size={20} className="flex-shrink-0" />
              <span className="text-xs md:text-sm">{errorMsg}</span>
            </div>

            <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4 bg-white p-2 md:p-3 rounded-xl shadow-sm border border-slate-200">
               <button onClick={()=>setClickMode('pedir')} className={`flex-1 px-2 py-2 rounded-xl font-black text-[11px] xl:text-xs flex flex-col justify-center items-center gap-1 transition-all ${clickMode==='pedir' ? 'bg-green-500 text-white shadow-md ring-4 ring-green-200 scale-105' : 'bg-slate-100 text-slate-500 hover:bg-green-50'}`}>
                  <CheckCircle2 size={16} /> Pedir
               </button>
               <button onClick={()=>setClickMode('plan_a')} className={`flex-1 px-2 py-2 rounded-xl font-black text-[11px] xl:text-xs flex flex-col justify-center items-center gap-1 transition-all ${clickMode==='plan_a' ? 'bg-yellow-400 text-yellow-900 shadow-md ring-4 ring-yellow-200 scale-105' : 'bg-slate-100 text-slate-500 hover:bg-yellow-50'}`}>
                  <Star size={16} /> Plan A
               </button>
               <button onClick={()=>setClickMode('plan_b')} className={`flex-1 px-2 py-2 rounded-xl font-black text-[11px] xl:text-xs flex flex-col justify-center items-center gap-1 transition-all ${clickMode==='plan_b' ? 'bg-orange-400 text-orange-900 shadow-md ring-4 ring-orange-200 scale-105' : 'bg-slate-100 text-slate-500 hover:bg-orange-50'}`}>
                  <Star size={16} /> Plan B
               </button>
               <button onClick={()=>setClickMode('plan_c')} className={`flex-1 px-2 py-2 rounded-xl font-black text-[11px] xl:text-xs flex flex-col justify-center items-center gap-1 transition-all ${clickMode==='plan_c' ? 'bg-slate-400 text-slate-900 shadow-md ring-4 ring-slate-200 scale-105' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  <Star size={16} /> Plan C
               </button>
               <button onClick={()=>setClickMode('agotar')} className={`flex-1 px-2 py-2 rounded-xl font-black text-[11px] xl:text-xs flex flex-col justify-center items-center gap-1 transition-all ${clickMode==='agotar' ? 'bg-red-500 text-white shadow-md ring-4 ring-red-200 scale-105' : 'bg-slate-100 text-slate-500 hover:bg-red-50'}`}>
                  <XCircle size={16} /> Agotar
               </button>
            </div>

            <div className="w-full bg-slate-50 p-2 md:p-3 mb-3 md:mb-4 flex flex-wrap gap-x-2 gap-y-1 md:gap-4 rounded-lg text-[9px] md:text-[11px] font-bold text-slate-600 border border-slate-200 justify-center">
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-yellow-100 border-2 border-dashed border-yellow-500" />Pl. A</div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-orange-100 border-2 border-dashed border-orange-500" />Pl. B</div>
              <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-slate-100 border-2 border-dashed border-slate-500" />Pl. C</div>
              <div className="flex items-center gap-1 ml-auto border-l pl-2 text-red-600"><span className="text-xs">❌</span>Agotado</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 w-full">
              {dynamicMonths.map(m => renderMonthCalendar(m))}
            </div>

            {/* Mobile Bottom Action Bar (5 elements) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-1 pb-safe flex justify-around shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-40">
               <button onClick={()=>setClickMode('pedir')} className={`flex-1 flex flex-col items-center p-1 rounded-xl transition-all ${clickMode==='pedir'?'bg-green-100 text-green-800 font-black scale-105':'text-slate-500 font-bold'}`}>
                  <CheckCircle2 size={18}/> <span className="text-[9px] mt-0.5">PEDIR</span>
               </button>
               <button onClick={()=>setClickMode('plan_a')} className={`flex-1 flex flex-col items-center p-1 rounded-xl transition-all ${clickMode==='plan_a'?'bg-yellow-100 text-yellow-800 font-black scale-105':'text-slate-500 font-bold'}`}>
                  <Star size={18}/> <span className="text-[9px] mt-0.5">PLA A</span>
               </button>
               <button onClick={()=>setClickMode('plan_b')} className={`flex-1 flex flex-col items-center p-1 rounded-xl transition-all ${clickMode==='plan_b'?'bg-orange-100 text-orange-800 font-black scale-105':'text-slate-500 font-bold'}`}>
                  <Star size={18}/> <span className="text-[9px] mt-0.5">PLA B</span>
               </button>
               <button onClick={()=>setClickMode('plan_c')} className={`flex-1 flex flex-col items-center p-1 rounded-xl transition-all ${clickMode==='plan_c'?'bg-slate-200 text-slate-800 font-black scale-105':'text-slate-500 font-bold'}`}>
                  <Star size={18}/> <span className="text-[9px] mt-0.5">PLA C</span>
               </button>
               <button onClick={()=>setClickMode('agotar')} className={`flex-1 flex flex-col items-center p-1 rounded-xl transition-all ${clickMode==='agotar'?'bg-red-100 text-red-800 font-black scale-105':'text-slate-500 font-bold'}`}>
                  <XCircle size={18}/> <span className="text-[9px] mt-0.5">AGOTAR</span>
               </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
