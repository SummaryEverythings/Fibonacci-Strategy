import React, { useCallback, useEffect } from 'react';

const UploadPanel = ({ onImageLoaded, isLoading, loadingText, progress }) => {
    const handleFile = useCallback((file) => {
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => onImageLoaded(img);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }, [onImageLoaded]);

    const onFileInputChange = (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
    };

    // Setup Paste Event Listener
    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) handleFile(file);
                    break;
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [handleFile]);

    return (
        <div className="panel panel-upload" id="uploadPanel">
            <div className="panel-header">
                <span className="panel-tag">INPUT</span>
                <h2>UPLOAD CHART</h2>
            </div>

            {!isLoading && (
                <div
                    className="drop-zone"
                    id="dropZone"
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                >
                    <div className="drop-zone-content">
                        <div className="drop-icon">📊</div>
                        <p className="drop-text">Drag & drop screenshot chart di sini</p>
                        <p className="drop-sub">atau <label htmlFor="fileInput" className="file-label">pilih file</label> • Ctrl+V untuk paste</p>
                        <input
                            type="file"
                            id="fileInput"
                            accept="image/*"
                            hidden
                            onChange={onFileInputChange}
                        />
                    </div>
                    <div className="drop-zone-border" aria-hidden="true"></div>
                </div>
            )}

            {isLoading && (
                <div className="loading-state" id="loadingState">
                    <div className="loader-ring"></div>
                    <p className="loading-text" id="loadingText">{loadingText}</p>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            id="progressFill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadPanel;
