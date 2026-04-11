import React from 'react';
import './SplashScreen.css';

const SplashScreen: React.FC = () => {
    return (
        <div className="splash-screen">
            <div className="splash-content">
                <div className="splash-logo">🏫</div>
                <h1 className="splash-title">Smart Campus Ops Hub</h1>
                <div className="splash-subtitle">
                    Initializing Security Context
                    <div className="spinner-dots">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
