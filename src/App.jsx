import React, { useState, useEffect } from 'react';

// Core modules
import { calculateFibonacciLevels, determineTrend } from './core/fibonacci.js';
import { extractPriceScale, extractAssetName, terminateOCR } from './core/ocr.js';
import { buildPriceMap, detectSwingPoints, buildManualPriceMap } from './core/imageAnalyzer.js';
import { generateInsight } from './core/insight.js';

// API Hooks
import { useCreateScan } from './api/hooks.js';

// Components
import UploadPanel from './components/UploadPanel';
import ChartPreview from './components/ChartPreview';
import FibTable from './components/FibTable';
import SwingPanel from './components/SwingPanel';
import InsightCard from './components/InsightCard';
import ManualModal from './components/ManualModal';

const App = () => {
    // App State
    const [status, setStatus] = useState('IDLE');
    const [loadingText, setLoadingText] = useState('');
    const [progress, setProgress] = useState(0);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);

    // Data State
    const [image, setImage] = useState(null);
    const [priceMap, setPriceMap] = useState(null);
    const [swingHigh, setSwingHigh] = useState(null);
    const [swingLow, setSwingLow] = useState(null);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [fibLevels, setFibLevels] = useState([]);
    const [assetInfo, setAssetInfo] = useState({ name: 'UNKNOWN', type: 'crypto', confidence: 0 });
    const [direction, setDirection] = useState('uptrend');
    const [insight, setInsight] = useState(null);

    // API Call Hook
    const createScanMutation = useCreateScan();

    // Helper to show loading
    const showLoading = (text, p) => {
        setStatus('SCANNING');
        setLoadingText(text);
        setProgress(p);
    };

    // Pipeline execution
    const executePipeline = async (img) => {
        setImage(img);
        showLoading('Menginisialisasi OCR engine...', 0);

        try {
            // Step 2: OCR — Extract price scale
            showLoading('Memindai skala harga (Y-axis)...', 10);
            const priceLabels = await extractPriceScale(img, (prog) => {
                setProgress(10 + prog * 40);
                setLoadingText('Membaca skala harga...');
            });

            // Step 3: OCR — Extract asset name
            showLoading('Mendeteksi jenis aset...', 55);
            const detectedAsset = await extractAssetName(img, (prog) => {
                setProgress(55 + prog * 15);
                setLoadingText('Mengenali ticker...');
            });
            setAssetInfo(detectedAsset);

            // Step 4: Build price map
            showLoading('Memetakan koordinat harga...', 75);
            const map = buildPriceMap(priceLabels, img.naturalHeight);
            setPriceMap(map);

            if (!map || priceLabels.length < 2) {
                setStatus('MANUAL INPUT');
                setIsManualModalOpen(true);
                return;
            }

            // Step 5: Detect swing points
            showLoading('Mendeteksi Swing High & Low...', 85);
            const swings = detectSwingPoints(img, map);

            if (!swings.swingHigh || !swings.swingLow || swings.swingHigh <= swings.swingLow) {
                setStatus('MANUAL INPUT');
                setIsManualModalOpen(true);
                return;
            }

            setSwingHigh(swings.swingHigh);
            setSwingLow(swings.swingLow);
            setCurrentPrice(swings.currentPrice);

            // Step 6: Process logic (Triggered by useEffect on data change)

            // Cleanup OCR worker
            await terminateOCR();
        } catch (err) {
            console.error('Pipeline error caught in App.jsx:', err);
            setStatus('ERROR');
            setLoadingText(`Error: ${err.message || 'Gagal memproses gambar.'}`);
            setIsManualModalOpen(true);
        }
    };

    // Secondary Pipeline: Re-calculate whenever inputs change
    useEffect(() => {
        if (swingHigh && swingLow) {
            showLoading('Menghitung level Fibonacci...', 95);

            const computedDirection = currentPrice ? determineTrend(swingHigh, swingLow, currentPrice) : 'uptrend';
            setDirection(computedDirection);

            const computedFibLevels = calculateFibonacciLevels(swingHigh, swingLow, computedDirection);
            setFibLevels(computedFibLevels);

            const computedInsight = generateInsight(currentPrice, computedFibLevels, assetInfo.type, swingHigh, swingLow);
            setInsight(computedInsight);

            setStatus('COMPLETE');

            // Async save to API
            createScanMutation.mutate({
                assetName: assetInfo.name,
                assetType: assetInfo.type,
                swingHigh: swingHigh,
                swingLow: swingLow,
                currentPrice: currentPrice,
                direction: computedDirection
            });
        }
    }, [swingHigh, swingLow, currentPrice, assetInfo.name, assetInfo.type]); // Exclude function refs

    // Handle Manual Modal Submit
    const onManualSubmit = (data) => {
        setSwingHigh(data.high);
        setSwingLow(data.low);
        setCurrentPrice(data.current);
        const updatedAsset = { name: data.assetType.toUpperCase(), type: data.assetType, confidence: 100 };
        setAssetInfo(updatedAsset);

        if (image) {
            setPriceMap(buildManualPriceMap(data.high, data.low, image.naturalHeight));
        }

        setIsManualModalOpen(false);
    };

    const isScanning = status === 'SCANNING';
    const hasResults = status === 'COMPLETE' || status === 'MANUAL INPUT' || status === 'ERROR';

    return (
        <>
            <header id="app-header">
                <div className="header-inner">
                    <div className="logo-block">
                        <span className="logo-phi">φ</span>
                        <div className="logo-text">
                            <h1>FIBONACCI STRATEGY</h1>
                            <span className="logo-sub">ANALIS MATA DIGITAL</span>
                        </div>
                    </div>
                    <div className="header-badges">
                        <span className="badge badge-version">v1.1 React</span>
                        <span className={`badge badge-status ${isScanning ? 'active' : ''}`}>
                            {status}
                        </span>
                    </div>
                </div>
            </header>

            <main id="app-main">
                <section className="col-left">
                    {(!image || isScanning || !hasResults) && (
                        <UploadPanel
                            onImageLoaded={executePipeline}
                            isLoading={isScanning}
                            loadingText={loadingText}
                            progress={progress}
                        />
                    )}

                    <ChartPreview
                        image={image}
                        fibLevels={fibLevels}
                        priceMap={priceMap}
                        currentPrice={currentPrice}
                        assetInfo={assetInfo}
                        onEditAsset={() => setIsManualModalOpen(true)}
                    />
                </section>

                {hasResults && fibLevels.length > 0 && (
                    <section className="col-right" id="resultsColumn">
                        <SwingPanel
                            swingHigh={swingHigh}
                            swingLow={swingLow}
                            assetType={assetInfo.type}
                            onEdit={() => setIsManualModalOpen(true)}
                        />

                        <FibTable
                            levels={fibLevels}
                            currentPrice={currentPrice}
                            assetType={assetInfo.type}
                        />

                        <InsightCard
                            insight={insight}
                            assetType={assetInfo.type}
                        />
                    </section>
                )}
            </main>

            <ManualModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                onSubmit={onManualSubmit}
                initialAssetType={assetInfo.type}
            />

            <footer id="app-footer">
                <div className="ticker-strip">
                    <span>φ FIBONACCI STRATEGY</span>
                    <span>•</span>
                    <span>POWERED BY TESSERACT OCR & REACT QUERY</span>
                    <span>•</span>
                    <span>0.236 · 0.382 · 0.5 · <em className="gold">0.618</em> · 0.786</span>
                    <span>•</span>
                    <span>ANALIS MATA DIGITAL</span>
                </div>
            </footer>
        </>
    );
};

export default App;
