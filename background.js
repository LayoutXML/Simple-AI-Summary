const api = (typeof browser !== 'undefined') ? browser : chrome;

const PROVIDERS = {
    chatgpt: {
        url: "https://chatgpt.com/",
        urlParam: "q",
        maxLength: 8000,
        selector: "#prompt-textarea, [data-id='root']"
    },
    gemini: {
        url: "https://gemini.google.com/app",
        urlParam: "prompt",
        maxLength: 8000,
        selector: ".ql-editor, [contenteditable='true']"
    },
    perplexity: {
        url: "https://www.perplexity.ai/",
        urlParam: "q",
        maxLength: 4000,
        selector: "#ask-input"
    },
    claude: {
        url: "https://claude.ai/new",
        urlParam: null,
        maxLength: 0,
        selector: "[contenteditable='true']"
    }
};

api.runtime.onInstalled.addListener(() => {
    api.contextMenus.create({
        id: "simple-ai-summary",
        title: "Summarize",
        contexts: ["selection"]
    });
});

if (api.action) {
    api.action.onClicked.addListener(() => api.runtime.openOptionsPage());
} else {
    api.browserAction.onClicked.addListener(() => api.runtime.openOptionsPage());
}

api.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "simple-ai-summary" || !info.selectionText) return;

    try {
        const settings = await api.storage.sync.get({
            favoriteProvider: 'chatgpt',
            customPrompt: 'Summarize this text into 3-5 bullet points:',
            urlLimit: 8000,
            customProviderUrl: '',
            customUrlParam: '',
            customSelector: ''
        });

        let config;
        if (settings.favoriteProvider === 'custom') {
            config = {
                url: settings.customProviderUrl,
                urlParam: settings.customUrlParam,
                maxLength: parseInt(settings.urlLimit, 10),
                selector: settings.customSelector
            };
        } else {
            const key = PROVIDERS[settings.favoriteProvider] ? settings.favoriteProvider : 'chatgpt';
            config = { ...PROVIDERS[key] };
            config.maxLength = parseInt(settings.urlLimit, 10);
        }

        const text = `${settings.customPrompt}\n"${info.selectionText}"`;
        const useUrl = config.urlParam && text.length < config.maxLength;

        if (useUrl) {
            const url = `${config.url}?${config.urlParam}=${encodeURIComponent(text)}`;
            await api.tabs.create({ url });
        } else {
            if (!config.url) return;
            const newTab = await api.tabs.create({ url: config.url, active: true });

            const listener = (tabId, changeInfo) => {
                if (tabId === newTab.id && changeInfo.status === 'complete') {
                    api.tabs.onUpdated.removeListener(listener);
                    api.scripting.executeScript({
                        target: { tabId },
                        func: inject,
                        args: [text, config.selector]
                    }).catch(() => { });
                }
            };
            api.tabs.onUpdated.addListener(listener);
        }
    } catch (e) { }
});

function inject(text, selector) {
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        const el = document.querySelector(selector);
        if (el) {
            clearInterval(interval);
            if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                el.value = text;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                el.innerText = text;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }
            el.focus();
        } else if (attempts >= 20) {
            clearInterval(interval);
        }
    }, 500);
}
