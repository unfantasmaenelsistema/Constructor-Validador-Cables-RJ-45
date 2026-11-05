import React, { useEffect, useMemo, useState } from 'react';
import {
  analyzeCableConfiguration,
  CHALLENGES,
  ChallengeItem,
  STANDARD_GIGABIT_CROSS_B,
  STANDARD_T568A,
  STANDARD_T568B,
  WireFault,
  WireId,
} from './data/cableStandards';
import { RJ45ConnectorCard } from './components/RJ45ConnectorCard';
import { CableRoutingVisualizer } from './components/CableRoutingVisualizer';
import { CableTesterLED } from './components/CableTesterLED';
import { StandardsReferenceSection } from './components/StandardsReferenceSection';
import { soundFX } from './utils/soundEffects';
import {
  CheckCircle2,
  ExternalLink,
  Moon,
  RotateCcw,
  Sun,
  Wrench,
} from 'lucide-react';

const INITIAL_FAULTS: Record<WireId, WireFault> = {
  WO: 'ok',
  O: 'ok',
  WG: 'ok',
  B: 'ok',
  WB: 'ok',
  G: 'ok',
  WBr: 'ok',
  Br: 'ok',
};

export default function App() {
  // Theme state (Light bench by default, toggleable to Dark lab)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('rj45_theme') === 'dark';
    } catch {
      return false;
    }
  });

  // Connector A & B slots
  const [slotsA, setSlotsA] = useState<(WireId | null)[]>([...STANDARD_T568B]);
  const [slotsB, setSlotsB] = useState<(WireId | null)[]>([
    'WO',
    'O',
    'WG',
    'B',
    'WB',
    'G',
    null,
    null,
  ]);
  const [isCrimpedA, setIsCrimpedA] = useState<boolean>(true);
  const [isCrimpedB, setIsCrimpedB] = useState<boolean>(false);
  const [wireFaults, setWireFaults] = useState<Record<WireId, WireFault>>({
    ...INITIAL_FAULTS,
  });

  // Adjacent short circuits on Connector A (1..7 where k shorts pin k and pin k+1)
  const [adjacentShorts, setAdjacentShorts] = useState<number[]>([]);

  // Active pulse step on the LED Tester (1..8 pins, 9 = Ground G, null = idle)
  const [activeTesterStep, setActiveTesterStep] = useState<number | null>(null);

  // Active Multimeter probe pins ([redPin, blackPin] or null)
  const [activeMultimeterPins, setActiveMultimeterPins] = useState<[number, number] | null>(
    null
  );

  // Challenges state
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('rj45_completed') || '[]');
      return Array.isArray(saved) ? saved.filter((id) => CHALLENGES.some((c) => c.id === id)) : [];
    } catch {
      return [];
    }
  });
  const inChallenge = activeChallengeId !== null;

  useEffect(() => {
    try {
      localStorage.setItem('rj45_completed', JSON.stringify(completedChallenges));
    } catch {
      /* sin almacenamiento: el progreso dura la visita */
    }
  }, [completedChallenges]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('rj45_theme', darkMode ? 'dark' : 'light');
    } catch {
      /* sin almacenamiento */
    }
  }, [darkMode]);

  const analysis = useMemo(
    () =>
      analyzeCableConfiguration(
        slotsA,
        slotsB,
        isCrimpedA,
        isCrimpedB,
        wireFaults,
        adjacentShorts
      ),
    [slotsA, slotsB, isCrimpedA, isCrimpedB, wireFaults, adjacentShorts]
  );

  // Automatically check if active challenge is completed
  useEffect(() => {
    if (!activeChallengeId) return;
    const ch = CHALLENGES.find((c) => c.id === activeChallengeId);
    if (!ch) return;
    const res = ch.verify(analysis);
    if (res.passed && !completedChallenges.includes(ch.id)) {
      setCompletedChallenges((prev) => [...prev, ch.id]);
    }
  }, [analysis, activeChallengeId, completedChallenges]);

  const handleUpdateSlotsA = (next: (WireId | null)[]) => {
    setSlotsA(next);
    soundFX.playWireSnap();
  };

  const handleUpdateSlotsB = (next: (WireId | null)[]) => {
    setSlotsB(next);
    soundFX.playWireSnap();
  };

  const handleToggleCrimpA = () => {
    setIsCrimpedA((prev) => {
      const next = !prev;
      if (next) soundFX.playCrimpSound();
      return next;
    });
  };

  const handleToggleCrimpB = () => {
    setIsCrimpedB((prev) => {
      const next = !prev;
      if (next) soundFX.playCrimpSound();
      return next;
    });
  };

  const handleCrimpBoth = () => {
    const readyA = slotsA.every((s) => s !== null);
    const readyB = slotsB.every((s) => s !== null);
    if (readyA) setIsCrimpedA(true);
    if (readyB) setIsCrimpedB(true);
    if (readyA || readyB) soundFX.playCrimpSound();
  };

  const handleToggleWireFault = (wireId: WireId) => {
    setWireFaults((prev) => ({
      ...prev,
      [wireId]: prev[wireId] === 'cut' ? 'ok' : 'cut',
    }));
    soundFX.playWireSnap();
  };

  const handleToggleAdjacentShort = (pinLeft: number) => {
    setAdjacentShorts((prev) =>
      prev.includes(pinLeft) ? prev.filter((p) => p !== pinLeft) : [...prev, pinLeft].sort()
    );
    soundFX.playWireSnap();
  };

  const handleRepairAllWires = () => {
    if (activeChallengeId) return; // en un reto se repara avería a avería
    setWireFaults({ ...INITIAL_FAULTS });
    setAdjacentShorts([]);
    soundFX.playWireSnap();
  };

  const handleApplyPresetCable = (
    type:
      | 'DIRECT_568B'
      | 'DIRECT_568A'
      | 'CROSSOVER_FAST'
      | 'CROSSOVER_GIGABIT'
      | 'SPLIT_PAIR_DEMO'
  ) => {
    if (activeChallengeId) return; // las plantillas resolverían el reto sin cablear
    setWireFaults({ ...INITIAL_FAULTS });
    setAdjacentShorts([]);
    if (type === 'DIRECT_568B') {
      setSlotsA([...STANDARD_T568B]);
      setSlotsB([...STANDARD_T568B]);
      setIsCrimpedA(true);
      setIsCrimpedB(true);
    } else if (type === 'DIRECT_568A') {
      setSlotsA([...STANDARD_T568A]);
      setSlotsB([...STANDARD_T568A]);
      setIsCrimpedA(true);
      setIsCrimpedB(true);
    } else if (type === 'CROSSOVER_FAST') {
      setSlotsA([...STANDARD_T568A]);
      setSlotsB([...STANDARD_T568B]);
      setIsCrimpedA(true);
      setIsCrimpedB(true);
    } else if (type === 'CROSSOVER_GIGABIT') {
      setSlotsA([...STANDARD_T568B]);
      setSlotsB([...STANDARD_GIGABIT_CROSS_B]);
      setIsCrimpedA(true);
      setIsCrimpedB(true);
    } else if (type === 'SPLIT_PAIR_DEMO') {
      const splitOrder: WireId[] = ['WO', 'O', 'WG', 'G', 'WB', 'B', 'WBr', 'Br'];
      setSlotsA([...splitOrder]);
      setSlotsB([...splitOrder]);
      setIsCrimpedA(true);
      setIsCrimpedB(true);
    }
    soundFX.playCrimpSound();
  };

  const handleResetEmptyBench = () => {
    setActiveChallengeId(null);
    setWireFaults({ ...INITIAL_FAULTS });
    setAdjacentShorts([]);
    setSlotsA(Array(8).fill(null));
    setSlotsB(Array(8).fill(null));
    setIsCrimpedA(false);
    setIsCrimpedB(false);
    setActiveTesterStep(null);
    setActiveMultimeterPins(null);
  };

  const handleLoadChallenge = (challenge: ChallengeItem) => {
    setActiveChallengeId(challenge.id);
    if (challenge.setup) {
      setSlotsA([...challenge.setup.slotsA]);
      setSlotsB([...challenge.setup.slotsB]);
      setIsCrimpedA(challenge.setup.crimpedA);
      setIsCrimpedB(challenge.setup.crimpedB);
      setWireFaults({ ...challenge.setup.faults });
      setAdjacentShorts(challenge.setup.adjacentShorts ? [...challenge.setup.adjacentShorts] : []);
    } else {
      setWireFaults({ ...INITIAL_FAULTS });
      setAdjacentShorts([]);
      setSlotsA(Array(8).fill(null));
      setSlotsB(Array(8).fill(null));
      setIsCrimpedA(false);
      setIsCrimpedB(false);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeChallenge = CHALLENGES.find((c) => c.id === activeChallengeId) || null;
  const activeChallengeCheck = activeChallenge ? activeChallenge.verify(analysis) : null;

  // Determine which pin on Connector B is currently receiving pulse
  const activePulsePinA =
    activeTesterStep !== null && activeTesterStep <= 8 ? activeTesterStep : null;
  const activePulsePinB =
    activePulsePinA !== null
      ? analysis.pinResults[activePulsePinA - 1]?.remotePin ?? null
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 xl:gap-8 px-4 sm:px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
        {/* Zone 1: Brand lockup with user's custom logo on one line */}
        <a
          href="https://www.unfantasmaenelsistema.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
        >
          <img
            src="./assets/aistudio/icono_81a3db5b.png"
            alt="Logo Un Fantasma en el Sistema"
            className="w-8 h-8 object-contain shrink-0"
          />
          <span className="hidden sm:inline">Un Fantasma en el Sistema</span>
          <span className="sm:hidden">Cables RJ-45</span>
        </a>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a
            href="#mesa-trabajo"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Constructor RJ-45
          </a>
          <a
            href="#comprobador"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Comprobador y Multímetro
          </a>
          <a
            href="#retos"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Retos Prácticos
          </a>
          <a
            href="#normativa"
            className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Normativa 568A/B
          </a>
        </nav>

        {/* Zone 3: 1 primary external link action */}
        <div className="flex items-center shrink-0">
          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <span>Web Oficial</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Container (1440px desktop baseline) */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Compact Workspace Header & Quick Bench Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Laboratorio Didáctico de Redes Locales</span>
              <span aria-hidden="true">·</span>
              <span>Estándares ANSI/TIA/EIA-568A y 568B</span>
              <span aria-hidden="true">·</span>
              <span>Tester LED y Multímetro Óhmico</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1 text-balance">
              Constructor y Validador de Cables de Red RJ-45
            </h1>
          </div>

          {/* Bench Actions & Theme Switch */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleApplyPresetCable('DIRECT_568B')}
              disabled={inChallenge}
              title={inChallenge ? 'Desactivado durante un reto' : undefined}
              className="disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ejemplo Directo 568B
            </button>
            <button
              type="button"
              onClick={() => handleApplyPresetCable('CROSSOVER_FAST')}
              disabled={inChallenge}
              title={inChallenge ? 'Desactivado durante un reto' : undefined}
              className="disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Ejemplo Cruzado (A↔B)
            </button>
            <button
              type="button"
              onClick={handleCrimpBoth}
              disabled={
                (slotsA.some((s) => s === null) && slotsB.some((s) => s === null)) ||
                (isCrimpedA && isCrimpedB)
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Crimpar Ambos</span>
            </button>
            <button
              type="button"
              onClick={handleResetEmptyBench}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Vaciar ambos conectores para practicar desde cero"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Vaciar Mesa</span>
            </button>
            <button
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Active Challenge Banner */}
        {activeChallenge && activeChallengeCheck && (
          <div
            className={`mt-5 p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
              activeChallengeCheck.passed
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                : 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800'
            }`}
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                <span>RETO ACTIVO {activeChallenge.number}</span>
                <span aria-hidden="true">·</span>
                <span>{activeChallenge.title}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">
                <strong>Objetivo:</strong> {activeChallenge.objective}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                <strong>Pista:</strong> {activeChallenge.hint}
              </p>
              <p
                className={`text-xs font-semibold mt-1.5 flex items-center gap-1.5 ${
                  activeChallengeCheck.passed
                    ? 'text-emerald-800 dark:text-emerald-300'
                    : 'text-sky-900 dark:text-sky-200'
                }`}
              >
                {activeChallengeCheck.passed && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{activeChallengeCheck.feedback}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveChallengeId(null)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
            >
              Salir del Reto
            </button>
          </div>
        )}

        {/* Two-Zone Sandbox Layout (Left: Interactive Dual Connector Stage | Right: LED Tester, Multimeter & Diagnostics) */}
        <div
          id="mesa-trabajo"
          className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start scroll-mt-20"
        >
          {/* Left Zone (7 cols): Connector A + Internal UTP Routing + Connector B */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            <RJ45ConnectorCard
              side="A"
              title="Conector 1 (Unidad Local / Master)"
              subtitle="Se inserta en la boca MASTER del Tester / Sondas del Multímetro"
              slots={slotsA}
              standard={analysis.endAStandard}
              standardLabel={analysis.endALabel}
              isCrimped={isCrimpedA}
              activePulsePin={activePulsePinA}
              wireFaults={wireFaults}
              onUpdateSlots={handleUpdateSlotsA}
              templatesLocked={inChallenge}
              onToggleCrimp={handleToggleCrimpA}
            />

            <CableRoutingVisualizer
              slotsA={slotsA}
              slotsB={slotsB}
              wireFaults={wireFaults}
              adjacentShorts={adjacentShorts}
              activePulseMasterPin={activePulsePinA}
              activeMultimeterPins={activeMultimeterPins}
              onToggleWireFault={handleToggleWireFault}
              onToggleAdjacentShort={handleToggleAdjacentShort}
              onRepairAllWires={handleRepairAllWires}
              repairAllLocked={inChallenge}
            />

            <RJ45ConnectorCard
              side="B"
              title="Conector 2 (Unidad Remota / Remote)"
              subtitle="Se inserta en la boca REMOTE del Tester o Tapón de Bucle"
              slots={slotsB}
              standard={analysis.endBStandard}
              standardLabel={analysis.endBLabel}
              isCrimped={isCrimpedB}
              activePulsePin={activePulsePinB}
              wireFaults={wireFaults}
              onUpdateSlots={handleUpdateSlotsB}
              templatesLocked={inChallenge}
              onToggleCrimp={handleToggleCrimpB}
            />
          </div>

          {/* Right Zone (5 cols): Simulated LED Cable Tester + Digital Multimeter + Real-time EIA/TIA Diagnostics */}
          <div id="comprobador" className="lg:col-span-5 lg:sticky lg:top-20 scroll-mt-20">
            <CableTesterLED
              slotsA={slotsA}
              slotsB={slotsB}
              isCrimpedA={isCrimpedA}
              isCrimpedB={isCrimpedB}
              wireFaults={wireFaults}
              adjacentShorts={adjacentShorts}
              analysis={analysis}
              activeStep={activeTesterStep}
              onChangeActiveStep={setActiveTesterStep}
              onChangeProbePins={setActiveMultimeterPins}
              onToggleAdjacentShort={handleToggleAdjacentShort}
            />
          </div>
        </div>

        {/* Guided Challenges & EIA/TIA-568A/568B Reference Table */}
        <StandardsReferenceSection
          analysis={analysis}
          activeChallengeId={activeChallengeId}
          completedChallenges={completedChallenges}
          onLoadChallenge={handleLoadChallenge}
          onApplyPresetCable={handleApplyPresetCable}
        />
      </main>

      {/* Clean Footer with Author Logo & Website Link */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a
            href="https://www.unfantasmaenelsistema.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 group"
          >
            <img
              src="./assets/aistudio/icono_81a3db5b.png"
              alt="Logo Un Fantasma en el Sistema"
              className="w-10 h-10 object-contain transition-transform group-hover:scale-105"
            />
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                Un Fantasma en el Sistema
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                https://www.unfantasmaenelsistema.com/
              </div>
            </div>
          </a>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Simulador Didáctico EIA/TIA-568A & 568B</span>
            <span aria-hidden="true">·</span>
            <span>Preparado para GitHub Pages</span>
            <span aria-hidden="true">·</span>
            <a
              href="https://www.unfantasmaenelsistema.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Visitar Un Fantasma en el Sistema</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
