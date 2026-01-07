export interface DailyNoteCollectorPluginSettings {
	collectMarkdown: boolean;
	collectImages: boolean;
	collectPdfs: boolean;
	collectAudio: boolean;
	collectVideos: boolean;
	collectExcalidraw: boolean;
	collectOther: boolean;
	useEmbeddedLinks: boolean;
	excludePattern: string;
	insertAfterHeading: string;
}

export const DEFAULT_SETTINGS: DailyNoteCollectorPluginSettings = {
	collectMarkdown: true,
	collectImages: true,
	collectPdfs: true,
	collectAudio: true,
	collectVideos: true,
	collectExcalidraw: true,
	collectOther: true,
	useEmbeddedLinks: false,
	excludePattern: "",
	insertAfterHeading: "",
};
