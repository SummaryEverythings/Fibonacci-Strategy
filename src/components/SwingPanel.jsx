import React from 'react';
import { formatPrice } from '../utils/helpers.js';

const SwingCard = ({ icon, label, value, cls, onEdit }) => {
    return (
        <div className={`swing-card ${cls}`}>
            <div className="swing-icon">{icon}</div>
            <div className="swing-label">{label}</div>
            <div className="swing-value">{value}</div>
            {onEdit && (
                <button className="swing-edit-btn" title="Edit manual" onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                }}>
                    ✏️ Edit
                </button>
            )}
        </div>
    );
};

const SwingPanel = ({ swingHigh, swingLow, assetType = 'crypto', onEdit }) => {
    if (swingHigh == null || swingLow == null) return null;

    const range = swingHigh - swingLow;

    return (
        <div className="panel panel-swing" id="swingPanel">
            <div className="panel-header">
                <span className="panel-tag">DETECTED</span>
                <h2>SWING POINTS</h2>
            </div>
            <div className="swing-grid" id="swingGrid">
                <SwingCard
                    icon="▲"
                    label="SWING HIGH"
                    value={formatPrice(swingHigh, assetType)}
                    cls="high"
                    onEdit={onEdit}
                />
                <SwingCard
                    icon="▼"
                    label="SWING LOW"
                    value={formatPrice(swingLow, assetType)}
                    cls="low"
                    onEdit={onEdit}
                />
                <SwingCard
                    icon="↕"
                    label="RANGE"
                    value={formatPrice(range, assetType)}
                    cls="range"
                />
            </div>
        </div>
    );
};

export default SwingPanel;
