import React, { useState } from 'react';
import {
  CableAnalysis,
  CHALLENGES,
  ChallengeItem,
  PIN_SPECS,
  WIRES,
} from '../data/cableStandards';
import { WireVisual } from './WireSwatch';
import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  PlayCircle,
  Printer,
  Sparkles,
} from 'lucide-react';

interface StandardsReferenceSectionProps {
  analysis: CableAnalysis;
  activeChallengeId: string | null;
  completedChallenges: string[];
  onLoadChallenge: (challenge: ChallengeItem) => void;
  onApplyPresetCable: (
    type:
      | 'DIRECT_568B'
      | 'DIRECT_568A'
      | 'CROSSOVER_FAST'
      | 'CROSSOVER_GIGABIT'
      | 'SPLIT_PAIR_DEMO'
  ) => void;
}

const CRIMP_WORKSHOP_STEPS = [
  {
    step: 'Fase 1',
    title: 'Pelado de la cubierta exterior UTP (2.5 cm)',
    measurement: 'Longitud de corte: 25 mm – 30 mm',
    detail:
      'Introduce el extremo del cable en la cuchilla circular de la herramienta pelacables a unos 2.5 cm de la punta. Gira 360° suavemente sin presionar en exceso para no morder el aislamiento de PVC de los 8 conductores internos de cobre.',
    tip: 'Inspecciona siempre la base de los pares tras retirar la camisa: si ves cobre brillante asomando en la base, corta y vuelve a pelar para evitar roturas o cortocircuitos al doblar el cable.',
  },
  {
    step: 'Fase 2',
    title: 'Destrenzado y alisado de los 4 pares (< 13 mm finales)',
    measurement: 'Destrenzado máximo en conector: 12.7 mm (0.5")',
    detail:
      'Separa los 4 pares trenzados en abanico (Azul, Naranja, Verde y Marrón), retira el hilo de rasgado (ripcord) y el separador cruciforme central (si es Cat 6) al ras de la cubierta. Destrenza cada par y alisa los hilos con las yemas de los dedos desde la base hacia afuera.',
    tip: 'La norma ANSI/TIA-568 exige que una vez crimpado el conector no queden más de 13 mm sin trenzar para evitar diafonía de extremo cercano (NEXT).',
  },
  {
    step: 'Fase 3',
    title: 'Peinado en paralelo según norma T568A o T568B',
    measurement: '8 conductores en un único plano horizontal',
    detail:
      'Sujeta firmemente la base de los hilos con el pulgar e índice de una mano y ordénalos de izquierda a derecha (Pin 1 a Pin 8) según la norma elegida. Recuerda abrir el Par 3 (pines 3 y 6) rodeando al Par 1 central (pines 4 y 5).',
    tip: 'Flexiona ligeramente el abanico de hilos de arriba abajo mientras los sujetas para que queden totalmente planos y juntos antes de cortarlos.',
  },
  {
    step: 'Fase 4',
    title: 'Corte recto en guillotina a 12 mm de la camisa',
    measurement: 'Exposición exacta: 12 mm – 13 mm',
    detail:
      'Con la cuchilla plana de la crimpadora (o alicate de corte recto), realiza un corte perpendicular limpio dejando exactamente 1.2 cm de hilos visibles desde el borde de la cubierta exterior.',
    tip: 'Esta medida es crítica: permite que las puntas toquen el fondo frontal del conector RJ-45 mientras que la camisa exterior gris/azul entra dentro del prensaestopas.',
  },
  {
    step: 'Fase 5',
    title: 'Inserción con pestaña hacia abajo y Crimpado firme',
    measurement: '8 puntas de cobre visibles en el frontal',
    detail:
      'Con la pestaña (clip) del RJ-45 mirando hacia abajo y los contactos dorados hacia ti, desliza los 8 hilos por sus carriles hasta que hagan tope en la pared frontal transparente. Verifica el código de colores, introduce el conector en la boca 8P de la crimpadora y aprieta hasta el final del trinquete.',
    tip: 'Las 8 cuchillas doradas deben quedar hundidas por igual perforando el aislante, y el prensaestopas debe morder la cubierta exterior del cable, nunca los hilos sueltos.',
  },
];

export const StandardsReferenceSection: React.FC<StandardsReferenceSectionProps> = ({
  analysis,
  activeChallengeId,
  completedChallenges,
  onLoadChallenge,
  onApplyPresetCable,
}) => {
  const [activeCrimpStep, setActiveCrimpStep] = useState<number>(0);
  const [studentName, setStudentName] = useState<string>('');
  const [studentGroup, setStudentGroup] = useState<string>('Redes Locales / SMR - ASIR');
  const [reportCopied, setReportCopied] = useState<boolean>(false);

  const isCertifiedPass =
    (analysis.cableCategory === 'DIRECT_568B' ||
      analysis.cableCategory === 'DIRECT_568A' ||
      analysis.cableCategory === 'CROSSOVER_FAST' ||
      analysis.cableCategory === 'CROSSOVER_GIGABIT' ||
      analysis.cableCategory === 'ROLLOVER') &&
    analysis.cutWires.length === 0 &&
    analysis.adjacentShorts.length === 0;

  const generateReportText = () => {
    const now = new Date().toLocaleString('es-ES');
    const pinLines = analysis.pinResults
      .map(
        (r) =>
          `  Pin ${r.masterPin} (${
            r.wireAtMaster ? WIRES[r.wireAtMaster].name : 'Vacío'
          }) -> ${r.remotePin ? `Pin ${r.remotePin}` : 'ABIERTO'} [${r.status.toUpperCase()}]`
      )
      .join('\n');

    return [
      '====================================================================',
      'INFORME TÉCNICO DE CERTIFICACIÓN DE CABLEADO ESTRUCTURADO RJ-45',
      'Laboratorio Didáctico — Un Fantasma en el Sistema',
      'https://www.unfantasmaenelsistema.com/',
      '====================================================================',
      `Fecha y Hora       : ${now}`,
      `Técnico / Alumno   : ${studentName.trim() || 'No especificado'}`,
      `Grupo / Módulo     : ${studentGroup.trim() || 'Taller de Redes'}`,
      '--------------------------------------------------------------------',
      `Resultado Global   : ${isCertifiedPass ? 'APTO / CERTIFICADO (PASA)' : 'NO APTO (FALLO)'}`,
      `Clasificación      : ${analysis.title}`,
      `Norma Conector A   : ${analysis.endALabel} (${analysis.isCrimpedA ? 'Crimpado' : 'Sin crimpar'})`,
      `Norma Conector B   : ${analysis.endBLabel} (${analysis.isCrimpedB ? 'Crimpado' : 'Sin crimpar'})`,
      `Enlace 100BASE-TX  : ${analysis.fastEthernetStatus.label} (${analysis.fastEthernetStatus.detail})`,
      `Enlace 1000BASE-T  : ${analysis.gigabitStatus.label} (${analysis.gigabitStatus.detail})`,
      `Soporte PoE        : ${analysis.poeStatus.label} (${analysis.poeStatus.detail})`,
      `Retos Superados    : ${completedChallenges.length} / ${CHALLENGES.length}`,
      '--------------------------------------------------------------------',
      'MAPA DE CONTINUIDAD PIN A PIN (MASTER -> REMOTE):',
      pinLines,
      '====================================================================',
    ].join('\n');
  };

  const handleDownloadReport = () => {
    const content = generateReportText();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificacion-rj45-${analysis.cableCategory.toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(generateReportText()).then(() => {
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2500);
    });
  };

  return (
    <div className="space-y-10 mt-10">
      {/* Section 1: Practical Workshop Challenges */}
      <section id="retos" className="scroll-mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Evaluación Práctica de Taller</span>
              <span aria-hidden="true">·</span>
              <span>
                {completedChallenges.length} de {CHALLENGES.length} retos superados
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              01. Retos Prácticos de Cableado y Diagnóstico con Multímetro
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
              Cargar plantilla rápida en mesa:
            </span>
            <button
              type="button"
              onClick={() => onApplyPresetCable('DIRECT_568B')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Directo 568B
            </button>
            <button
              type="button"
              onClick={() => onApplyPresetCable('DIRECT_568A')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Directo 568A
            </button>
            <button
              type="button"
              onClick={() => onApplyPresetCable('CROSSOVER_FAST')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Cruzado (568A↔568B)
            </button>
            <button
              type="button"
              onClick={() => onApplyPresetCable('SPLIT_PAIR_DEMO')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Demo Error Split-Pair
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHALLENGES.map((ch) => {
            const isActive = activeChallengeId === ch.id;
            const isCompleted = completedChallenges.includes(ch.id);
            const liveCheck = ch.verify(analysis);

            return (
              <div
                key={ch.id}
                className={`flex flex-col justify-between rounded-xl border p-5 transition-all ${
                  isActive
                    ? 'bg-sky-50/50 dark:bg-sky-950/30 border-sky-500 dark:border-sky-500'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        Reto {ch.number}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Nivel {ch.difficulty}</span>
                    </div>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> Superado
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {ch.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {ch.scenario}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-200 mt-2 font-medium leading-relaxed">
                    Objetivo: {ch.objective}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {isActive && (
                    <div
                      className={`mb-3 p-2.5 rounded-lg text-xs ${
                        liveCheck.passed
                          ? 'bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 font-medium'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {liveCheck.feedback}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onLoadChallenge(ch)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                      }`}
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Reiniciar Reto en Mesa' : 'Iniciar Reto'}</span>
                    </button>

                    <span
                      className="text-[11px] text-slate-500 dark:text-slate-400 truncate"
                      title={ch.hint}
                    >
                      Pista disponible al activar
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Interactive 5-Phase Real Workshop Crimping Guide */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Procedimiento Mecánico de Taller</span>
              <span aria-hidden="true">·</span>
              <span>Buenas Prácticas de Instalación Profesional</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              02. Guía Paso a Paso del Crimpado Real de un Cable UTP RJ-45
            </h2>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {CRIMP_WORKSHOP_STEPS.map((item, idx) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setActiveCrimpStep(idx)}
              className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                activeCrimpStep === idx
                  ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-500 dark:border-sky-500 text-slate-900 dark:text-white'
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                {item.step}
              </div>
              <div className="text-xs font-semibold mt-0.5 line-clamp-2">{item.title}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {CRIMP_WORKSHOP_STEPS[activeCrimpStep].step}:{' '}
              {CRIMP_WORKSHOP_STEPS[activeCrimpStep].title}
            </h3>
            <span className="font-mono text-xs font-bold text-sky-700 dark:text-sky-300">
              {CRIMP_WORKSHOP_STEPS[activeCrimpStep].measurement}
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
            {CRIMP_WORKSHOP_STEPS[activeCrimpStep].detail}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">Consejo de certificación:</strong>{' '}
            {CRIMP_WORKSHOP_STEPS[activeCrimpStep].tip}
          </p>
        </div>
      </section>

      {/* Section 3: Normativa EIA/TIA-568A vs 568B Reference Table */}
      <section
        id="normativa"
        className="scroll-mt-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Estándar de Telecomunicaciones ANSI/TIA/EIA-568</span>
              <span aria-hidden="true">·</span>
              <span>Conector Modular 8P8C (RJ-45)</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              03. Tabla Comparativa de Pines: Norma T568A vs Norma T568B
            </h2>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            Observa cómo los pares <strong>Azul (Pines 4–5)</strong> y{' '}
            <strong>Marrón (Pines 7–8)</strong> permanecen siempre en la misma posición, mientras que
            los pares <strong>Verde</strong> y <strong>Naranja</strong> se intercambian entre 568A y
            568B.
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 pr-3 font-mono">Pin RJ-45</th>
                <th className="py-3 px-3">Color en Norma T568A</th>
                <th className="py-3 px-3">Color en Norma T568B</th>
                <th className="py-3 px-3">Señal 10/100BASE-TX</th>
                <th className="py-3 px-3">Señal 1000BASE-T (Gigabit)</th>
                <th className="py-3 pl-3">Alimentación PoE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {PIN_SPECS.map((spec) => {
                const wA = WIRES[spec.wire568A];
                const wB = WIRES[spec.wire568B];
                return (
                  <tr
                    key={spec.pin}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 pr-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      Pin {spec.pin}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <WireVisual wireId={spec.wire568A} className="w-7 h-3 rounded-xs shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {wA.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <WireVisual wireId={spec.wire568B} className="w-7 h-3 rounded-xs shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {wB.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {spec.fastEthernetSignal}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                        {spec.fastEthernetRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                      {spec.gigabitSignal}
                    </td>
                    <td className="py-2.5 pl-3 text-[11px] text-slate-600 dark:text-slate-400">
                      <div>Modo A: {spec.poeModeA}</div>
                      <div>Modo B: {spec.poeModeB}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Didactic Engineering Notes */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>¿Por qué el Par 3 salta a los pines 3 y 6?</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              Por compatibilidad histórica con la telefonía analógica (RJ-11), el{' '}
              <strong>Par 1 (Azul)</strong> ocupa siempre los pines centrales{' '}
              <strong>4 y 5</strong>. Para rodear ese par central sin perder el trenzado balanceado,
              el segundo par de datos debe abrirse en los pines <strong>3 y 6</strong>.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Orientación correcta del cabezal RJ-45
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              Sujeta siempre el conector RJ-45 con la{' '}
              <strong>pestaña o clip de bloqueo hacia abajo</strong> (mirando hacia el suelo) y las{' '}
              <strong>cuchillas doradas mirando hacia ti (arriba)</strong>. En esa posición, el{' '}
              <strong>Pin 1</strong> es siempre el de la izquierda y el <strong>Pin 8</strong> el de
              la derecha.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              ¿Cuándo usar Cable Directo vs Cruzado?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
              El <strong>Cable Directo</strong> (568B–568B o 568A–568A) une equipos de distinta capa
              (PC a Switch, Router a Switch). El <strong>Cable Cruzado</strong> (568A–568B) une
              equipos iguales (PC a PC, Switch a Switch, Router a Router) cuando no disponen de
              detección automática <em>Auto-MDI/MDIX</em>.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Exportable Lab Certification Report Generator */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Documentación para Entrega de Prácticas</span>
              <span aria-hidden="true">·</span>
              <span>Hoja de Certificación de Cableado</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              04. Exportar Informe Técnico de Certificación
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>{reportCopied ? '¡Informe Copiado!' : 'Copiar Resumen'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Informe (.TXT)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Alumno / Técnico Instalador:
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ej. Ana García Pérez"
                className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Módulo / Grupo / Proyecto:
              </label>
              <input
                type="text"
                value={studentGroup}
                onChange={(e) => setStudentGroup(e.target.value)}
                placeholder="Ej. 1º SMR — Redes Locales"
                className="w-full px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
              <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <span>
                El informe recoge automáticamente el estado actual del cable en la mesa de trabajo,
                la norma detectada en ambos extremos, la tabla pin a pin y la compatibilidad con Fast
                Ethernet, Gigabit y PoE.
              </span>
            </div>
          </div>

          <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 max-h-56">
            {generateReportText()}
          </pre>
        </div>
      </section>
    </div>
  );
};
