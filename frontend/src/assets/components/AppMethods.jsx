import React, { useState, useEffect } from 'react';
import { Fullscreen, ExitFullscreen, ToggleFullscreen } from "../../../wailsjs/go/main/App";

const WindowControls = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const handleToggleFullscreen = async () => {
        try {
            await ToggleFullscreen();
            setIsFullscreen(!isFullscreen);
        } catch (error) {
            console.error('Failed to toggle fullscreen:', error);
        }
    };

    const handleMinimize = async () => {
        try {
            await Minimize();
        } catch (error) {
            console.error('Failed to minimize:', error);
        }
    };

    const handleMaximize = async () => {
        try {
            await Maximize();
        } catch (error) {
            console.error('Failed to maximize:', error);
        }
    };

    const handleClose = async () => {
        try {
            await Close();
        } catch (error) {
            console.error('Failed to close:', error);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            WebkitAppRegion: 'no-drag' // Важно для кликабельных элементов в заголовке
        }}>
            {/* Кнопка сворачивания */}
            <button
                onClick={handleMinimize}
                style={{
                    width: '25px',
                    height: '25px',
                    background: '#f39c12',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: 'white'
                }}
            >
                −
            </button>

            {/* Кнопка разворачивания/полного экрана */}
            <button
                onClick={handleToggleFullscreen}
                style={{
                    width: '25px',
                    height: '25px',
                    background: '#27ae60',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: 'white'
                }}
            >
                {isFullscreen ? '⤢' : '⛶'}
            </button>

            {/* Кнопка закрытия */}
            <button
                onClick={handleClose}
                style={{
                    width: '25px',
                    height: '25px',
                    background: '#e74c3c',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: 'white'
                }}
            >
                ×
            </button>
        </div>
    );
};
// Now clearly implemented. There will be not so user-friendly interface
export default WindowControls;