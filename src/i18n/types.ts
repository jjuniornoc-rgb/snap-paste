export type SupportedLocale = 
  | 'en'     // English (Standard/Default)
  | 'pt-BR'  // Portuguese (Brazil)
  | 'es'     // Spanish
  | 'ru'     // Russian
  | 'uk'     // Ukrainian
  | 'zh'     // Chinese Simplified
  | 'ko'     // Korean
  | 'ja';    // Japanese

export interface LocaleMeta {
  code: SupportedLocale;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleMeta[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)', nativeLabel: 'Português (BR)', flag: '🇧🇷' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺' },
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська', flag: '🇺🇦' },
  { code: 'zh', label: 'Chinese (Simplified)', nativeLabel: '简体中文', flag: '🇨🇳' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', flag: '🇰🇷' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵' },
];

export interface TranslationSchema {
  common: {
    appName: string;
    tagline: string;
    close: string;
    cancel: string;
    confirm: string;
    apply: string;
    save: string;
    copy: string;
    copied: string;
    download: string;
    share: string;
    delete: string;
    back: string;
    next: string;
    loading: string;
    success: string;
    error: string;
    or: string;
  };
  nav: {
    paste: string;
    justSketch: string;
    myClips: string;
    search: string;
    tour: string;
    localPrivacy: string;
    language: string;
    switchLanguage: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    pressKey: string;
    orDrag: string;
    pasteClipboard: string;
    browseFile: string;
    captureScreen: string;
    captureScreenSub: string;
    takePhoto: string;
    takePhotoSub: string;
    justSketch: string;
    justSketchSub: string;
    sampleDemo: string;
    sampleDemoSub: string;
    privacyCard1Title: string;
    privacyCard1Desc: string;
    privacyCard2Title: string;
    privacyCard2Desc: string;
    privacyCard3Title: string;
    privacyCard3Desc: string;
  };
  editor: {
    back: string;
    copyImage: string;
    saveClip: string;
    download: string;
    share: string;
    frame: string;
    zoom: string;
    zoomReset: string;
    undo: string;
    redo: string;
    clear: string;
    panTip: string;
    tools: {
      brush: string;
      highlighter: string;
      arrow: string;
      rectangle: string;
      circle: string;
      text: string;
      censor: string;
      step: string;
      magnifier: string;
      dimension: string;
      callout: string;
      crop: string;
    };
    crop: {
      free: string;
      ratio1x1: string;
      ratio16x9: string;
      ratio4x3: string;
      ratio9x16: string;
      ratio3x2: string;
      apply: string;
      cancel: string;
    };
    textModal: {
      title: string;
      placeholder: string;
      fontSize: string;
      darkBg: string;
      cleanText: string;
      insert: string;
      cancel: string;
    };
    toasts: {
      copied: string;
      copyError: string;
      saved: string;
      cleared: string;
      historyEmpty: string;
    };
  };
  tour: {
    stepOf: string;
    skip: string;
    back: string;
    next: string;
    finish: string;
    peek: string;
    steps: {
      dropzone: { title: string; desc: string; badge: string };
      captureTools: { title: string; desc: string; badge: string };
      justSketch: { title: string; desc: string; badge: string };
      editorCanvas: { title: string; desc: string; badge: string };
      editorToolsGroup: { title: string; desc: string; badge: string };
      toolText: { title: string; desc: string; badge: string };
      toolCensor: { title: string; desc: string; badge: string };
      toolStep: { title: string; desc: string; badge: string };
      toolCrop: { title: string; desc: string; badge: string };
      editorPalette: { title: string; desc: string; badge: string };
      editorTopActions: { title: string; desc: string; badge: string };
      clipsHeader: { title: string; desc: string; badge: string };
      clipsSearch: { title: string; desc: string; badge: string };
    };
  };
  clips: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    all: string;
    emptyTitle: string;
    emptySubtitle: string;
    clearAll: string;
    openEditor: string;
    deleteClip: string;
  };
  palette: {
    placeholder: string;
    navigateGuide: string;
    executeGuide: string;
    title: string;
    actions: {
      paste: string;
      sketch: string;
      clips: string;
      tour: string;
      webcam: string;
      sample: string;
    };
    languageSection: string;
  };
  cookies: {
    badge: string;
    title: string;
    description: string;
    acceptTour: string;
    acceptOnly: string;
  };
  webcam: {
    title: string;
    subtitle: string;
    capture: string;
    switchCamera: string;
    starting: string;
    error: string;
  };
}
