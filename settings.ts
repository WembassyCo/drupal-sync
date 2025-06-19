import { App, PluginSettingTab, Setting } from "obsidian";
import DrupalSyncPlugin from "./main";

export interface DrupalSyncSettings {
  siteUrl: string;
  username: string;
  password: string;
  nodeType: string;
  bodyFormat: string;
}

export const DEFAULT_SETTINGS: DrupalSyncSettings = {
  siteUrl: "https://example.com",
  username: "",
  password: "",
  nodeType: "article",
  bodyFormat: "restricted_html",
};

export class DrupalSyncSettingTab extends PluginSettingTab {
  plugin: DrupalSyncPlugin;

  constructor(app: App, plugin: DrupalSyncPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl("h2", { text: "Drupal Sync Settings" });

    const instructions = containerEl.createEl("div");
    instructions.addClass("drupal-sync-instructions");
    instructions.innerHTML = `
      <h3>Drupal Setup Instructions</h3>
      <p>To allow this plugin to create and update nodes, you must:</p>
      <ol>
        <li>Enable the <strong>REST</strong>, <strong>Basic Auth</strong>, and <strong>Serialization</strong> core modules.</li>
        <li>Go to <code>/admin/config/services/rest</code> and ensure the <strong>Content</strong> resource is enabled.</li>
        <li>Configure the Content resource with:
          <ul>
            <li><strong>POST</strong> and <strong>PATCH</strong> methods enabled</li>
            <li><strong>json</strong> format accepted</li>
            <li><strong>basic_auth</strong> as an authentication provider</li>
          </ul>
        </li>
        <li>Ensure your user has permissions:
          <ul>
            <li><em>Access POST/PATCH on Content resource</em></li>
            <li><em>Create and edit content</em> for your desired node type (e.g., article or blog)</li>
          </ul>
        </li>
        <li>Use <code>https://your-site.com/node?_format=json</code> as the endpoint in plugin settings.</li>
      </ol>
    `;


    new Setting(containerEl)
      .setName("Drupal Site URL")
      .setDesc("e.g. https://example.com, do not include the Trailing `/`")
      .addText((text) =>
        text
          .setPlaceholder("Enter your Drupal site URL. Do not include the Trailing `/`")
          .setValue(this.plugin.settings.siteUrl)
          .onChange(async (value) => {
            this.plugin.settings.siteUrl = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Username")
      .setDesc("Drupal username used for authentication")
      .addText((text) =>
        text
          .setPlaceholder("Enter username")
          .setValue(this.plugin.settings.username)
          .onChange(async (value) => {
            this.plugin.settings.username = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Password")
      .setDesc("Drupal password used for authentication")
      .addText((text) =>
        text
          .setPlaceholder("Enter password")
          .setValue(this.plugin.settings.password)
          .onChange(async (value) => {
            this.plugin.settings.password = value;
            await this.plugin.saveSettings();
          })
          .inputEl.setAttr("type", "password")
      );

    new Setting(containerEl)
      .setName("Node Type")
      .setDesc("Drupal node type to create (e.g., article, page)")
      .addText((text) =>
        text
          .setPlaceholder("Enter node type")
          .setValue(this.plugin.settings.nodeType)
          .onChange(async (value) => {
            this.plugin.settings.nodeType = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Body Format")
      .setDesc("Format to use for the body field")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            plain_text: "Plain Text",
            filtered_html: "Filtered HTML",
            restricted_html: "Restricted HTML",
            full_html: "Full HTML",
          })
          .setValue(this.plugin.settings.bodyFormat)
          .onChange(async (value) => {
            this.plugin.settings.bodyFormat = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
