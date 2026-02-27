import React, { useEffect, useRef } from 'react';
import { priceToPixel } from '../core/imageAnalyzer.js';
import AssetBadge from './AssetBadge';

const ChartPreview = ({ image, fibLevels, priceMap, currentPrice, assetInfo, onEditAsset }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!image || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions to match image aspect
        // In React we can just use the parent's width via offsetWidth
        const parentWidth = canvas.parentElement?.clientWidth || window.innerWidth * 0.45;
        const maxWidth = parentWidth - 16; // padding
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.style.maxWidth = `${maxWidth}px`;

        const chartLeft = Math.floor(canvas.width * 0.02);
        const chartRight = Math.floor(canvas.width * 0.82);

        // 1. Draw Image
        ctx.drawImage(image, 0, 0);

        // 2. Draw Fib Overlay
        if (priceMap && fibLevels && fibLevels.length > 0) {
            for (const level of fibLevels) {
                const y = priceToPixel(level.price, priceMap);

                if (y < 0 || y > canvas.height) continue;

                // Line color
                if (level.isGoldenPocket) {
                    ctx.strokeStyle = '#ffd700';
                    ctx.lineWidth = 2.5;
                    ctx.setLineDash([]);
                    // Draw glow
                    ctx.shadowColor = '#ffd700';
                    ctx.shadowBlur = 12;
                } else if (level.level <= 0.382) {
                    ctx.strokeStyle = 'rgba(255, 34, 85, 0.7)';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([8, 4]);
                    ctx.shadowBlur = 0;
                } else {
                    ctx.strokeStyle = 'rgba(0, 255, 106, 0.6)';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([8, 4]);
                    ctx.shadowBlur = 0;
                }

                // Draw line
                ctx.beginPath();
                ctx.moveTo(chartLeft, y);
                ctx.lineTo(chartRight, y);
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Draw label background
                const labelText = `${level.label} — ${level.price.toLocaleString()}`;
                ctx.font = `bold 11px 'JetBrains Mono', monospace`;
                const textWidth = ctx.measureText(labelText).width;

                ctx.fillStyle = level.isGoldenPocket ? 'rgba(255, 215, 0, 0.2)' : 'rgba(10, 10, 18, 0.75)';
                ctx.fillRect(chartLeft + 4, y - 14, textWidth + 10, 18);

                // Draw label text
                ctx.fillStyle = level.isGoldenPocket ? '#ffd700' : '#e8e6e3';
                ctx.fillText(labelText, chartLeft + 9, y - 1);
            }
        }

        // 3. Draw Current Price Marker
        if (currentPrice && priceMap) {
            const cy = priceToPixel(currentPrice, priceMap);
            if (cy > 0 && cy < canvas.height) {
                ctx.setLineDash([]);
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2;
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(chartLeft, cy);
                ctx.lineTo(chartRight, cy);
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Label
                const cpText = `CURRENT: ${currentPrice.toLocaleString()}`;
                ctx.font = `bold 12px 'Orbitron', sans-serif`;
                const cpWidth = ctx.measureText(cpText).width;
                ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
                ctx.fillRect(chartRight - cpWidth - 14, cy - 16, cpWidth + 12, 20);
                ctx.fillStyle = '#00ffff';
                ctx.fillText(cpText, chartRight - cpWidth - 8, cy - 2);
            }
        }

        ctx.setLineDash([]);
    }, [image, fibLevels, priceMap, currentPrice]);

    if (!image) return null;

    return (
        <div className="panel panel-chart" id="chartPanel">
            <div className="panel-header">
                <span className="panel-tag">PREVIEW</span>
                <h2>CHART ANALYSIS</h2>
                <div id="assetBadgeContainer">
                    {assetInfo && (
                        <AssetBadge info={assetInfo} onEditClick={onEditAsset} />
                    )}
                </div>
            </div>
            <div className="chart-container">
                <canvas id="chartCanvas" ref={canvasRef}></canvas>
            </div>
        </div>
    );
};

export default ChartPreview;
