import React, { useState, useEffect } from 'react';

const ManualModal = ({ isOpen, onClose, onSubmit, initialAssetType = 'crypto' }) => {
    const [high, setHigh] = useState('');
    const [low, setLow] = useState('');
    const [current, setCurrent] = useState('');
    const [assetType, setAssetType] = useState(initialAssetType);
    const [error, setError] = useState(false);

    // Sync initial prop
    useEffect(() => {
        setAssetType(initialAssetType);
    }, [initialAssetType]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        const h = parseFloat(high);
        const l = parseFloat(low);
        const c = parseFloat(current) || null;

        if (isNaN(h) || isNaN(l) || h <= l) {
            setError(true);
            return;
        }

        setError(false);
        onSubmit({ high: h, low: l, current: c, assetType });
    };

    const handleOverlayClick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" id="manualModal" onClick={handleOverlayClick}>
            <div className="modal-content">
                <div className="panel-header">
                    <span className="panel-tag">MANUAL</span>
                    <h2>INPUT DATA</h2>
                </div>
                <p className="modal-desc">OCR gagal mendeteksi otomatis atau di-edit. Silakan input data secara manual:</p>

                <div className="modal-fields">
                    <div className="field-group">
                        <label htmlFor="manualHigh">Swing High</label>
                        <input
                            type="number"
                            id="manualHigh"
                            placeholder="cth: 69000"
                            step="any"
                            value={high}
                            onChange={e => setHigh(e.target.value)}
                            style={error && (isNaN(parseFloat(high)) || parseFloat(high) <= parseFloat(low)) ? { borderColor: '#ff2255' } : {}}
                        />
                    </div>

                    <div className="field-group">
                        <label htmlFor="manualLow">Swing Low</label>
                        <input
                            type="number"
                            id="manualLow"
                            placeholder="cth: 15000"
                            step="any"
                            value={low}
                            onChange={e => setLow(e.target.value)}
                            style={error && isNaN(parseFloat(low)) ? { borderColor: '#ff2255' } : {}}
                        />
                    </div>

                    <div className="field-group">
                        <label htmlFor="manualCurrent">Harga Saat Ini (opsional)</label>
                        <input
                            type="number"
                            id="manualCurrent"
                            placeholder="cth: 42500"
                            step="any"
                            value={current}
                            onChange={e => setCurrent(e.target.value)}
                        />
                    </div>

                    <div className="field-group">
                        <label htmlFor="manualAsset">Tipe Aset</label>
                        <select
                            id="manualAsset"
                            value={assetType}
                            onChange={e => setAssetType(e.target.value)}
                        >
                            <option value="crypto">₿ Crypto</option>
                            <option value="forex">$ Forex</option>
                            <option value="saham">📈 Saham</option>
                        </select>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleSubmit}>ANALISIS</button>
                    <button className="btn btn-ghost" onClick={onClose}>BATAL</button>
                </div>
            </div>
        </div>
    );
};

export default ManualModal;
