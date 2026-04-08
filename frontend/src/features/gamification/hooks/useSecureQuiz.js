import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

const MAX_VIOLATIONS = 3;

/**
 * useSecureQuiz — Anti-cheating hook for exam-mode quiz security.
 * 
 * Features:
 * - Fullscreen enforcement
 * - Tab-switch & window-blur detection
 * - Copy/Paste/Cut/Right-click blocking
 * - Keyboard shortcut blocking (Ctrl+C, Ctrl+V, F12, Ctrl+Shift+I, etc.)
 * - Auto-terminate after MAX_VIOLATIONS
 * 
 * @param {boolean} isActive - Whether security monitoring is active (true when PLAYING)
 * @param {Function} onMaxViolations - Callback fired when max violations reached (auto-submit)
 */
export const useSecureQuiz = (isActive, onMaxViolations) => {
    const [violations, setViolations] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const violationsRef = useRef(0); // Ref to avoid stale closures
    const hasBeenFullscreenRef = useRef(false); // Track if fullscreen was ever successfully entered

    // Keep ref in sync with state
    useEffect(() => {
        violationsRef.current = violations;
    }, [violations]);

    // Reset fullscreen tracking when security becomes inactive
    useEffect(() => {
        if (!isActive) {
            hasBeenFullscreenRef.current = false;
        }
    }, [isActive]);

    // --- Violation Handler ---
    const addViolation = useCallback((reason) => {
        const newCount = violationsRef.current + 1;
        violationsRef.current = newCount;
        setViolations(newCount);

        if (newCount >= MAX_VIOLATIONS) {
            toast.error('⛔ Maximum violations reached! Quiz is being auto-submitted.', {
                duration: 5000,
                icon: '🚫',
            });
            onMaxViolations?.();
        } else {
            const remaining = MAX_VIOLATIONS - newCount;
            toast.error(
                `⚠️ Warning: ${reason}. Violation ${newCount}/${MAX_VIOLATIONS}. ${remaining} remaining before auto-submit!`,
                { duration: 4000, icon: '🚨' }
            );
        }
    }, [onMaxViolations]);

    // --- Enter Fullscreen ---
    const enterFullscreen = useCallback(async () => {
        try {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                await elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                await elem.msRequestFullscreen();
            }
        } catch (err) {
            console.warn('Fullscreen request failed:', err);
        }
    }, []);

    // --- Exit Secure Mode (cleanup) ---
    const exitSecureMode = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen?.().catch(() => { });
        }
    }, []);

    // --- Fullscreen Change Detection ---
    useEffect(() => {
        if (!isActive) return;

        const handleFullscreenChange = () => {
            const isFull = !!document.fullscreenElement;
            setIsFullscreen(isFull);

            if (isFull) {
                // Fullscreen was successfully entered (either initial or re-entry)
                hasBeenFullscreenRef.current = true;
            } else if (!isFull && isActive && hasBeenFullscreenRef.current) {
                // Student EXITED fullscreen after it was previously active — this is a real violation
                addViolation('Exited fullscreen');
                // Try to re-enter fullscreen
                setTimeout(() => enterFullscreen(), 500);
            }
            // If !isFull && !hasBeenFullscreenRef.current => still entering for the first time, no violation
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, [isActive, addViolation, enterFullscreen]);

    // --- Tab Visibility / Window Blur Detection ---
    useEffect(() => {
        if (!isActive) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                addViolation('Switched tab or minimized window');
            }
        };

        const handleWindowBlur = () => {
            addViolation('Left the quiz window');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [isActive, addViolation]);

    // --- Copy / Paste / Cut / Right-Click Blocking ---
    useEffect(() => {
        if (!isActive) return;

        const blockEvent = (e) => {
            e.preventDefault();
            toast('🚫 This action is disabled during the quiz.', {
                icon: '⛔',
                duration: 2000,
            });
        };

        const handleContextMenu = (e) => {
            e.preventDefault();
        };

        document.addEventListener('copy', blockEvent);
        document.addEventListener('paste', blockEvent);
        document.addEventListener('cut', blockEvent);
        document.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('copy', blockEvent);
            document.removeEventListener('paste', blockEvent);
            document.removeEventListener('cut', blockEvent);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [isActive]);

    // --- Keyboard Shortcut Blocking ---
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e) => {
            // Block F12 (DevTools)
            if (e.key === 'F12') {
                e.preventDefault();
                return;
            }

            // Block Ctrl+Shift+I (DevTools), Ctrl+Shift+J (Console), Ctrl+U (View Source)
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
                e.preventDefault();
                return;
            }

            if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
                e.preventDefault();
                return;
            }

            // Block Ctrl+C, Ctrl+V, Ctrl+X
            if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
                e.preventDefault();
                return;
            }

            // Block Ctrl+A (Select All)
            if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
                e.preventDefault();
                return;
            }

            // Block PrintScreen
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                return;
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [isActive]);

    return {
        violations,
        maxViolations: MAX_VIOLATIONS,
        isFullscreen,
        enterFullscreen,
        exitSecureMode,
    };
};
