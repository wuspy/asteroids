export interface UIEvents {
    start: () => void;
    quit: () => void;
    pause: () => void;
    resume: () => void;
    openAbout: () => void;
    closeAbout: () => void;
    openSaveScore: () => void;
    closeSaveScore: (saved: boolean) => void;
    openLeaderboard: () => void;
    closeLeaderboard: () => void;
}
