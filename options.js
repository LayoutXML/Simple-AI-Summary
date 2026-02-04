const api = (typeof browser !== 'undefined') ? browser : chrome;

const saveOptions = () => {
    const provider = document.getElementById('provider').value;
    const prompt = document.getElementById('prompt').value;
    const urlLimit = document.getElementById('urlLimit').value;
    let customProviderUrl = document.getElementById('customProviderUrl').value.trim();

    if (customProviderUrl && !/^https?:\/\//i.test(customProviderUrl)) {
        customProviderUrl = 'https://' + customProviderUrl;
        document.getElementById('customProviderUrl').value = customProviderUrl;
    }

    const customUrlParam = document.getElementById('customUrlParam').value;
    const customSelector = document.getElementById('customSelector').value;

    api.storage.sync.set({
        favoriteProvider: provider,
        customPrompt: prompt,
        urlLimit: urlLimit,
        customProviderUrl: customProviderUrl,
        customUrlParam: customUrlParam,
        customSelector: customSelector
    }, () => {
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        status.style.opacity = '1';
        setTimeout(() => status.style.opacity = '0', 750);
        updatePreview();
    });
};

const restoreOptions = () => {
    api.storage.sync.get({
        favoriteProvider: 'chatgpt',
        customPrompt: 'Summarize this text into 3-5 bullet points:',
        urlLimit: 8000,
        customProviderUrl: '',
        customUrlParam: '',
        customSelector: ''
    }, (items) => {
        document.getElementById('provider').value = items.favoriteProvider;
        document.getElementById('prompt').value = items.customPrompt;
        document.getElementById('urlLimit').value = items.urlLimit;
        document.getElementById('customProviderUrl').value = items.customProviderUrl;
        document.getElementById('customUrlParam').value = items.customUrlParam;
        document.getElementById('customSelector').value = items.customSelector;

        toggleCustomSettings();
        updatePreview();
    });
};

const toggleCustomSettings = () => {
    const provider = document.getElementById('provider').value;
    document.getElementById('custom-settings').style.display = provider === 'custom' ? 'block' : 'none';
    updatePreview();
};

const updatePreview = () => {
    const providerUrl = document.getElementById('customProviderUrl').value.trim();
    const urlParam = document.getElementById('customUrlParam').value.trim();
    const prompt = document.getElementById('prompt').value.trim();
    let previewText = "Enter a URL";

    if (providerUrl) {
        let url = providerUrl;
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

        if (urlParam) {
            const content = encodeURIComponent(`${prompt}\n"sample text"`);
            previewText = `${url}?${urlParam}=${content}`;
        } else {
            previewText = url;
        }
    }
    document.getElementById('urlPreview').textContent = previewText;
};

const resetOptions = () => {
    const defaults = {
        favoriteProvider: 'chatgpt',
        customPrompt: 'Summarize this text into 3-5 bullet points:',
        urlLimit: 8000,
        customProviderUrl: '',
        customUrlParam: '',
        customSelector: ''
    };

    api.storage.sync.set(defaults, () => {
        restoreOptions();
        const status = document.getElementById('status');
        status.textContent = 'Reset to defaults.';
        status.style.opacity = '1';
        setTimeout(() => status.style.opacity = '0', 1000);
    });
};

document.addEventListener('DOMContentLoaded', () => {
    restoreOptions();
    document.getElementById('save').addEventListener('click', saveOptions);
    document.getElementById('reset').addEventListener('click', resetOptions);
    document.getElementById('provider').addEventListener('change', toggleCustomSettings);
    document.getElementById('customProviderUrl').addEventListener('input', updatePreview);
    document.getElementById('customUrlParam').addEventListener('input', updatePreview);
    document.getElementById('prompt').addEventListener('input', updatePreview);
});
