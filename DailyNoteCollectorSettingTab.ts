import { App, PluginSettingTab, Setting } from "obsidian";
import DailyNoteCollectorPlugin from "./main";

export class DailyNoteCollectorSettingTab extends PluginSettingTab {
	plugin: DailyNoteCollectorPlugin;
	private isFileTypesContainerOpen = false; // Default to closed

	constructor(app: App, plugin: DailyNoteCollectorPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		// Initial state based on settings: open if not "Only Markdown" mode
		const settings = this.plugin.settings;
		// Check if settings are loaded. It's possible they aren't available yet in the constructor.
		// If not available, isFileTypesContainerOpen will retain its default 'false'.
		if (settings) {
			const isEffectivelyOnlyMarkdown =
				settings.collectMarkdown &&
				!settings.collectImages &&
				!settings.collectPdfs &&
				!settings.collectAudio &&
				!settings.collectVideos &&
				!settings.collectExcalidraw &&
				!settings.collectOther;
			this.isFileTypesContainerOpen = !isEffectivelyOnlyMarkdown;
		}
	}

	display(): void {
		const { containerEl } = this;
		const settings = this.plugin.settings;

		containerEl.empty();

		const isEffectivelyOnlyMarkdown =
			settings.collectMarkdown &&
			!settings.collectImages &&
			!settings.collectPdfs &&
			!settings.collectAudio &&
			!settings.collectVideos &&
			!settings.collectExcalidraw &&
			!settings.collectOther;

		new Setting(containerEl)
			.setName("Only Markdown")
			.setDesc(
				"Only collect markdown files. Exclude images, videos, etc."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(isEffectivelyOnlyMarkdown)
					.onChange(async (value) => {
						if (value) {
							settings.collectMarkdown = true;
							settings.collectImages = false;
							settings.collectPdfs = false;
							settings.collectAudio = false;
							settings.collectVideos = false;
							settings.collectExcalidraw = false;
							settings.collectOther = false;
						} else {
							settings.collectMarkdown = true;
							settings.collectImages = true;
							settings.collectPdfs = true;
							settings.collectAudio = true;
							settings.collectVideos = true;
							settings.collectExcalidraw = true;
							settings.collectOther = true;
						}
						await this.plugin.saveSettings();
						this.display();
					})
			);

		const fileTypesContainer = containerEl.createEl("details");
		fileTypesContainer.open = this.isFileTypesContainerOpen;
		fileTypesContainer.addEventListener("toggle", () => {
			this.isFileTypesContainerOpen = fileTypesContainer.open;
		});

		fileTypesContainer.createEl("summary", {
			text: "Individual File Types to Collect",
		});

		new Setting(fileTypesContainer)
			.setName("Markdown (.md)")
			.setDesc("Collect markdown files")
			.addToggle((toggle) => {
				toggle
					.setValue(settings.collectMarkdown ?? true)
					.setDisabled(isEffectivelyOnlyMarkdown)
					.onChange(async (value) => {
						settings.collectMarkdown = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		new Setting(fileTypesContainer)
			.setName("Images (.png, .jpg, etc)")
			.setDesc("Collect image files")
			.addToggle((toggle) => {
				toggle
					.setValue(settings.collectImages ?? true)
					.setDisabled(isEffectivelyOnlyMarkdown)
					.onChange(async (value) => {
						settings.collectImages = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		new Setting(fileTypesContainer)
			.setName("PDFs (.pdf)")
			.setDesc("Collect PDF files")
			.addToggle((toggle) => {
				toggle
					.setValue(settings.collectPdfs ?? true)
					.setDisabled(isEffectivelyOnlyMarkdown)
					.onChange(async (value) => {
						settings.collectPdfs = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		new Setting(fileTypesContainer)
			.setName("Audio (.mp3, .wav, etc)")
			.setDesc("Collect audio files")
			.addToggle((toggle) => {
				toggle
					.setValue(settings.collectAudio ?? true)
					.setDisabled(isEffectivelyOnlyMarkdown)
					.onChange(async (value) => {
						settings.collectAudio = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		new Setting(fileTypesContainer)
			.setName("Videos (.mp4, etc)")
			.setDesc("Collect video files")
			.addToggle((toggle) => {
				toggle
					.setValue(settings.collectVideos ?? true)
					.setDisabled(isEffectivelyOnlyMarkdown)
					.onChange(async (value) => {
						settings.collectVideos = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		new Setting(fileTypesContainer)
			.setName("Excalidraw (.excalidraw)")
			.setDesc("Collect Excalidraw files")
			.addToggle((toggle) => {
				toggle
					.setValue(settings.collectExcalidraw ?? true)
					.setDisabled(isEffectivelyOnlyMarkdown)
					.onChange(async (value) => {
						settings.collectExcalidraw = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		new Setting(fileTypesContainer)
			.setName("Other Files")
			.setDesc(
				createFragment((el) => {
					el.createSpan({
						text: "Collect any other file types not listed above. If you want to include a file type that is not listed, please open an issue on ",
					});
					el.createEl("a", {
						text: "GitHub",
						href: "https://github.com/LA/obsidian-daily-note-collector/issues/new?title=File%20Type%20Support%20Request&body=File%20Type%3A%20%0A%0AFile%20Extension(s)%3A%20",
					});
					el.createSpan({ text: "." });
				})
			)
			.addToggle((toggle) => {
				toggle
					.setValue(settings.collectOther ?? false) // Defaulting this to false in UI as well
					.setDisabled(isEffectivelyOnlyMarkdown)
					.onChange(async (value) => {
						settings.collectOther = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});
	}
}
