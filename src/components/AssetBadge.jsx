import React from 'react';

const AssetBadge = ({ info, onEditClick }) => {
    if (!info || !info.name) return null;

    const icon = info.type === 'crypto' ? '₿' : info.type === 'forex' ? '$' : '📈';
    let confClass = 'low';

    if (info.confidence > 80) confClass = 'high';
    else if (info.confidence > 50) confClass = 'med';

    return (
        <div className="asset-detected">
            <div className="asset-icon">{icon}</div>
            <div className="asset-desc">
                <span className="asset-name">{info.name}</span>
                <span className="asset-conf">
                    <span className={`conf-dot ${confClass}`}></span>
                    {Math.round(info.confidence)}% conf
                </span>
            </div>
            <button className="btn-icon" onClick={onEditClick} title="Edit Aset">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
            </button>
        </div>
    );
};

export default AssetBadge;
