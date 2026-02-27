import React, { useState, useEffect } from 'react';
import { formatPrice } from '../utils/helpers.js';

const InsightCard = ({ insight, assetType = 'crypto' }) => {
    const [typedNarrative, setTypedNarrative] = useState('');

    // Typing animation effect for the narrative
    useEffect(() => {
        if (!insight || !insight.narrative) {
            setTypedNarrative('');
            return;
        }

        let currentText = '';
        let index = 0;

        // Clear previous
        setTypedNarrative('');

        const interval = setInterval(() => {
            if (index < insight.narrative.length) {
                currentText += insight.narrative[index];
                setTypedNarrative(currentText);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 18); // 18ms per char

        return () => clearInterval(interval);
    }, [insight]);

    if (!insight) return null;

    return (
        <div className="panel panel-insight" id="insightPanel">
            <div className="panel-header">
                <span className="panel-tag">INSIGHT</span>
                <h2>REKOMENDASI TRADING</h2>
            </div>

            <div className="insight-body" id="insightBody">
                <div className="insight-zone">
                    <span className={`insight-sentiment ${insight.sentiment}`}>
                        {insight.sentiment ? insight.sentiment.toUpperCase() : ''}
                    </span>
                    <span className="insight-zone-label">
                        ZONA: {insight.zone ? insight.zone.replace('_', ' ').toUpperCase() : ''}
                    </span>
                </div>

                <div className="insight-narrative">
                    {typedNarrative}
                </div>

                <div className="insight-targets">
                    {insight.nearestLevel && (
                        <div className="insight-target-card nearest">
                            <div className="target-label">Level Terdekat ({insight.nearestLevel.label})</div>
                            <div className="target-value">{formatPrice(insight.nearestLevel.price, assetType)}</div>
                        </div>
                    )}

                    {insight.nextTarget && (
                        <div className="insight-target-card next">
                            <div className="target-label">Target Berikutnya ({insight.nextTarget.label})</div>
                            <div className="target-value">{formatPrice(insight.nextTarget.price, assetType)}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InsightCard;
