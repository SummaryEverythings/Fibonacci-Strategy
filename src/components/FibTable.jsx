import React from 'react';
import { formatPrice } from '../utils/helpers.js';

const FibTable = ({ levels, currentPrice, assetType = 'crypto' }) => {
    if (!levels || levels.length === 0) return null;

    // Find current zone (nearest level to current price)
    let currentZoneLevel = null;
    if (currentPrice != null) {
        let minDist = Infinity;
        for (const lvl of levels) {
            const d = Math.abs(currentPrice - lvl.price);
            if (d < minDist) {
                minDist = d;
                currentZoneLevel = lvl.level;
            }
        }
    }

    return (
        <div className="panel panel-fib" id="fibPanel">
            <div className="panel-header">
                <span className="panel-tag">LEVELS</span>
                <h2>FIBONACCI RETRACEMENT</h2>
            </div>
            <div className="fib-table-wrap">
                <table className="fib-table" id="fibTable">
                    <thead>
                        <tr>
                            <th>Level</th>
                            <th>Rasio</th>
                            <th>Harga</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {levels.map((lvl, i) => {
                            const isGoldenPocket = lvl.isGoldenPocket;
                            const isCurrentZone = lvl.level === currentZoneLevel;

                            let rowClass = '';
                            if (isGoldenPocket) rowClass += ' golden-pocket';
                            if (isCurrentZone) rowClass += ' current-zone';

                            let statusText = '';
                            let statusClass = '';

                            if (currentPrice != null) {
                                if (currentPrice > lvl.price) {
                                    statusText = 'Di atas';
                                    statusClass = 'text-green';
                                } else if (currentPrice < lvl.price) {
                                    statusText = 'Di bawah';
                                    statusClass = 'text-red';
                                } else {
                                    statusText = 'Tepat di level';
                                    statusClass = 'text-gold';
                                }
                            }

                            return (
                                <tr
                                    key={i}
                                    className={rowClass.trim()}
                                    style={isGoldenPocket ? { position: 'relative' } : {}}
                                >
                                    <td className="cell-level">
                                        {lvl.label}
                                        {isGoldenPocket && <span className="text-gold"> ★ GOLDEN POCKET</span>}
                                    </td>
                                    <td className="cell-ratio">{lvl.level.toFixed(3)}</td>
                                    <td className="cell-price">{formatPrice(lvl.price, assetType)}</td>
                                    <td className={`cell-status ${statusClass}`}>{statusText}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FibTable;
