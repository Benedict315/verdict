'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ExternalLink,
  ShieldBan,
  RotateCcw,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { Decision } from '@verdict/shared';
import { demoScenarios, type DemoScenario } from '../../fixtures/scenarios';
import { DecisionBadge } from '../../components/DecisionBadge';
import { CheckList } from '../../components/CheckList';
import { AgentAvatar } from '../../components/AgentAvatar';
import { GlowButton } from '../../components/GlowButton';
import { DocketPanel } from '../../components/DocketPanel';

function TrustCheckContent() {
  const searchParams = useSearchParams();
  const initialScenarioKey = (searchParams.get('scenario') as 'alpha' | 'shadow' | 'sentinel') || 'alpha';

  const [activeKey, setActiveKey] = useState<'alpha' | 'shadow' | 'sentinel'>(
    demoScenarios[initialScenarioKey] ? initialScenarioKey : 'alpha'
  );
  const [runKey, setRunKey] = useState<number>(1);
  const [evaluationComplete, setEvaluationComplete] = useState<boolean>(false);
  const [humanOverride, setHumanOverride] = useState<'ALLOW' | 'REJECT' | null>(null);

  // When active scenario changes, reset human override and re-run evaluation
  const handleScenarioChange = (key: 'alpha' | 'shadow' | 'sentinel') => {
    setActiveKey(key);
    setHumanOverride(null);
    setEvaluationComplete(false);
    setRunKey((prev) => prev + 1);
  };

  const handleRerun = () => {
    setHumanOverride(null);
    setEvaluationComplete(false);
    setRunKey((prev) => prev + 1);
  };

  const scenario = demoScenarios[activeKey];
  const currentDecision: Decision = humanOverride || scenario.decision;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header & Scenario Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6d5bff] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive security evaluation gate</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Trust Check</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Deterministic pre-action gate verifying identity, capability, and policy on Base Sepolia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlowButton
            variant="secondary"
            size="sm"
            onClick={handleRerun}
            title="Re-run the evaluation animation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-run evaluation</span>
          </GlowButton>
        </div>
      </div>

      {/* Scenario Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {(['alpha', 'shadow', 'sentinel'] as const).map((key) => {
          const s = demoScenarios[key];
          const isSelected = activeKey === key;
          const badgeTone = s.decision;

          return (
            <button
              key={key}
              onClick={() => handleScenarioChange(key)}
              className={`p-3.5 rounded-xl text-left border transition-all duration-150 ${
                isSelected
                  ? 'bg-white/[0.08] border-white/20 shadow-[0_0_20px_-4px_rgba(255,255,255,0.08)]'
                  : 'bg-white/[0.025] hover:bg-white/[0.05] border-white/[0.06]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-white truncate">{s.agent.displayName}</span>
                <DecisionBadge status={s.decision} size="sm" showGlow={isSelected} />
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">{s.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Main Trust Check Card */}
      <div className="glass-panel p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Subtle background highlight matching current status */}
        <div
          className={`absolute -top-24 -right-24 w-72 h-72 rounded-full filter blur-3xl opacity-20 pointer-events-none transition-colors duration-500 ${
            currentDecision === 'ALLOW'
              ? 'bg-emerald-500'
              : currentDecision === 'REJECT'
              ? 'bg-rose-500'
              : 'bg-amber-500'
          }`}
        />

        {/* Request Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-3.5">
            <AgentAvatar id={scenario.agent.id} name={scenario.agent.displayName} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">{scenario.agent.displayName}</h2>
                <Link
                  href={`/agents/${scenario.agent.id}`}
                  className="text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-0.5 underline decoration-slate-600 underline-offset-2"
                >
                  <span>Passport</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">{scenario.actionDescription}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Status</span>
              <span className="text-xs text-slate-300">
                {evaluationComplete ? 'Evaluation finalized' : 'Verifying...'}
              </span>
            </div>
            <DecisionBadge status={currentDecision} size="lg" showGlow={evaluationComplete} />
          </div>
        </div>

        {/* The 5 Security Checks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Deterministic verification gates</span>
            <span>Policy status</span>
          </div>

          <CheckList
            checks={scenario.checks}
            runKey={runKey}
            onComplete={() => setEvaluationComplete(true)}
          />
        </div>

        {/* Dynamic Outcome Panels (Rendered once evaluation finishes or immediately if reduced motion) */}
        {evaluationComplete && (
          <div className="pt-2 animate-fadeIn transition-opacity duration-300">
            {/* ALLOW Outcome Panel */}
            {currentDecision === 'ALLOW' && (
              <div className="glass-panel-subtle p-5 border-emerald-500/30 bg-emerald-950/20 shadow-[0_0_24px_-4px_rgba(34,197,94,0.25)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-semibold tracking-wide uppercase">
                      Action approved for on-chain execution
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400/80 font-mono">Base Sepolia</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Transaction hash</span>
                  <div className="flex items-center justify-between gap-3 bg-black/40 border border-emerald-500/20 rounded-lg p-2.5 font-mono text-xs text-[#2f6fed] break-all">
                    <span>
                      {scenario.txHash ||
                        '0x7a3f81c902b4d7e9b048593a19e5c46b9a8e2d7c5b3a10e4f8d6c7b9a0e1f234'}
                    </span>
                    <a
                      href={`https://sepolia.basescan.org/tx/${
                        scenario.txHash ||
                        '0x7a3f81c902b4d7e9b048593a19e5c46b9a8e2d7c5b3a10e4f8d6c7b9a0e1f234'
                      }`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-slate-400 hover:text-white shrink-0"
                      title="Inspect on Base Sepolia block explorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Single-use authorization token verified and consumed by backend executor.
                </p>
              </div>
            )}

            {/* REJECT Outcome Panel */}
            {currentDecision === 'REJECT' && (
              <div className="glass-panel-subtle p-5 border-rose-500/30 bg-rose-950/20 shadow-[0_0_24px_-4px_rgba(239,68,68,0.25)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-400">
                    <ShieldBan className="w-4 h-4" />
                    <span className="text-xs font-semibold tracking-wide uppercase">
                      Action blocked by security gate
                    </span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-mono">
                    No transaction created
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {scenario.reasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-black/40 border border-rose-500/20 text-xs text-rose-200"
                    >
                      {reason}
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-400">
                  Genuinely blocked — no authorization token was issued, ensuring execution is impossible.
                </p>
              </div>
            )}

            {/* REVIEW Outcome Panel */}
            {currentDecision === 'REVIEW' && (
              <div className="space-y-4">
                <div className="glass-panel-subtle p-5 border-amber-500/30 bg-amber-950/20 shadow-[0_0_24px_-4px_rgba(245,158,11,0.25)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-semibold tracking-wide uppercase">
                        Requires human sign-off
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-400/80">Borderline policy trigger</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/40 border border-amber-500/20 text-xs text-amber-200">
                    {scenario.reasons[0]}
                  </div>

                  {/* Human Reviewer Action Controls */}
                  <div className="pt-2 flex items-center justify-between border-t border-amber-500/20">
                    <span className="text-xs text-slate-300">Human reviewer action:</span>
                    <div className="flex items-center gap-2">
                      <GlowButton
                        variant="danger"
                        size="sm"
                        onClick={() => setHumanOverride('REJECT')}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Deny</span>
                      </GlowButton>
                      <GlowButton
                        variant="success"
                        size="sm"
                        onClick={() => setHumanOverride('ALLOW')}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </GlowButton>
                    </div>
                  </div>
                </div>

                {/* Embedded Docket Panel */}
                {scenario.docketMatches && <DocketPanel entries={scenario.docketMatches} />}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrustCheckPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-500 text-sm">
          Loading trust check simulation...
        </div>
      }
    >
      <TrustCheckContent />
    </Suspense>
  );
}
