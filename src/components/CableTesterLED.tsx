import React, { useEffect, useState } from 'react';
import { CableAnalysis, WIRES, WireFault, WireId } from '../data/cableStandards';
import { MultimeterPanel } from './MultimeterPanel';
import { soundFX } from '../utils/soundEffects';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FastForward,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  StepForward,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';

interface CableTesterLEDProps {
  slotsA: (WireId | null)[];
  slotsB: (WireId | null)[];
  isCrimpedA: boolean;
  isCrimpedB: boolean;
  wireFaults: Record<WireId, WireFault>;
  adjacentShorts: number[];
  analysis: CableAnalysis;
  activeStep: number | null; // 1..9 (1..8 pins, 9 = G shield) or null when off
  onChangeActiveStep: (step: number | null) => void;
  onChangeProbePins: (pins: [number, number] | null) => void;
  onToggleAdjacentShort: (pinLeft: number) => void;
}

export const CableTesterLED: React.FC<CableTesterLEDProps> = ({
  slotsA,
  slotsB,
  isCrimpedA,
  isCrimpedB,
  wireFaults,
  adjacentShorts,
  analysis,
  activeStep,
  onChangeActiveStep,
  onChangeProbePins,
  onToggleAdjacentShort,
}) => {
  const [instrumentTab, setInstrumentTab] = useState<'LED_TESTER' | 'MULTIMETER'>('LED_TESTER');
  const [testerMode, setTesterMode] = useState<'OFF' | 'AUTO_FAST' | 'AUTO_SLOW' | 'MANUAL'>('OFF');
  const [isShieldedSTP, setIsShieldedSTP] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const maxStep = isShieldedSTP ? 9 : 8;

  useEffect(() => {
    soundFX.enabled = soundEnabled;
  }, [soundEnabled]);

  // Sequential timer for AUTO_FAST and AUTO_SLOW
  useEffect(() => {
    if (testerMode !== 'AUTO_FAST' && testerMode !== 'AUTO_SLOW') return;

    const intervalMs = testerMode === 'AUTO_FAST' ? 420 : 950;
    const timer = window.setInterval(() => {
      onChangeActiveStep(
        activeStep === null || activeStep >= maxStep ? 1 : activeStep + 1
      );
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [testerMode, activeStep, maxStep, onChangeActiveStep]);

  // Play beep when activeStep changes
  useEffect(() => {
    if (activeStep === null || testerMode === 'OFF') return;
    if (activeStep === 9) {
      if (isShieldedSTP && analysis.isCrimpedA && analysis.isCrimpedB) {
        soundFX.playTesterPulse('ok');
      }
      return;
    }
    const pinRes = analysis.pinResults[activeStep - 1];
    if (!pinRes) return;
    if (pinRes.status === 'straight') {
      soundFX.playTesterPulse('ok');
    } else if (pinRes.status === 'crossed') {
      soundFX.playTesterPulse('crossed');
    } else {
      soundFX.playTesterPulse('fault');
    }
  }, [
    activeStep,
    testerMode,
    isShieldedSTP,
    analysis.isCrimpedA,
    analysis.isCrimpedB,
    analysis.pinResults,
  ]);

  const startAutoFast = () => {
    setTesterMode('AUTO_FAST');
    if (activeStep === null) onChangeActiveStep(1);
  };

  const startAutoSlow = () => {
    setTesterMode('AUTO_SLOW');
    if (activeStep === null) onChangeActiveStep(1);
  };

  const stepManual = () => {
    setTesterMode('MANUAL');
    const next = activeStep === null || activeStep >= maxStep ? 1 : activeStep + 1;
    onChangeActiveStep(next);
  };

  const stopTester = () => {
    setTesterMode('OFF');
    onChangeActiveStep(null);
  };

  // Determine which LEDs are currently lit on MASTER and REMOTE
  const activeMasterLed = activeStep;
  let activeRemoteLed: number | null = null;
  let shortedMasterLeds: number[] = [];
  let shortedRemoteLeds: number[] = [];
  let currentPulseStatus: 'straight' | 'crossed' | 'short' | 'fault' | 'idle' = 'idle';

  if (activeStep !== null) {
    if (activeStep === 9) {
      if (isShieldedSTP && analysis.isCrimpedA && analysis.isCrimpedB) {
        activeRemoteLed = 9;
        currentPulseStatus = 'straight';
      } else {
        activeRemoteLed = null;
        currentPulseStatus = 'fault';
      }
    } else {
      const res = analysis.pinResults[activeStep - 1];
      if (res) {
        shortedMasterLeds = res.shortedMasterPins;
        shortedRemoteLeds = res.shortedRemotePins;
        if (res.status === 'straight' || res.status === 'crossed' || res.status === 'short') {
          activeRemoteLed = res.remotePin;
          currentPulseStatus = res.status;
        } else {
          activeRemoteLed = null;
          currentPulseStatus = 'fault';
        }
      }
    }
  }

  const ledRows = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // 9 = 'G' (Ground / Blindaje STP)

  return (
    <div className="flex flex-col gap-5">
      {/* Dual-Instrument Card: LED Tester & Digital Multimeter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Instrumentación de Verificación</span>
              <span aria-hidden="true">·</span>
              <span>Continuidad LED y Multímetro Ω</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Comprobador de Red y Multímetro Digital
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled((prev) => !prev)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title={
              soundEnabled
                ? 'Silenciar pitidos del comprobador/multímetro'
                : 'Activar sonido del comprobador/multímetro'
            }
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Segmented Control: Switch between LED Tester and Multimeter */}
        <div className="mt-3 flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setInstrumentTab('LED_TESTER');
              onChangeProbePins(null);
            }}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              instrumentTab === 'LED_TESTER'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Comprobador LED (1–8)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopTester();
              setInstrumentTab('MULTIMETER');
            }}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              instrumentTab === 'MULTIMETER'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Multímetro (Ω / Cortos)</span>
            {adjacentShorts.length > 0 && (
              <span className="ml-1 font-mono text-[10px] text-red-600 dark:text-red-400 font-bold">
                ({adjacentShorts.length}⚡)
              </span>
            )}
          </button>
        </div>

        {instrumentTab === 'LED_TESTER' ? (
          <>
            {/* Tester Controls Bar */}
            <div className="flex flex-wrap items-center gap-2 py-3 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={startAutoFast}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  testerMode === 'AUTO_FAST'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Auto Rápido</span>
              </button>

              <button
                type="button"
                onClick={startAutoSlow}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  testerMode === 'AUTO_SLOW'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Modo Lento</span>
              </button>

              <button
                type="button"
                onClick={stepManual}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  testerMode === 'MANUAL'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <StepForward className="w-3.5 h-3.5" />
                <span>Paso a Paso</span>
              </button>

              <button
                type="button"
                onClick={stopTester}
                disabled={testerMode === 'OFF'}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {testerMode === 'OFF' ? (
                  <RotateCcw className="w-3.5 h-3.5" />
                ) : (
                  <Pause className="w-3.5 h-3.5" />
                )}
                <span>Apagar</span>
              </button>
            </div>

            {/* STP / FTP Shield Toggle */}
            <div className="flex items-center justify-between py-2.5 text-xs text-slate-600 dark:text-slate-400">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isShieldedSTP}
                  onChange={(e) => setIsShieldedSTP(e.target.checked)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span>Simular cable blindado STP/FTP (Activar prueba de tierra LED «G»)</span>
              </label>
            </div>

            {/* Physical Master + Remote Dual Tester Enclosure */}
            <div className="mt-2 grid grid-cols-2 gap-3 bg-slate-900 dark:bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-100">
              {/* MASTER UNIT */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3 flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                  <span className="font-mono text-xs font-bold tracking-wider text-amber-400">
                    MASTER (LOCAL)
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">EXTREMO A</span>
                </div>

                <div className="space-y-1.5">
                  {ledRows.map((ledNum) => {
                    const label = ledNum === 9 ? 'G' : String(ledNum);
                    const isPrimaryLit = activeMasterLed === ledNum;
                    const isShortLeakLit = shortedMasterLeds.includes(ledNum);

                    return (
                      <div
                        key={ledNum}
                        onClick={() => {
                          setTesterMode('MANUAL');
                          onChangeActiveStep(ledNum);
                        }}
                        className="flex items-center justify-between px-2.5 py-1 rounded bg-slate-900/80 hover:bg-slate-900 cursor-pointer transition-colors"
                        title={`Probar manualmente pulso en Pin ${label}`}
                      >
                        <span className="font-mono text-xs font-bold text-slate-300 w-5">
                          {label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">
                            {isPrimaryLit
                              ? shortedMasterLeds.length > 0
                                ? 'TX+CORTO'
                                : 'TX PULSO'
                              : isShortLeakLit
                              ? '⚡ CORTO'
                              : '—'}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-full border transition-all ${
                              isPrimaryLit
                                ? shortedMasterLeds.length > 0
                                  ? 'bg-red-500 border-red-200 shadow-[0_0_12px_#ef4444]'
                                  : 'bg-emerald-400 border-emerald-200 shadow-[0_0_12px_#34d399]'
                                : isShortLeakLit
                                ? 'bg-red-500 border-red-200 shadow-[0_0_12px_#ef4444]'
                                : 'bg-slate-800 border-slate-700'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* REMOTE UNIT */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-3 flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700">
                  <span className="font-mono text-xs font-bold tracking-wider text-sky-400">
                    REMOTE (REMOTO)
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">EXTREMO B</span>
                </div>

                <div className="space-y-1.5">
                  {ledRows.map((ledNum) => {
                    const label = ledNum === 9 ? 'G' : String(ledNum);
                    const isPrimaryLit = activeRemoteLed === ledNum;
                    const isShortRemoteLit = shortedRemoteLeds.includes(ledNum);
                    const isCrossedLit = isPrimaryLit && currentPulseStatus === 'crossed';
                    const isShortStatus =
                      (isPrimaryLit && currentPulseStatus === 'short') || isShortRemoteLit;

                    return (
                      <div
                        key={ledNum}
                        className="flex items-center justify-between px-2.5 py-1 rounded bg-slate-900/80"
                      >
                        <div
                          className={`w-4 h-4 rounded-full border transition-all ${
                            isShortStatus
                              ? 'bg-red-500 border-red-200 shadow-[0_0_12px_#ef4444]'
                              : isPrimaryLit
                              ? isCrossedLit
                                ? 'bg-amber-400 border-amber-200 shadow-[0_0_12px_#fbbf24]'
                                : 'bg-emerald-400 border-emerald-200 shadow-[0_0_12px_#34d399]'
                              : 'bg-slate-800 border-slate-700'
                          }`}
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">
                            {isShortStatus
                              ? '⚡ CORTO'
                              : isPrimaryLit
                              ? isCrossedLit
                                ? 'CRUZADO'
                                : 'RX OK'
                              : '—'}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-300 w-5 text-right">
                            {label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Step Readout Banner */}
            <div className="mt-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
              {activeStep === null ? (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>
                    Comprobador en espera. Pulsa <strong>Auto Rápido</strong>,{' '}
                    <strong>Modo Lento</strong> o cambia a la pestaña{' '}
                    <strong>Multímetro (Ω / Cortos)</strong> para medir resistencia por par.
                  </span>
                </div>
              ) : activeStep === 9 ? (
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Pulso Blindaje (G):
                  </span>
                  <span
                    className={
                      activeRemoteLed === 9
                        ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                        : 'text-red-600 dark:text-red-400 font-semibold'
                    }
                  >
                    {activeRemoteLed === 9
                      ? 'Malla metálica STP continua (G → G OK)'
                      : 'Sin continuidad de blindaje (Cable UTP sin malla o sin crimpar)'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Probando Pin {activeStep}:
                  </span>
                  <span
                    className={
                      currentPulseStatus === 'straight'
                        ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                        : currentPulseStatus === 'crossed'
                        ? 'text-amber-700 dark:text-amber-300 font-semibold'
                        : 'text-red-600 dark:text-red-400 font-semibold'
                    }
                  >
                    {analysis.pinResults[activeStep - 1]?.description}
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-4">
            <MultimeterPanel
              slotsA={slotsA}
              slotsB={slotsB}
              isCrimpedA={isCrimpedA}
              isCrimpedB={isCrimpedB}
              wireFaults={wireFaults}
              adjacentShorts={adjacentShorts}
              analysis={analysis}
              onChangeProbePins={onChangeProbePins}
              onToggleAdjacentShort={onToggleAdjacentShort}
            />
          </div>
        )}
      </div>

      {/* Diagnostic Report & Protocol Compatibility Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Diagnóstico Automático EIA/TIA</span>
              <span aria-hidden="true">·</span>
              <span>Verificación de mapa de cableado</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {analysis.title}
            </h3>
          </div>
          {analysis.cableCategory === 'DIRECT_568B' ||
          analysis.cableCategory === 'DIRECT_568A' ||
          analysis.cableCategory === 'CROSSOVER_FAST' ||
          analysis.cableCategory === 'CROSSOVER_GIGABIT' ||
          analysis.cableCategory === 'ROLLOVER' ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
          {analysis.summary}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          <strong className="text-slate-700 dark:text-slate-200">Aplicación práctica:</strong>{' '}
          {analysis.useCase}
        </p>

        {/* Split Pair Warning Callout if triggered */}
        {analysis.hasSplitPairError && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Alerta de Par Dividido (Split Pair / Diafonía NEXT)</span>
            </div>
            <p className="leading-relaxed">
              En Ethernet, los pines <strong>1 y 2</strong> deben usar un par trenzado, y los pines{' '}
              <strong>3 y 6</strong> deben usar otro par trenzado común. Si colocas pares
              correlativos (1-2, 3-4, 5-6, 7-8), el tester básico da continuidad pero la señal sufre
              interferencia electromagnética severa.
            </p>
          </div>
        )}

        {/* Speed & PoE Compatibility Matrix */}
        <div className="mt-4 space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              {analysis.fastEthernetStatus.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span>Fast Ethernet (100 Mbps):</span>
            </div>
            <span
              className={`font-mono font-semibold ${
                analysis.fastEthernetStatus.ok
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {analysis.fastEthernetStatus.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
            {analysis.fastEthernetStatus.detail}
          </p>

          <div className="flex items-start justify-between gap-2 text-xs pt-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              {analysis.gigabitStatus.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span>Gigabit Ethernet (1 Gbps):</span>
            </div>
            <span
              className={`font-mono font-semibold ${
                analysis.gigabitStatus.ok
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {analysis.gigabitStatus.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
            {analysis.gigabitStatus.detail}
          </p>

          <div className="flex items-start justify-between gap-2 text-xs pt-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              {analysis.poeStatus.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span>Power over Ethernet (PoE):</span>
            </div>
            <span
              className={`font-mono font-semibold ${
                analysis.poeStatus.ok
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {analysis.poeStatus.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
            {analysis.poeStatus.detail}
          </p>
        </div>

        {/* Pin-by-Pin Continuity Table */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Tabla de Continuidad Pin a Pin (Master → Remote)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-1.5 pr-2">Pin A</th>
                  <th className="py-1.5 px-2">Hilo UTP</th>
                  <th className="py-1.5 px-2">Pin B</th>
                  <th className="py-1.5 pl-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {analysis.pinResults.map((res) => {
                  const isRowActive = activeStep === res.masterPin;
                  return (
                    <tr
                      key={res.masterPin}
                      onClick={() => {
                        setInstrumentTab('LED_TESTER');
                        setTesterMode('MANUAL');
                        onChangeActiveStep(res.masterPin);
                      }}
                      className={`cursor-pointer transition-colors ${
                        isRowActive
                          ? 'bg-sky-50 dark:bg-sky-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-1.5 pr-2 font-bold text-slate-800 dark:text-slate-200">
                        Pin {res.masterPin}
                      </td>
                      <td className="py-1.5 px-2 text-slate-700 dark:text-slate-300 font-sans">
                        {res.wireAtMaster ? WIRES[res.wireAtMaster].shortName : '—'}
                      </td>
                      <td className="py-1.5 px-2 font-bold text-slate-800 dark:text-slate-200">
                        {res.remotePin ? `Pin ${res.remotePin}` : '—'}
                      </td>
                      <td className="py-1.5 pl-2 text-right font-semibold">
                        {res.status === 'straight' && (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            ● DIRECTO
                          </span>
                        )}
                        {res.status === 'crossed' && (
                          <span className="text-amber-700 dark:text-amber-300">
                            ⇄ CRUZADO
                          </span>
                        )}
                        {res.status === 'short' && (
                          <span className="text-red-600 dark:text-red-400">
                            ⚡ CORTO P{res.masterPin}–P{res.shortedMasterPins.join(',')}
                          </span>
                        )}
                        {res.status === 'cut' && (
                          <span className="text-red-600 dark:text-red-400">
                            ✕ CORTADO
                          </span>
                        )}
                        {res.status === 'un-crimped' && (
                          <span className="text-amber-600 dark:text-amber-400">
                            ▲ SIN CRIMPAR
                          </span>
                        )}
                        {res.status === 'unconnected' && (
                          <span className="text-slate-400 dark:text-slate-500">
                            ○ ABIERTO
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
