import React, { useState } from 'react';
import { X, Lock, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './ProfileModal.css';

interface ProfileModalProps {
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
    const { currentUser, updateUserPassword } = useAuth();
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        try {
            setLoading(true);
            await updateUserPassword(newPassword);
            setSuccessMessage('Password successfully updated!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            // Usually catching 'auth/requires-recent-login' here
            if (err.code === 'auth/requires-recent-login') {
                setError('For security reasons, please log out and log back in before updating your password.');
            } else {
                setError(err.message || 'Failed to update password.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content profile-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}><X size={20} /></button>
                
                <h2>My Profile</h2>
                
                <div className="profile-info-section">
                    <img 
                        src={currentUser?.photoURL || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                        alt="Profile" 
                        className="profile-avatar-large" 
                    />
                    <div className="profile-details">
                        <p className="profile-email">{currentUser?.email}</p>
                        <p className="profile-uid">ID: {currentUser?.uid.substring(0, 8)}...</p>
                    </div>
                </div>

                <div className="divider" />

                <div className="password-update-section">
                    <h3>Update Password</h3>
                    {error && <div className="error-message">{error}</div>}
                    {successMessage && <div className="success-message"><CheckCircle size={16} /> {successMessage}</div>}
                    
                    <form onSubmit={handlePasswordUpdate} className="password-form">
                        <div className="input-group">
                            <Lock size={16} className="input-icon" />
                            <input 
                                type="password" 
                                placeholder="New Password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <Lock size={16} className="input-icon" />
                            <input 
                                type="password" 
                                placeholder="Confirm New Password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="save-btn" disabled={loading}>
                            {loading ? 'Updating...' : 'Save Password'} <Save size={16} className="btn-icon" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
