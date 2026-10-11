'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CaptureZone } from '@/components/CaptureZone';
import { AnalyzingState } from '@/components/AnalyzingState';
import { ResultSheet } from '@/components/ResultSheet';
import { ClarifyPanel } from '@/components/ClarifyPanel';
import { ManualCheckPanel } from '@/components/ManualCheckPanel';
import { ManualPicker } from '@/components/ManualPicker';
import { ErrorPanel } from '@/components/ErrorPanel';
import { TallyBar } from '@/components/TallyBar';
import {
  fetchHealth,
  fetchFixtures,
  fetchRules,
  classifyImage,
  classifyFixture,
  submitDecision,
  FixtureItem,
  RulesResponse,
  HealthResponse,
  ClassifyResponse,
} from '@/lib/client/api';
import { Classification } from '@/lib/schemas/classification';
import { Clarification, Decision } from '@/lib/schemas/result';
import { DestinationTone } from '@/lib/schemas/ruleset';

type AppState =
  | 'empty'
  | 'analyzing'
  | 'decided'
  | 'needs_clarification'
  | 'manual_check'
  | 'manual_picker'
  | 'error';

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('empty');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [rules, setRules] = useState<RulesResponse | null>(null);
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);

  // Current session state
  const [classification, setClassification] = useState<Classification | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [clarification, setClarification] = useState<Clarification | null>(null);
  const [manualCheckReason, setManualCheckReason] = useState<string>('');
  const [manualCheckUrl, setManualCheckUrl] = useState<string>('');
  const [resultSource, setResultSource] = useState<'live' | 'cache' | 'demo-sample' | 'manual'>(
    'demo-sample'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorHint, setErrorHint] = useState<string>('');
  const [sortedCount, setSortedCount] = useState<number>(0);
  const [isSorted, setIsSorted] = useState<boolean>(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Last action for retry
  const lastActionRef = useRef<() => void>(() => {});
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Initial fetch of public metadata
    fetchHealth()
      .then((h) => setHealth(h))
      .catch((e) => console.warn('Failed to load health status:', e));

    fetchRules()
      .then((r) => setRules(r))
      .catch((e) => console.warn('Failed to load rules:', e));

    fetchFixtures()
      .then((f) => setFixtures(f))
      .catch((e) => console.warn('Failed to load fixtures:', e));
  }, []);

  const handleProcessResponse = (response: ClassifyResponse) => {
    setClassification(response.classification);
    setResultSource(response.source);

    if (response.result.status === 'decided') {
      setDecision(response.result.decision);
      setIsSorted(false);
      setAppState('decided');
    } else if (response.result.status === 'needs_clarification') {
      setClarification(response.result.clarification);
      setAppState('needs_clarification');
    } else if (response.result.status === 'manual_check') {
      setManualCheckReason(response.result.reason);
      setManualCheckUrl(response.result.sourceUrl);
      setAppState('manual_check');
    }
  };

  const handleError = (err: any) => {
    if (err.name === 'AbortError') {
      setAppState('empty');
      return;
    }
    setErrorMessage(err.message || 'BinBuddy could not analyze that item.');
    setErrorHint(err.hint || 'Try again, use a sample, or pick the item yourself.');
    setAppState('error');
  };

  const handleFileSelect = (file: File) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAppState('analyzing');
    lastActionRef.current = () => handleFileSelect(file);

    classifyImage(file, controller.signal).then(handleProcessResponse).catch(handleError);
  };

  const handleSampleSelect = (fixtureId: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAppState('analyzing');
    lastActionRef.current = () => handleSampleSelect(fixtureId);

    classifyFixture(fixtureId, controller.signal).then(handleProcessResponse).catch(handleError);
  };

  const handleClarifyAnswer = (value: string) => {
    if (!classification) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAppState('analyzing');
    const fieldId = clarification?.id || 'material';
    const updatedAnswers = { ...answers, [fieldId]: value };
    setAnswers(updatedAnswers);

    lastActionRef.current = () => handleClarifyAnswer(value);

    submitDecision(classification, updatedAnswers, controller.signal)
      .then(handleProcessResponse)
      .catch(handleError);
  };

  const handleManualPickerSubmit = (data: {
    material: any;
    itemType: any;
    condition: any;
    resinCode: any;
  }) => {
    const manualClass: Classification = {
      itemType: data.itemType,
      material: data.material,
      condition: data.condition,
      visibleResinCode: data.resinCode,
      confidence: 1.0,
      shortDescription: `Manually picked ${data.material} item`,
    };

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setAppState('analyzing');
    lastActionRef.current = () => handleManualPickerSubmit(data);

    submitDecision(manualClass, {}, controller.signal)
      .then((res) => {
        handleProcessResponse({ ...res, source: 'manual' });
      })
      .catch(handleError);
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setAppState('empty');
  };

  const handleReset = () => {
    abortControllerRef.current?.abort();
    setClassification(null);
    setDecision(null);
    setClarification(null);
    setAnswers({});
    setIsSorted(false);
    setAppState('empty');
  };

  const handleMarkSorted = () => {
    if (!isSorted) {
      setIsSorted(true);
      setSortedCount((c) => c + 1);
    }
  };

  // Find destination label and tone from rules
  const destinationMeta = rules?.destinations.find((d) => d.id === decision?.destinationId);
  const destinationLabel = destinationMeta?.label || decision?.destinationId || 'Curbside Cart';
  const destinationTone: DestinationTone = destinationMeta?.tone || 'recycle';

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-between p-4 sm:p-6">
      <div className="flex flex-col gap-6">
        <Header
          isDemo={health ? health.providers.gemini === 'demo' : true}
          isDraft={health?.draft || rules?.draft}
          cityName={rules?.city?.name ? `${rules.city.name}, ${rules.city.region}` : 'Houston, TX'}
        />

        <main id="main-content" className="w-full">
          {appState === 'empty' && (
            <CaptureZone
              onFileSelect={handleFileSelect}
              onSampleSelect={handleSampleSelect}
              onManualSelect={() => setAppState('manual_picker')}
              fixtures={fixtures}
            />
          )}

          {appState === 'analyzing' && <AnalyzingState onCancel={handleCancel} />}

          {appState === 'decided' && decision && classification && (
            <ResultSheet
              decision={decision}
              classification={classification}
              destinationLabel={destinationLabel}
              destinationTone={destinationTone}
              rulesetVersion={rules?.version || '1.0.0'}
              source={resultSource}
              onTryAnother={handleReset}
              onMarkSorted={handleMarkSorted}
              isSorted={isSorted}
            />
          )}

          {appState === 'needs_clarification' && clarification && classification && (
            <ClarifyPanel
              clarification={clarification}
              classification={classification}
              onAnswer={handleClarifyAnswer}
              onCancel={handleReset}
            />
          )}

          {appState === 'manual_check' && (
            <ManualCheckPanel
              reason={manualCheckReason || 'Please check official guidance.'}
              sourceUrl={
                manualCheckUrl ||
                rules?.sourceUrl ||
                'https://www.houstontx.gov/solidwaste/recycling.html'
              }
              onPickYourself={() => setAppState('manual_picker')}
              onTryAnother={handleReset}
            />
          )}

          {appState === 'manual_picker' && (
            <ManualPicker onSubmit={handleManualPickerSubmit} onCancel={handleReset} />
          )}

          {appState === 'error' && (
            <ErrorPanel
              message={errorMessage}
              hint={errorHint}
              onRetry={() => lastActionRef.current()}
              onUseSample={() => setAppState('empty')}
              onManualPick={() => setAppState('manual_picker')}
            />
          )}
        </main>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <TallyBar count={sortedCount} />
        <Footer
          sourceUrl={rules?.sourceUrl}
          rulesetVersion={rules?.version}
          lastVerifiedAt={rules?.lastVerifiedAt}
        />
      </div>
    </div>
  );
}
